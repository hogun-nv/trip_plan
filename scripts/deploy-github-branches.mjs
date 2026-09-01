import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const v1Root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspaceRoot = path.dirname(v1Root);
const projects = [
  { label: "V1", branch: "main", root: v1Root, suffix: "" },
  {
    label: "V2",
    branch: "v2",
    root: path.join(workspaceRoot, "nyc-couple-trip-v2-02"),
    suffix: "v2/",
  },
  {
    label: "V3",
    branch: "v3",
    root: path.join(workspaceRoot, "nyc-couple-trip-v2-03"),
    suffix: "v3/",
  },
];

class GitHubApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: options.cwd ?? v1Root,
    encoding: "utf8",
    env: { ...process.env, ...options.env },
    input: options.input,
    stdio: options.capture
      ? [options.input ? "pipe" : "ignore", "pipe", "pipe"]
      : "inherit",
    timeout: options.timeout ?? 120_000,
  })?.trim();
}

function normalizeRemote(value) {
  const url = value.trim().replace(/\.git$/, "");
  if (!/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(url)) {
    throw new Error("GitHub HTTPS 저장소 URL을 확인해 주세요.");
  }
  return `${url}.git`;
}

function parseRemote(remoteUrl) {
  const [owner, repo] = remoteUrl
    .replace(/^https:\/\/github\.com\//, "")
    .replace(/\.git$/, "")
    .split("/");
  return { owner, repo };
}

function hasGitHubCli() {
  try {
    run("gh", ["--version"], { capture: true });
    return true;
  } catch {
    return false;
  }
}

function getGitHubToken() {
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;

  if (hasGitHubCli()) {
    try {
      return run("gh", ["auth", "token", "--hostname", "github.com"], {
        capture: true,
      });
    } catch {
      // Fall through to Git's configured credential helper.
    }
  }

  try {
    const credential = run("git", ["credential", "fill"], {
      capture: true,
      input: "protocol=https\nhost=github.com\n\n",
      env: { GIT_TERMINAL_PROMPT: "0" },
    });
    const fields = Object.fromEntries(
      credential
        .split("\n")
        .map((line) => line.split(/=(.*)/s))
        .filter((parts) => parts.length >= 2),
    );
    return fields.password || "";
  } catch {
    return "";
  }
}

async function githubRequest(owner, repo, suffix = "", options = {}) {
  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}${suffix}`,
    {
      method: options.method ?? "GET",
      signal: AbortSignal.timeout(30_000),
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${options.token}`,
        "X-GitHub-Api-Version": "2026-03-10",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    },
  );

  const responseText = await response.text();
  let data = null;
  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch {
    data = responseText;
  }

  if (!response.ok) {
    const detail = typeof data === "object" ? data?.message : data;
    throw new GitHubApiError(response.status, detail || `GitHub API ${response.status}`);
  }
  return data;
}

function assertCleanProject(project) {
  if (!existsSync(path.join(project.root, ".git"))) {
    throw new Error(`${project.label} Git 저장소를 찾지 못했습니다: ${project.root}`);
  }
  const branch = run("git", ["branch", "--show-current"], {
    cwd: project.root,
    capture: true,
  });
  if (branch !== "main") {
    throw new Error(`${project.label}의 로컬 브랜치가 main이 아닙니다: ${branch}`);
  }
  const status = run("git", ["status", "--porcelain"], {
    cwd: project.root,
    capture: true,
  });
  if (status) {
    throw new Error(`${project.label}에 커밋되지 않은 변경이 있습니다.`);
  }
}

async function validateTarget(remoteUrl, owner, repo, token) {
  const metadata = await githubRequest(owner, repo, "", { token });
  if (metadata.private || metadata.visibility !== "public") {
    throw new Error("대상 저장소가 Public이 아닙니다.");
  }
  if (metadata.permissions?.push === false) {
    throw new Error("현재 GitHub 인증에는 대상 저장소 push 권한이 없습니다.");
  }

  const refs = run("git", ["ls-remote", "--heads", "--tags", remoteUrl], {
    capture: true,
    env: { GIT_TERMINAL_PROMPT: "0" },
  });
  if (refs) {
    throw new Error("대상 저장소가 비어 있지 않아 기존 이력을 보호하기 위해 중단했습니다.");
  }
}

