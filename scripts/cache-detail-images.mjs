import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const files = {
  'katzs-pastrami.jpg': 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Katz%27s_Pastrami_-_Smoked_to_juicy_perfection_and_hand_carved_to_your_specifications_%289379691603%29.jpg',
  'katzs-matzo-soup.jpg': 'https://upload.wikimedia.org/wikipedia/commons/e/e9/Matzo_Ball_Soup_-_If_the_soup_weren%27t_surrounding_it%2C_this_matzo_ball_would_float_away_%289382466258%29.jpg',
  'russ-lox-bagel.jpg': 'https://upload.wikimedia.org/wikipedia/commons/2/2b/Lox-and-bagel-01.jpg',
  'russ-latkes.jpg': 'https://upload.wikimedia.org/wikipedia/commons/5/55/00_Potato_Latkes.jpg',
  'joes-plain-slice.jpg': 'https://upload.wikimedia.org/wikipedia/commons/f/f7/New_York_Pizza_08.jpg',
  'joes-pepperoni.jpg': 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Blondie%27s_pepperoni_pizza_slice.JPG',
  'los-carne-asada.jpg': 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Carne_asada_tacos.jpg',
  'los-adobada.jpg': 'https://upload.wikimedia.org/wikipedia/commons/3/3a/Tacos_al_pastor.jpg',
  'xian-biang-biang.jpg': 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Biang_Biang_Mian.jpg',
  'xian-lamb-dumplings.jpg': 'https://upload.wikimedia.org/wikipedia/commons/e/e2/Lamb_dumplings_in_Chinese_Lamb_noodles_shop_at_Yuen_Long.jpg',
  'keens-mutton.jpg': 'https://upload.wikimedia.org/wikipedia/commons/6/69/Longhorn_Lamb_Chops_.jpg',
  'keens-porterhouse.jpg': 'https://upload.wikimedia.org/wikipedia/commons/d/df/The_Longhorn_%28porterhouse%29_steak.jpg',
  'gramercy-burger.jpg': 'https://upload.wikimedia.org/wikipedia/commons/e/ee/Sidewinders_Tavern_and_Grill_-_Burger.jpg',
  'gramercy-carpaccio.jpg': 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Carpaccio_de_boeuf.jpg',
  'sylvias-fried-chicken.jpg': 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Soul_Food_Dinner.jpg',
  'sylvias-ribs.jpg': 'https://upload.wikimedia.org/wikipedia/commons/e/e8/-food%2C_meat-_BBQ_Pork_Ribs_and_potato_salad_%2850078700982%29.jpg',
  'levain-choc-walnut.jpg': 'https://upload.wikimedia.org/wikipedia/commons/d/de/Walnut_chocolate_chip_cookies%2C_May_2009.jpg',
  'levain-oatmeal.jpg': 'https://upload.wikimedia.org/wikipedia/commons/7/71/Oatmeal_raisin_cookie.jpg',
  'dominique-cronut.jpg': 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Dominique_Ansel_-_The_Cronut_actually_does_live_up_to_the_hype_-_crispy%2C_chewy%2C_flaky%2C_buttery_%2816591973579%29.jpg',
  'dominique-dka.jpg': 'https://commons.wikimedia.org/wiki/Special:FilePath/Kouign_amann_pastry_from_B._Patisserie_in_San_Francisco.JPG',
  'oyster-bar-oysters.jpg': 'https://upload.wikimedia.org/wikipedia/commons/d/d2/Oysters_served_on_ice%2C_with_lemon_and_parsley.jpg',
  'oyster-bar-chowder.jpg': 'https://upload.wikimedia.org/wikipedia/commons/f/f6/%E3%82%A4%E3%83%B3%E3%82%B0%E3%83%A9%E3%83%B3%E3%83%89%E3%82%AF%E3%83%A9%E3%83%A0%E3%83%81%E3%83%A3%E3%82%A6%E3%83%80%E3%83%BC.jpg',
  'met-washington.jpg': 'https://upload.wikimedia.org/wikipedia/commons/9/95/Washington_Crossing_the_Delaware_by_Emanuel_Leutze%2C_MMA-NYC%2C_1851.jpg',
  'met-dendur.jpg': 'https://upload.wikimedia.org/wikipedia/commons/e/e2/The_Temple_of_Dendur_MET_LC-Dendur_Brothers_EGDP025509.jpg',
  'moma-starry-night.jpg': 'https://upload.wikimedia.org/wikipedia/commons/c/cd/VanGogh-starry_night.jpg',
  'moma-water-lilies.jpg': 'https://upload.wikimedia.org/wikipedia/commons/4/43/Claude_Monet_-_Reflections_of_Clouds_on_the_Water-Lily_Pond.jpg',
  'whitney-early-sunday.jpg': 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Early-sunday-morning-edward-hopper-1930.jpg',
  'whitney-soir-bleu.jpg': 'https://upload.wikimedia.org/wikipedia/commons/0/04/Soir_Bleu%2C_by_Edward_Hopper.jpg',
  'guggenheim-yellow-cow.jpg': 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Franz_Marc-The_Yellow_Cow-1911.jpg',
  'guggenheim-composition-8.jpg': 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Wassily_Kandinsky_Composition_VIII.jpg',
  'amnh-blue-whale.jpg': 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Balaenoptera_musculus_in_American_Museum_of_Natural_History.jpg',
  'amnh-trex.jpg': 'https://upload.wikimedia.org/wikipedia/commons/1/17/Tyrannosaurus_rex_at_the_American_Museum_of_Natural_History.jpg',
  'cloisters-unicorn.jpg': 'https://upload.wikimedia.org/wikipedia/commons/0/0a/The_Unicorn_is_Found_%28from_the_Unicorn_Tapestries%29_MET_DP101084.jpg',
  'cloisters-merode.jpg': 'https://upload.wikimedia.org/wikipedia/commons/b/bf/Annunciation_Triptych_%28Merode_Altarpiece%29_MET_DP273206.jpg',
};

const outDir = path.resolve('public/images/details');
await mkdir(outDir, { recursive: true });

for (const [filename, url] of Object.entries(files)) {
  const destination = path.join(outDir, filename);
  try {
    await access(destination);
    process.stdout.write(`cached ${filename}\n`);
    continue;
  } catch { /* fetch missing file */ }
  const proxy = new URL('https://wsrv.nl/');
  proxy.searchParams.set('url', url.replace(/^https?:\/\//, ''));
  proxy.searchParams.set('w', '1600');
  proxy.searchParams.set('we', '1');
  proxy.searchParams.set('output', 'jpg');
  proxy.searchParams.set('q', '78');
  let response;
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    response = await fetch(proxy, { headers: { 'user-agent': 'NYCFieldNotes/1.0 (personal travel guide)' } });
    if (response.ok && response.headers.get('content-type')?.startsWith('image/')) break;
    if (attempt < 8) await new Promise((resolve) => setTimeout(resolve, attempt * 1600));
  }
  if (!response?.ok) throw new Error(`${filename}: ${response?.status} ${response?.statusText}`);
  await writeFile(destination, Buffer.from(await response.arrayBuffer()));
  process.stdout.write(`cached ${filename}\n`);
  await new Promise((resolve) => setTimeout(resolve, 300));
}
