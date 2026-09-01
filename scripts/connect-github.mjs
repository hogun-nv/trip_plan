import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workflowFile = "deploy-pages.yml";

class GitHubApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: projectRoot,
    encoding: "utf8",
    env: { ...process.env, ...options.env },
    input: options.input,
    stdio: options.capture
      ? [options.input ? "pipe" : "ignore", "pipe", "pipe"]
      : "inherit",
    timeout: options.timeout ?? 60_000,
  })?.trim();
}

function git(args, options = {}) {
  return run("git", args, options);
}

function readGit(args, options = {}) {
  try {
    return git(args, { ...options, capture: true });
  } catch {
    return "";
  }
}

function normalizeRemote(value) {
  const url = value.trim();
  const https = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?$/;
  const ssh = /^git@github\.com:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?$/;
  if (!https.test(url) && !ssh.test(url)) {
    throw new Error("GitHub 저장소 URL 형식이 아닙니다. 예: https://github.com/owner/repo.git");
  }
  return url;
}

function parseGitHubRemote(remoteUrl) {
  const withoutHost = remoteUrl
    .replace(/^https:\/\/github\.com\//, "")
    .replace(/^git@github\.com:/, "")
    .replace(/\.git$/, "");
  const [owner, repo, ...rest] = withoutHost.split("/");

  if (!owner || !repo || rest.length) {
    throw new Error("GitHub 저장소의 owner와 repository 이름을 확인하지 못했습니다.");
  }

  return { owner, repo };
}

async function getRemote() {
  if (process.argv[2]) return normalizeRemote(process.argv[2]);
  const rl = createInterface({ input, output });
  const answer = await rl.question("빈 GitHub public repository URL을 붙여넣으세요: ");
  rl.close();
  return normalizeRemote(answer);
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
      run("gh", ["auth", "status", "--hostname", "github.com"], { capture: true });
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

function configureGitCredentialHelper(remoteUrl) {
  if (!remoteUrl.startsWith("https://") || !hasGitHubCli()) return;
  try {
    run("gh", ["auth", "setup-git", "--hostname", "github.com"], { capture: true });
  } catch {
    // A pre-existing Git credential helper may still be able to authenticate.
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
        "X-GitHub-Api-Version": "2026-03-10",
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        ...(options.body ? { "Content-Type": "application/json" } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    },
  );

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const detail = typeof data === "object" ? data?.message : data;
    throw new GitHubApiError(response.status, detail || `GitHub API ${response.status}`);
  }
  return data;
}

function assertPreparedLocalRepository() {
  if (!existsSync(path.join(projectRoot, ".git"))) {
    throw new Error("이 폴더의 준비된 Git 이력이 없습니다. Version 1 프로젝트 폴더에서 실행해 주세요.");
  }
  if (!readGit(["rev-parse", "--verify", "HEAD"])) {
    throw new Error("배포할 커밋이 없습니다.");
  }

  const branch = readGit(["branch", "--show-current"]);
  if (branch !== "main") {
    throw new Error(`현재 브랜치가 main이 아닙니다: ${branch || "detached HEAD"}`);
  }

  const changes = readGit(["status", "--porcelain"]);
  if (changes) {
    throw new Error(
      "커밋되지 않은 파일이 있어 공개 저장소 연결을 중단했습니다. 변경 내용을 먼저 검토하고 커밋해 주세요.",
    );
  }
}

async function validateRemote(remoteUrl, owner, repo, token) {
  const metadata = await githubRequest(owner, repo, "", { token });
  if (metadata.private || metadata.visibility !== "public") {
    throw new Error("대상 저장소가 Public이 아닙니다. 빈 Public repository URL을 사용해 주세요.");
  }
  if (metadata.permissions && metadata.permissions.push === false) {
    throw new Error("현재 GitHub 인증에는 대상 저장소 push 권한이 없습니다.");
  }

  let refs;
  try {
    refs = git(["ls-remote", "--heads", "--tags", remoteUrl], {
      capture: true,
      env: { GIT_TERMINAL_PROMPT: "0" },
    });
  } catch (error) {
    const detail = error.stderr?.toString().trim();
    throw new Error(detail || "대상 저장소에 접근하지 못했습니다.");
  }
  if (refs) {
    throw new Error("대상 저장소가 비어 있지 않습니다. 기존 이력을 덮어쓰지 않도록 연결을 중단했습니다.");
  }
}

async function enableGitHubPages(owner, repo, token) {
  if (!token) {
    return {
      enabled: false,
      reason: "GitHub 관리자 인증 토큰을 확인하지 못했습니다.",
    };
  }

  try {
    const current = await githubRequest(owner, repo, "/pages", { token });
    if (current.build_type !== "workflow") {
      await githubRequest(owner, repo, "/pages", {
        method: "PUT",
        token,
        body: { build_type: "workflow" },
      });
    }
    return { enabled: true };
  } catch (error) {
    if (error.status !== 404) {
      return { enabled: false, reason: error.message };
    }
  }

  try {
    await githubRequest(owner, repo, "/pages", {
      method: "POST",
      token,
      body: { build_type: "workflow" },
    });
    return { enabled: true };
  } catch (error) {
    return { enabled: false, reason: error.message };
  }
}

async function dispatchPagesWorkflow(owner, repo, token) {
  if (!token) return false;
  try {
    await githubRequest(owner, repo, `/actions/workflows/${workflowFile}/dispatches`, {
      method: "POST",
      token,
      body: { ref: "main" },
    });
    return true;
  } catch {
    return false;
  }
}

async function waitForDeployment(owner, repo, headSha, event, token) {
  const deadline = Date.now() + 8 * 60_000;
  let lastStatus = "";

  while (Date.now() < deadline) {
    const runs = await githubRequest(
      owner,
      repo,
      `/actions/workflows/${workflowFile}/runs?branch=main&per_page=10`,
      { token },
    );
    const run = runs.workflow_runs?.find(
      (candidate) => candidate.head_sha === headSha && candidate.event === event,
    );

    if (run) {
      const status = run.status === "completed" ? run.conclusion : run.status;
      if (status !== lastStatus) {
        output.write(`GitHub Actions 상태: ${status}\n`);
        lastStatus = status;
      }
      if (run.status === "completed" && run.conclusion === "success") {
        const pages = await githubRequest(owner, repo, "/pages", { token });
        return { complete: true, url: pages.html_url, actionsUrl: run.html_url };
      }
      if (run.status === "completed" && run.conclusion !== "success") {
        throw new Error(`GitHub Actions 배포가 ${run.conclusion} 상태로 종료되었습니다: ${run.html_url}`);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 5_000));
  }

  return { complete: false };
}

function setOrigin(remoteUrl) {
  const previous = readGit(["remote", "get-url", "origin"]);
  if (!previous) git(["remote", "add", "origin", remoteUrl]);
  else if (previous !== remoteUrl) git(["remote", "set-url", "origin", remoteUrl]);
  return previous;
}

function restoreOrigin(previous) {
  try {
    if (previous) git(["remote", "set-url", "origin", previous]);
    else git(["remote", "remove", "origin"]);
  } catch {
    // The original failure is more useful than a secondary cleanup error.
  }
}

async function main() {
  const remoteUrl = await getRemote();
  const { owner, repo } = parseGitHubRemote(remoteUrl);
  const token = getGitHubToken();

  assertPreparedLocalRepository();
  output.write("Public·빈 저장소 여부와 로컬 커밋 상태를 확인하고 있습니다.\n");
  await validateRemote(remoteUrl, owner, repo, token);
  configureGitCredentialHelper(remoteUrl);

  // Enabling before the first push lets the push-triggered workflow succeed.
  // GitHub may reject an empty repository, so a post-push retry is retained.
  let pages = await enableGitHubPages(owner, repo, token);
  const previousOrigin = setOrigin(remoteUrl);

  try {
    git(["push", "-u", "origin", "main"], { timeout: 120_000 });
  } catch (error) {
    restoreOrigin(previousOrigin);
    throw error;
  }

  let workflowEvent = "push";
  if (!pages.enabled) {
    pages = await enableGitHubPages(owner, repo, token);
    if (pages.enabled) {
      const dispatched = await dispatchPagesWorkflow(owner, repo, token);
      if (dispatched) workflowEvent = "workflow_dispatch";
    }
  }

  const actionsUrl = `https://github.com/${owner}/${repo}/actions`;
  const isAccountSite = repo.toLowerCase() === `${owner.toLowerCase()}.github.io`;
  const expectedUrl = isAccountSite
    ? `https://${owner}.github.io/`
    : `https://${owner}.github.io/${repo}/`;

  if (!pages.enabled) {
    output.write("\n코드 push는 완료했습니다.\n");
    output.write(`Pages 설정: https://github.com/${owner}/${repo}/settings/pages\n`);
    output.write('Build and deployment → Source에서 "GitHub Actions"를 한 번 선택하세요.\n');
    output.write(`그다음 워크플로 실행: ${actionsUrl}\n`);
    if (pages.reason) output.write(`자동 활성화 확인 정보: ${pages.reason}\n`);
    process.exitCode = 2;
    return;
  }

  output.write("\nPages를 GitHub Actions 방식으로 설정했습니다. 첫 배포를 확인하고 있습니다.\n");
  const deployment = await waitForDeployment(
    owner,
    repo,
    readGit(["rev-parse", "HEAD"]),
    workflowEvent,
    token,
  );

  if (deployment.complete) {
    output.write(`\n배포 완료: ${deployment.url || expectedUrl}\n`);
    output.write(`Actions: ${deployment.actionsUrl || actionsUrl}\n`);
  } else {
    output.write("\n8분 안에 최종 상태를 확인하지 못했습니다. 배포가 계속 진행 중일 수 있습니다.\n");
    output.write(`Actions: ${actionsUrl}\n`);
    process.exitCode = 3;
  }
}

main().catch((error) => {
  output.write(`\n연결 또는 배포를 완료하지 못했습니다: ${error.message}\n`);
  process.exitCode = 1;
});