function buildProject(project, basePath) {
  process.stdout.write(`\n${project.label} 빌드 · 테스트: ${basePath}\n`);
  run("npm", ["ci"], { cwd: project.root, timeout: 180_000 });
  run("npm", ["run", "build"], {
    cwd: project.root,
    timeout: 180_000,
    env: { VITE_BASE_PATH: basePath },
  });
  run("npm", ["run", "test:sites"], {
    cwd: project.root,
    timeout: 120_000,
  });

  const indexPath = path.join(project.root, "dist", "client", "index.html");
  const html = readFileSync(indexPath, "utf8");
  if (!html.includes(`${basePath}assets/`)) {
    throw new Error(`${project.label}의 배포 자산 경로가 올바르지 않습니다.`);
  }
}

function createSourceCommit(project) {
  const indexRoot = mkdtempSync(path.join(tmpdir(), "trip-plan-index-"));
  const indexPath = path.join(indexRoot, "index");
  const env = { GIT_INDEX_FILE: indexPath };

  try {
    run("git", ["read-tree", "HEAD"], { cwd: project.root, env });
    run(
      "git",
      ["rm", "--cached", "-r", "--ignore-unmatch", ".github/workflows"],
      { cwd: project.root, env, capture: true },
    );
    const tree = run("git", ["write-tree"], {
      cwd: project.root,
      env,
      capture: true,
    });
    return run(
      "git",
      ["commit-tree", tree, "-m", `${project.label} travel planner source`],
      { cwd: project.root, capture: true },
    );
  } finally {
    rmSync(indexRoot, { recursive: true, force: true });
  }
}

function pushSource(project, remoteUrl) {
  const commit = createSourceCommit(project);
  const lease = `--force-with-lease=refs/heads/${project.branch}:`;
  const refspec = `${commit}:refs/heads/${project.branch}`;
  const options = {
    cwd: project.root,
    env: { GIT_TERMINAL_PROMPT: "0" },
    timeout: 180_000,
  };

  run("git", ["push", "--dry-run", lease, remoteUrl, refspec], options);
  run("git", ["push", lease, remoteUrl, refspec], options);
}

function copyDirectoryContents(source, destination) {
  mkdirSync(destination, { recursive: true });
  for (const entry of readdirSync(source)) {
    cpSync(path.join(source, entry), path.join(destination, entry), {
      recursive: true,
    });
  }
}

function createPagesBranch(remoteUrl) {
  const publishRoot = mkdtempSync(path.join(tmpdir(), "trip-plan-pages-"));
  try {
    copyDirectoryContents(path.join(projects[0].root, "dist", "client"), publishRoot);
    copyDirectoryContents(
      path.join(projects[1].root, "dist", "client"),
      path.join(publishRoot, "v2"),
    );
    copyDirectoryContents(
      path.join(projects[2].root, "dist", "client"),
      path.join(publishRoot, "v3"),
    );
    writeFileSync(path.join(publishRoot, ".nojekyll"), "");

    run("git", ["init", "-b", "gh-pages"], { cwd: publishRoot, capture: true });
    run("git", ["add", "--all"], { cwd: publishRoot });
    run(
      "git",
      [
        "-c",
        "user.name=Codex Build Agent",
        "-c",
        "user.email=codex@localhost",
        "commit",
        "-m",
        "Deploy V1, V2, and V3",
      ],
      { cwd: publishRoot, capture: true },
    );

    const lease = "--force-with-lease=refs/heads/gh-pages:";
    const options = {
      cwd: publishRoot,
      env: { GIT_TERMINAL_PROMPT: "0" },
      timeout: 180_000,
    };
    run(
      "git",
      ["push", "--dry-run", lease, remoteUrl, "HEAD:refs/heads/gh-pages"],
      options,
    );
    run("git", ["push", lease, remoteUrl, "HEAD:refs/heads/gh-pages"], options);
  } finally {
    rmSync(publishRoot, { recursive: true, force: true });
  }
}

