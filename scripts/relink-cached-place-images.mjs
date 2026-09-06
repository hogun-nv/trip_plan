import { readFile, writeFile } from "node:fs/promises";

const file = new URL("../src/data/explore-places.js", import.meta.url);
let source = await readFile(file, "utf8");

const replacements = new Map([
  ["National September 11 Memorial & Museum 2015.jpg", "images/explore/nine-eleven-museum.jpg"],
  ["Vessel (structure) October 2021.jpg", "images/explore/vessel.jpg"],
  ["Brooklyn Heights Promenade Manhattan view.jpg", "images/explore/brooklyn-heights-promenade.jpg"],
  ["Cathedral Church of St. John the Divine 2019.jpg", "images/explore/st-john-divine.jpg"],
  ["USS Intrepid (CV-11) in New York City 2007.jpg", "images/explore/intrepid-museum.jpg"],
  ["Morgan Library & Museum (48128025271).jpg", "images/explore/morgan-library.jpg"],
  ["Andrew Carnegie Mansion 2.jpg", "images/explore/cooper-hewitt.jpg"],
  ["Neue Galerie New York.jpg", "images/explore/neue-galerie.jpg"],
  ["Brooklyn Museum - Front facade.jpg", "images/explore/brooklyn-museum.jpg"],
  ["Museum of the City of New York 1220 Fifth Avenue.jpg", "images/explore/museum-city-ny.jpg"],
  ["Broadway Theatre District New York.jpg", "images/explore/museum-broadway.jpg"],
  ["Governors Island from One World Observatory.jpg", "images/explore/governors-island.jpg"],
  ["Brooklyn Botanic Garden Japanese Hill-and-Pond Garden.jpg", "images/explore/brooklyn-botanic.jpg"],
  ["Prospect Park Long Meadow.jpg", "images/explore/prospect-park.jpg"],
  ["Gantry Plaza State Park.jpg", "images/explore/gantry-plaza.jpg"],
  ["Four Freedoms Park, Roosevelt Island, New York City.jpg", "images/explore/four-freedoms.jpg"],
  ["Carnegie Hall, New York City.jpg", "images/explore/carnegie-hall.jpg"],
  ["Village Vanguard New York.jpg", "images/explore/village-vanguard.jpg"],
  ["Comedy Cellar New York.jpg", "images/explore/comedy-cellar.jpg"],
  ["The Shed Hudson Yards 2019.jpg", "images/explore/the-shed.jpg"],
  ["Essex Market exterior 2019.jpg", "images/explore/essex-market.jpg"],
  ["Bedford Avenue Williamsburg Brooklyn.jpg", "images/explore/williamsburg-bedford.jpg"],
  ["160 Lexington Avenue New York.jpg", "images/explore/dover-street-market.jpg"],
  ["Century 21 Department Store Manhattan.jpg", "images/explore/century-21.jpg"],
  ["Bear Mountain Bridge from Bear Mountain.jpg", "images/explore/bear-mountain.jpg"],
  ["Woodbury Common Premium Outlets.jpg", "images/explore/woodbury-common.jpg"],
]);

for (const [commonsFile, localPath] of replacements) {
  const target = `commons(${JSON.stringify(commonsFile)})`;
  if (!source.includes(target)) throw new Error(`Expected image reference not found: ${target}`);
  source = source.replaceAll(target, JSON.stringify(localPath));
}

await writeFile(file, source);
console.log(`Relinked ${replacements.size} verified place images.`);
