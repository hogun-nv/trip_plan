import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import vm from "node:vm";

const projectRoot = resolve(import.meta.dirname, "..");
const sourcePath = resolve(projectRoot, "..", "nyc-couple-trip-2026.html");
const outputPath = resolve(projectRoot, "src", "data", "trip-data.json");
const source = readFileSync(sourcePath, "utf8");

const start = source.indexOf("var IMG = {");
const end = source.indexOf("function legacyRendererDisabled()", start);

if (start < 0 || end < 0) {
  throw new Error("Could not find the legacy trip-data block.");
}

const context = { console };
vm.createContext(context);
vm.runInContext(source.slice(start, end), context, {
  filename: "nyc-couple-trip-2026.data.js",
});

const supplementalMedia = {
  hotelRoom: {
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Mandarin%20Oriental%20New%20York%20Hudson%20River%20View%20Room.jpg?width=1000",
    credit: "https://commons.wikimedia.org/wiki/File:Mandarin_Oriental_New_York_Hudson_River_View_Room.jpg",
    sourceTitle: "뉴욕 호텔 객실 참고 이미지 · Wikimedia Commons",
  },
};

for (const [key, media] of Object.entries(supplementalMedia)) {
  context.IMG[key] = media.image;
  context.CREDIT[key] = media.credit;
  context.sources.images.push([media.sourceTitle, media.credit]);
}

const payload = {
  generatedFrom: "nyc-couple-trip-2026.html",
  generatedAt: new Date().toISOString(),
  images: context.IMG,
  credits: context.CREDIT,
  plans: context.plans,
  sources: context.sources,
};

if (!Array.isArray(payload.plans) || payload.plans.length !== 5) {
  throw new Error(`Expected 5 plans, found ${payload.plans?.length ?? 0}.`);
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

const dayCount = payload.plans.reduce((sum, plan) => sum + plan.days.length, 0);
const stopCount = payload.plans.reduce(
  (sum, plan) => sum + plan.days.reduce((daySum, day) => daySum + day.stops.length, 0),
  0,
);

console.log(JSON.stringify({ outputPath, plans: payload.plans.length, days: dayCount, stops: stopCount }));
