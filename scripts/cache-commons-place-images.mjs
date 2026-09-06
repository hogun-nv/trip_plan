import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

const targets = {
  "nine-eleven-museum": "National September 11 Memorial Museum New York exterior",
  vessel: "Vessel Hudson Yards New York City",
  "brooklyn-heights-promenade": "Brooklyn Heights Promenade Manhattan skyline",
  "st-john-divine": "Cathedral Saint John Divine New York exterior",
  "intrepid-museum": "Intrepid Sea Air Space Museum New York",
  "morgan-library": "Morgan Library New York interior",
  "cooper-hewitt": "Andrew Carnegie Mansion Cooper Hewitt New York",
  "neue-galerie": "Neue Galerie New York exterior",
  "brooklyn-museum": "Brooklyn Museum New York facade",
  "museum-city-ny": "Museum City New York Fifth Avenue",
  "museum-broadway": "Broadway Theatre District New York",
  "governors-island": "Governors Island New York skyline",
  "brooklyn-botanic": "Brooklyn Botanic Garden Japanese Garden",
  "prospect-park": "Prospect Park Long Meadow Brooklyn",
  "gantry-plaza": "Gantry Plaza State Park New York",
  "four-freedoms": "Four Freedoms Park Roosevelt Island",
  "carnegie-hall": "Carnegie Hall New York exterior",
  "village-vanguard": "Village Vanguard New York exterior",
  "comedy-cellar": "Comedy Cellar New York exterior",
  "the-shed": "The Shed Hudson Yards New York",
  "essex-market": "Essex Market New York exterior",
  "williamsburg-bedford": "Bedford Avenue Williamsburg Brooklyn",
  "dover-street-market": "160 Lexington Avenue New York",
  "century-21": "Century 21 department store New York",
  "bear-mountain": "Bear Mountain Bridge Hudson New York",
  "woodbury-common": "Woodbury Common Premium Outlets New York",
  "times-square": "Times Square at night New York",
  rockefeller: "Rockefeller Center Prometheus Plaza",
  "pebble-beach": "Pebble Beach Brooklyn Bridge Park skyline",
  "river-cafe": "River Cafe Brooklyn New York exterior",
  "met-eatery": "Metropolitan Museum American Wing atrium cafeteria",
  "moma-lunch": "Museum Modern Art New York interior",
  "chelsea-market": "Inside Chelsea Market New York",
  "little-italy": "Little Italy Mulberry Street Manhattan New York",
  "greenwich-village": "Washington Square Park Greenwich Village New York",
  "lincoln-center": "Lincoln Center plaza New York",
  "quality-meats": "Quality Meats restaurant New York exterior",
  "peter-luger-steak": "Peter Luger porterhouse steak",
  "ellens-burger": "American diner cheeseburger fries",
  "tal-cream-cheese": "New York bagel cream cheese",
};

const exactTargets = {
  "times-square": "Times Square at Night.jpg",
  "brooklyn-museum": "Exterior of the Brooklyn Museum.jpg",
  "moma-lunch": "Interior staircase, Museum of Modern Art, New York City (July 2010).jpg",
  "little-italy": "Little Italy, Mulberry Street, Manhattan, New York (7237373364).jpg",
  "neue-galerie": "Neue Galerie.jpg",
  "village-vanguard": "Village Vanguard, 178 7th Ave S, New York, NY 10014, August 2008.jpg",
  "comedy-cellar": "The Comedy Cellar (48072765427).jpg",
  "williamsburg-bedford": "Williamsburg (9074803760).jpg",
  "river-cafe": "The River Cafe, 1 Water Street, Brooklyn NY.jpg",
  "met-eatery": "Metropolitan Museum of Art (6387518959).jpg",
};

const outputDir = new URL("../public/images/explore/", import.meta.url);
await mkdir(outputDir, { recursive: true });
let manifest = {};
try { manifest = JSON.parse(await readFile(new URL("manifest.json", outputDir), "utf8")); } catch { /* first run */ }
const selectedTargets = process.argv.includes("--exact") ? exactTargets : targets;

function plain(value = "") {
  return value.replace(/<[^>]+>/g, " ").replace(/&[^;]+;/g, " ").replace(/\s+/g, " ").trim();
}

for (const [id, query] of Object.entries(selectedTargets)) {
  await new Promise((resolve) => setTimeout(resolve, 800));
  const exact = process.argv.includes("--exact");
  const params = new URLSearchParams(exact ? {
    action: "query", titles: `File:${query}`, prop: "imageinfo",
    iiprop: "url|mime|size|extmetadata", iiurlwidth: "1400", format: "json", origin: "*",
  } : {
    action: "query", generator: "search", gsrsearch: `filetype:bitmap ${query}`,
    gsrnamespace: "6", gsrlimit: "8", prop: "imageinfo",
    iiprop: "url|mime|size|extmetadata", iiurlwidth: "1400", format: "json", origin: "*",
  });
  let response;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`);
    if (response.ok || response.status !== 429) break;
    await new Promise((resolve) => setTimeout(resolve, 3000 * (attempt + 1)));
  }
  if (!response?.ok) {
    process.stderr.write(`SKIP\t${id}\tCommons search failed (${response?.status})\n`);
    continue;
  }
  const payload = await response.json();
  const pages = Object.values(payload.query?.pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
  const selected = pages.find((page) => {
    const info = page.imageinfo?.[0];
    const license = info?.extmetadata?.LicenseShortName?.value || "";
    return info?.thumburl && info.width >= 900 && info.height >= 600 && !/fair use|copyrighted free use/i.test(license);
  });
  if (!selected) {
    process.stderr.write(`SKIP\t${id}\tno suitable image result for ${query}\n`);
    continue;
  }
  const info = selected.imageinfo[0];
  const mimeExt = info.mime === "image/png" ? ".png" : info.mime === "image/webp" ? ".webp" : ".jpg";
  const fileName = `${id}${mimeExt}`;
  const imageResponse = await fetch(info.thumburl);
  if (!imageResponse.ok) throw new Error(`${id}: download failed (${imageResponse.status})`);
  await writeFile(join(outputDir.pathname, fileName), Buffer.from(await imageResponse.arrayBuffer()));
  manifest[id] = {
    path: `images/explore/${fileName}`,
    title: selected.title.replace(/^File:/, ""),
    author: plain(info.extmetadata?.Artist?.value) || "Wikimedia Commons contributor",
    license: plain(info.extmetadata?.LicenseShortName?.value) || "Commons license",
    source: info.descriptionurl,
    width: info.thumbwidth,
    height: info.thumbheight,
    query,
  };
  process.stdout.write(`${id}\t${selected.title}\t${manifest[id].license}\n`);
}

await writeFile(new URL("manifest.json", outputDir), `${JSON.stringify(manifest, null, 2)}\n`);