async function configurePages(owner, repo, token) {
  const body = {
    build_type: "legacy",
    source: { branch: "gh-pages", path: "/" },
  };

  try {
    await githubRequest(owner, repo, "/pages", { token });
    await githubRequest(owner, repo, "/pages", {
      method: "PUT",
      token,
      body,
    });
  } catch (error) {
    if (error.status !== 404) throw error;
    await githubRequest(owner, repo, "/pages", {
      method: "POST",
      token,
      body,
    });
  }
}

async function waitForPages(owner, repo, token) {
  const deadline = Date.now() + 10 * 60_000;
  let previousStatus = "";

  while (Date.now() < deadline) {
    const pages = await githubRequest(owner, repo, "/pages", { token });
    if (pages.status !== previousStatus) {
      process.stdout.write(`GitHub Pages 상태: ${pages.status}\n`);
      previousStatus = pages.status;
    }
    if (pages.status === "built") return pages.html_url;
    if (pages.status === "errored") {
      throw new Error("GitHub Pages 빌드가 실패했습니다.");
    }
    await new Promise((resolve) => setTimeout(resolve, 5_000));
  }
  throw new Error("10분 안에 GitHub Pages 배포 완료를 확인하지 못했습니다.");
}

async function verifyLiveSite(baseUrl) {
  const paths = ["", "v2/", "v3/"];
  for (const suffix of paths) {
    const url = new URL(suffix, baseUrl).toString();
    const response = await fetch(url, {
      signal: AbortSignal.timeout(30_000),
      cache: "no-store",
    });
    const html = await response.text();
    if (!response.ok || !/<div id=["']root["']><\/div>/.test(html)) {
      throw new Error(`배포 확인에 실패했습니다: ${url} (${response.status})`);
    }
    process.stdout.write(`확인 완료: ${url}\n`);
  }
}

async function main() {
  const remoteUrl = normalizeRemote(process.argv[2] || "");
  const pagesOnly = process.argv.includes("--pages-only");
  const { owner, repo } = parseRemote(remoteUrl);
  const token = getGitHubToken();
  if (!token) {
    throw new Error("GitHub 인증을 찾지 못했습니다.");
  }

  const isAccountSite = repo.toLowerCase() === `${owner.toLowerCase()}.github.io`;
  const rootBase = isAccountSite ? "/" : `/${repo}/`;
  if (!pagesOnly) {
    for (const project of projects) assertCleanProject(project);
    process.stdout.write("Public·빈 저장소와 push 권한을 확인하고 있습니다.\n");
    await validateTarget(remoteUrl, owner, repo, token);

    for (const project of projects) {
      buildProject(project, `${rootBase}${project.suffix}`);
    }

    process.stdout.write("\n소스 브랜치를 생성하고 있습니다.\n");
    for (const project of projects) pushSource(project, remoteUrl);

    process.stdout.write("\n통합 정적 사이트를 gh-pages 브랜치에 올리고 있습니다.\n");
    createPagesBranch(remoteUrl);
  } else {
    process.stdout.write("기존 gh-pages 브랜치의 Pages 설정만 재개합니다.\n");
  }

  await configurePages(owner, repo, token);
  const expectedUrl = isAccountSite
    ? `https://${owner}.github.io/`
    : `https://${owner}.github.io/${repo}/`;
  const liveUrl = (await waitForPages(owner, repo, token)) || expectedUrl;
  await verifyLiveSite(liveUrl);

  process.stdout.write(`\n배포 완료: ${liveUrl}\n`);
  process.stdout.write(`V2: ${new URL("v2/", liveUrl)}\n`);
  process.stdout.write(`V3: ${new URL("v3/", liveUrl)}\n`);
}

main().catch((error) => {
  process.stderr.write(`\n배포를 완료하지 못했습니다: ${error.message}\n`);
  process.exitCode = 1;
});
