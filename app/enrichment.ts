import type { GuideItem } from './data';

export type FeatureMedia = {
  title: string;
  price?: string;
  image: string;
  alt: string;
  caption: string;
  credit: string;
  kind: 'actual' | 'reference' | 'generated' | 'artwork';
};

export const displayNameById: Record<string, string> = {
  'katzs-deli': "Katz’s Delicatessen",
  'russ-daughters-cafe': 'Russ & Daughters Café',
  'joes-pizza-carmine': 'Joe’s Pizza · Carmine Street',
  'los-tacos-chelsea': 'LOS TACOS No.1 · Chelsea Market',
  'xian-famous-foods': 'Xi’an Famous Foods · Chinatown',
  'keens-steakhouse': 'Keens Steakhouse',
  'gramercy-tavern': 'Gramercy Tavern',
  atomix: 'Atomix',
  sylvias: 'Sylvia’s',
  'levain-original': 'Levain Bakery · 74th Street',
  'dominique-ansel': 'Dominique Ansel Bakery',
  'grand-central-oyster-bar': 'Grand Central Oyster Bar',
  'central-park-bethesda': 'Central Park · Bethesda Terrace',
  'high-line': 'The High Line',
  'brooklyn-bridge-dumbo': 'Brooklyn Bridge & DUMBO',
  'statue-liberty-ellis': 'Statue of Liberty & Ellis Island',
  'top-of-the-rock': 'Top of the Rock',
  'empire-state-building': 'Empire State Building',
  'grand-central-terminal': 'Grand Central Terminal',
  'roosevelt-tram': 'Roosevelt Island Tramway',
  'nine-eleven-oculus': '9/11 Memorial & Oculus',
  'little-island': 'Little Island',
  broadway: 'Broadway 뮤지컬',
  'the-met': 'The Metropolitan Museum of Art',
  moma: 'The Museum of Modern Art · MoMA',
  whitney: 'Whitney Museum of American Art',
  guggenheim: 'Solomon R. Guggenheim Museum',
  amnh: 'American Museum of Natural History',
  'apollo-theater': 'Apollo Theater & Harlem',
  'jazz-at-lincoln-center': 'Jazz at Lincoln Center',
  'met-cloisters': 'The Met Cloisters',
  'tenement-museum': 'Tenement Museum',
  soho: 'SoHo Cast-Iron District',
  'macys-herald-square': 'Macy’s Herald Square',
  'moma-design-soho': 'MoMA Design Store · SoHo',
  'strand-bookstore': 'Strand Book Store',
  'nintendo-ny': 'Nintendo New York',
  'tiffany-landmark': 'The Landmark · Tiffany & Co.',
  'union-square-greenmarket': 'Union Square Greenmarket',
  'brooklyn-flea-dumbo': 'Brooklyn Flea · DUMBO',
  'beacon-dia': 'Beacon & Dia Beacon',
  'cold-spring-boscobel': 'Cold Spring & Boscobel House',
  'sleepy-hollow': 'Tarrytown & Sleepy Hollow',
  'storm-king': 'Storm King Art Center',
  princeton: 'Princeton',
  philadelphia: 'Historic Philadelphia',
  'long-beach-ny': 'Long Beach, New York',
  'niagara-falls': 'Niagara Falls State Park',
};

export const costById: Record<string, string> = {
  'katzs-deli': '1인 $21–45',
  'russ-daughters-cafe': '1인 $30–45',
  'joes-pizza-carmine': '1인 $7–12',
  'los-tacos-chelsea': '1인 $17–25',
  'xian-famous-foods': '1인 $18–28',
  'keens-steakhouse': '1인 $95–140',
  'gramercy-tavern': '1인 $78–175+',
  atomix: '1인 약 $430–500',
  sylvias: '1인 $35–50',
  'levain-original': '1인 $6–15',
  'dominique-ansel': '1인 $14–25',
  'grand-central-oyster-bar': '1인 $55–95',
  'central-park-bethesda': '무료',
  'high-line': '무료',
  'brooklyn-bridge-dumbo': '무료 · 간식 별도',
  'statue-liberty-ellis': '성인 $26부터',
  'top-of-the-rock': '성인 $49–79',
  'empire-state-building': '성인 약 $48–80',
  'grand-central-terminal': '무료 · 투어 약 $35',
  'roosevelt-tram': '왕복 $6',
  'nine-eleven-oculus': '광장 무료 · 박물관 $36',
  'little-island': '입장 무료',
  broadway: '1인 $90–250',
  'the-met': '성인 $30',
  moma: '성인 $30',
  whitney: '성인 $30',
  guggenheim: '성인 약 $30–35',
  amnh: '성인 $37–48',
  'apollo-theater': '산책 무료 · 공연 $25–90',
  'jazz-at-lincoln-center': '1인 $45–160',
  'met-cloisters': '성인 $30',
  'tenement-museum': '성인 약 $30–35',
  soho: '산책 무료 · 쇼핑 $50–300+',
  'macys-herald-square': '입장 무료 · 쇼핑 $50–300+',
  'moma-design-soho': '입장 무료 · 쇼핑 $20–120',
  'strand-bookstore': '입장 무료 · 쇼핑 $15–80',
  'nintendo-ny': '입장 무료 · 쇼핑 $25–150',
  'tiffany-landmark': '입장 무료 · 쇼핑 $250부터',
  'union-square-greenmarket': '입장 무료 · 쇼핑 $15–50',
  'brooklyn-flea-dumbo': '입장 무료 · 쇼핑 $20–150',
  'beacon-dia': '1인 $70–110',
  'cold-spring-boscobel': '1인 $75–150',
  'sleepy-hollow': '1인 $80–150',
  'storm-king': '1인 $120–200',
  princeton: '1인 $70–140',
  philadelphia: '1인 $130–260',
  'long-beach-ny': '1인 $35–70',
  'niagara-falls': '1인 $450–750',
};

export const costNoteByCategory: Record<GuideItem['category'], string> = {
  food: '식당 금액은 대표 주문에 세금과 기본 팁을 더한 예상치입니다. 주류는 포함하지 않았습니다.',
  sights: '일반 성인 기준입니다. 시간대, 옵션, 예매 수수료에 따라 달라질 수 있습니다.',
  culture: '일반 성인 좌석·입장권 기준입니다. 공연과 특별전은 날짜에 따라 달라질 수 있습니다.',
  shopping: '입장료와 현실적인 개인 쇼핑 예산을 구분했습니다.',
  daytrip: '뉴욕 출발 왕복 교통, 입장료, 한 끼를 합친 1인 예상치입니다.',
};

export const featureMediaById: Record<string, FeatureMedia[]> = {
  'katzs-deli': [
    { title: 'Pastrami on Rye', price: '$30.95', image: './images/details/katzs-pastrami.jpg', alt: 'Katz’s의 두툼한 파스트라미 샌드위치', caption: '둘이 나눠 먹기 좋은 대표 주문. 빵보다 고기의 향과 결이 중심이다.', credit: 'City Foodsters · CC BY 2.0', kind: 'actual' },
    { title: 'Matzo Ball Soup', price: '$10.95', image: './images/details/katzs-matzo-soup.jpg', alt: '맑은 육수에 담긴 마초볼 수프', caption: '파스트라미의 짠맛을 부드럽게 이어 주는 따뜻한 사이드.', credit: 'City Foodsters · CC BY 2.0', kind: 'actual' },
  ],
  'russ-daughters-cafe': [
    { title: 'Bagel & Lox', price: '$24', image: './images/details/russ-lox-bagel.jpg', alt: '훈제 연어와 크림치즈를 올린 베이글', caption: 'Nova 연어의 훈연 향과 크림치즈, 베이글의 조합이 이곳의 출발점이다.', credit: 'Mudwater · CC BY-SA 4.0', kind: 'reference' },
    { title: 'Potato Latkes', price: '$16부터', image: './images/details/russ-latkes.jpg', alt: '노릇하게 구운 감자 라트케', caption: '사과소스와 사워크림을 곁들이는 바삭한 감자전. 둘이 한 접시면 충분하다.', credit: 'Mark Mitchell · CC BY 2.0', kind: 'reference' },
  ],
  'joes-pizza-carmine': [
    { title: 'Plain Cheese Slice', price: '약 $4–5', image: './images/details/joes-plain-slice.jpg', alt: '얇은 도우의 뉴욕식 치즈 피자 한 조각', caption: '소스와 치즈, 얇은 크러스트의 균형을 가장 선명하게 볼 수 있는 기본 주문.', credit: 'К.Артём.1 · CC BY-SA 4.0', kind: 'reference' },
    { title: 'Pepperoni Slice', price: '약 $5–6', image: './images/details/joes-pepperoni.jpg', alt: '페퍼로니를 올린 뉴욕식 피자 한 조각', caption: '플레인과 한 조각씩 주문해 염도와 기름진 풍미를 비교하기 좋다.', credit: 'BrokenSphere · CC BY-SA 3.0', kind: 'reference' },
  ],
  'los-tacos-chelsea': [
    { title: 'Carne Asada Taco', price: '$5.95', image: './images/details/los-carne-asada.jpg', alt: '직화 소고기를 올린 카르네 아사다 타코', caption: '직화 소고기와 살사, 갓 구운 옥수수 또르띠야가 중심인 대표 메뉴.', credit: 'Jon Sullivan · Public domain', kind: 'reference' },
    { title: 'Adobada Taco', price: '$5.65', image: './images/details/los-adobada.jpg', alt: '양념 돼지고기를 올린 아도바다 타코', caption: '양념한 돼지고기의 단맛과 불향이 또렷하다. 아사다와 한 개씩 비교해 본다.', credit: 'T.Tseng · CC BY 2.0', kind: 'reference' },
  ],
  'xian-famous-foods': [
    { title: 'N1 Spicy Cumin Lamb Noodles', price: '약 $16–18', image: './images/details/xian-biang-biang.jpg', alt: '넓고 납작한 면에 양고기를 올린 비앙비앙면', caption: '매운 기름, 큐민 양고기, 손으로 찢은 넓은 면의 식감이 한 번에 드러난다.', credit: 'Gary Soup · CC BY 2.0', kind: 'reference' },
    { title: 'Spicy & Sour Lamb Dumplings', price: '약 $11–13', image: './images/details/xian-lamb-dumplings.jpg', alt: '붉은 소스를 두른 양고기 만두', caption: '새콤하고 매운 소스가 양고기의 진한 맛을 정리한다. 면과 나눠 먹기 좋다.', credit: 'Peachyeung316 · CC BY-SA 4.0', kind: 'reference' },
  ],
  'keens-steakhouse': [
    { title: 'Legendary Mutton Chop', price: '$73', image: './images/details/keens-mutton.jpg', alt: '두툼하게 구운 양고기 촙', caption: 'Keens를 다른 스테이크하우스와 구분하는 역사적인 대표 메뉴.', credit: 'Bonnachoven · CC0', kind: 'reference' },
    { title: 'Porterhouse for Two', price: '$143', image: './images/details/keens-porterhouse.jpg', alt: '큰 접시에 담긴 포터하우스 스테이크', caption: '안심과 채끝을 함께 맛보는 2인용 구성. 사이드 두 가지면 저녁 식사가 충분하다.', credit: 'Bonnachoven · CC0', kind: 'reference' },
  ],
  'gramercy-tavern': [
    { title: 'Tavern Burger', price: '$35', image: './images/details/gramercy-burger.jpg', alt: '두툼한 패티와 채소를 넣은 버거', caption: '예약 부담이 적은 Tavern에서 가장 직관적으로 즐길 수 있는 메뉴.', credit: 'anokarina · CC BY-SA 2.0', kind: 'reference' },
    { title: 'Beef Carpaccio', price: '$24', image: './images/details/gramercy-carpaccio.jpg', alt: '얇게 썬 소고기 카르파초', caption: '계절 메뉴와 함께 가볍게 나누기 좋은 전채. 메뉴 구성은 방문 시점에 바뀔 수 있다.', credit: 'M wassim salah · CC BY-SA 4.0', kind: 'reference' },
  ],
  atomix: [
    { title: 'Seasonal Seafood Course', price: 'Chef’s Counter에 포함', image: './images/details/atomix-seafood.jpg', alt: '현대 한식 스타일의 해산물 코스 요리', caption: '해산물과 장, 발효의 조합을 표현한 분위기 참고용 이미지. 실제 제공 메뉴는 계절에 따라 달라진다.', credit: 'OpenAI 생성 이미지 · 실제 메뉴 사진 아님', kind: 'generated' },
    { title: 'Seasonal Beef Course', price: 'Chef’s Counter에 포함', image: './images/details/atomix-beef.jpg', alt: '현대 한식 스타일의 소고기 코스 요리', caption: '소고기와 된장 계열의 풍미를 현대적으로 풀어낸 분위기 참고용 이미지.', credit: 'OpenAI 생성 이미지 · 실제 메뉴 사진 아님', kind: 'generated' },
  ],
  sylvias: [
    { title: 'Fried Chicken', price: '$25', image: './images/details/sylvias-fried-chicken.jpg', alt: '프라이드치킨과 소울푸드 사이드가 담긴 접시', caption: '바삭한 치킨에 mac & cheese와 collard greens를 곁들이는 대표적인 조합.', credit: 'Clancy Ratliff · CC BY-SA 2.0', kind: 'reference' },
    { title: 'Bar-B-Que Ribs', price: '$29', image: './images/details/sylvias-ribs.jpg', alt: '바비큐 소스를 바른 돼지갈비', caption: '달고 짭짤한 소스가 특징인 푸짐한 메인. 두 사람이 치킨과 나눠 먹기 좋다.', credit: 'David Jackmanson · CC BY 2.0', kind: 'reference' },
  ],
  'levain-original': [
    { title: 'Chocolate Chip Walnut', price: '개당 약 $6', image: './images/details/levain-choc-walnut.jpg', alt: '초콜릿칩과 호두가 든 두꺼운 쿠키', caption: '겉은 단단하고 속은 거의 반죽처럼 촉촉한 Levain의 시그니처.', credit: 'Neil Conway · CC BY 2.0', kind: 'reference' },
    { title: 'Oatmeal Raisin', price: '개당 약 $6', image: './images/details/levain-oatmeal.jpg', alt: '오트밀과 건포도가 든 쿠키', caption: '초콜릿 쿠키보다 덜 묵직해 두 맛을 반씩 나누기 좋은 선택.', credit: 'Gaurav Dhwaj Khadka · CC BY-SA 4.0', kind: 'reference' },
  ],
  'dominique-ansel': [
    { title: 'September Cronut®', price: '$7.75', image: './images/details/dominique-cronut.jpg', alt: '결이 겹겹이 보이는 원형 Cronut', caption: '2026년 9월 맛은 Apple Butter & Honey Custard. 재고와 사전 주문 가능 여부를 확인한다.', credit: 'Daniel Zemans · CC BY 2.0', kind: 'actual' },
    { title: 'DKA', price: '$6.50', image: './images/details/dominique-dka.jpg', alt: '겹겹이 구운 원형 kouign-amann 페이스트리', caption: '캐러멜화한 겉면과 버터 향이 선명한 kouign-amann. Cronut과 식감이 다르다.', credit: 'Fuzheado · CC BY-SA 4.0', kind: 'reference' },
  ],
  'grand-central-oyster-bar': [
    { title: 'East Coast Oyster Selection', price: '시가 · 6개 약 $24–36', image: './images/details/oyster-bar-oysters.jpg', alt: '얼음 위에 레몬과 함께 담긴 생굴', caption: '산지와 염도를 서버에게 물어 2–3종을 섞으면 동부 해안 굴의 차이를 알기 쉽다.', credit: 'David · Public domain', kind: 'reference' },
    { title: 'New England Clam Chowder', price: '약 $14–18', image: './images/details/oyster-bar-chowder.jpg', alt: '크리미한 뉴잉글랜드 클램차우더', caption: '차가운 생굴 뒤에 나눠 먹기 좋은 따뜻한 메뉴. 실제 가격은 당일 메뉴를 확인한다.', credit: 'Namiwoo · CC BY-SA 3.0', kind: 'reference' },
  ],
  'the-met': [
    { title: 'Washington Crossing the Delaware', image: './images/details/met-washington.jpg', alt: '워싱턴이 델라웨어강을 건너는 장면을 그린 대형 회화', caption: 'Emanuel Leutze, 1851. 미국의 국가적 서사를 거대한 화면으로 만든 대표작.', credit: 'Emanuel Leutze · Public domain', kind: 'artwork' },
    { title: 'The Temple of Dendur', image: './images/details/met-dendur.jpg', alt: '유리창과 수면 앞에 설치된 고대 이집트 신전', caption: '기원전 15년경 이집트 신전. 자연광이 드는 Sackler Wing의 공간 자체가 핵심 경험이다.', credit: 'The Met Open Access · CC0', kind: 'artwork' },
  ],
  moma: [
    { title: 'The Starry Night', image: './images/details/moma-starry-night.jpg', alt: '소용돌이치는 밤하늘과 마을을 그린 별이 빛나는 밤', caption: 'Vincent van Gogh, 1889. 5층 Gallery 501에서 먼저 확인할 대표작.', credit: 'Vincent van Gogh · Public domain', kind: 'artwork' },
    { title: 'Reflections of Clouds on the Water-Lily Pond', image: './images/details/moma-water-lilies.jpg', alt: '수면과 구름의 반사를 그린 모네의 수련 연작', caption: 'Claude Monet, 1920경. 넓은 화면을 한 걸음 떨어져 천천히 보는 작품.', credit: 'Claude Monet · Public domain', kind: 'artwork' },
  ],
  whitney: [
    { title: 'Early Sunday Morning', image: './images/details/whitney-early-sunday.jpg', alt: '일요일 아침의 조용한 뉴욕 상가를 그린 회화', caption: 'Edward Hopper, 1930. 도시의 고요와 빛을 읽을 수 있는 Whitney의 대표작.', credit: 'Edward Hopper · Public domain', kind: 'artwork' },
    { title: 'Soir Bleu', image: './images/details/whitney-soir-bleu.jpg', alt: '푸른 저녁빛 아래 카페 인물들을 그린 회화', caption: 'Edward Hopper, 1914. 초기 호퍼의 인물과 색채를 보여 주는 큰 화면.', credit: 'Edward Hopper · Public domain', kind: 'artwork' },
  ],
  guggenheim: [
    { title: 'The Yellow Cow', image: './images/details/guggenheim-yellow-cow.jpg', alt: '노란 소와 다채로운 풍경을 그린 표현주의 회화', caption: 'Franz Marc, 1911. 2027년 1월까지 이어지는 Modern European Currents 전시의 주요 작품군.', credit: 'Franz Marc · Public domain', kind: 'artwork' },
    { title: 'Composition 8', image: './images/details/guggenheim-composition-8.jpg', alt: '원과 선, 기하학적 형태로 구성한 추상화', caption: 'Wassily Kandinsky, 1923. 나선형 건축과 함께 구겐하임의 정체성을 보여 주는 작품.', credit: 'Wassily Kandinsky · Public domain', kind: 'artwork' },
  ],
  amnh: [
    { title: 'Blue Whale Model', image: './images/details/amnh-blue-whale.jpg', alt: '박물관 천장에 매달린 거대한 대왕고래 모형', caption: 'Milstein Hall의 94피트 대왕고래 모형. 공간 규모를 한눈에 보여 주는 상징이다.', credit: 'Shank27 · CC BY-SA 3.0', kind: 'artwork' },
    { title: 'Tyrannosaurus rex', image: './images/details/amnh-trex.jpg', alt: '공격 자세로 전시된 티라노사우루스 골격', caption: '공룡관에서 놓치기 어려운 대표 표본. 고래 홀과 함께 우선순위로 잡는다.', credit: 'Ryan Schwark · CC0', kind: 'artwork' },
  ],
  'met-cloisters': [
    { title: 'The Unicorn Is Found', image: './images/details/cloisters-unicorn.jpg', alt: '유니콘 사냥 장면을 수놓은 중세 태피스트리', caption: '1495–1505년경. 식물과 동물의 세부를 가까이 볼수록 밀도가 드러나는 대표작.', credit: 'The Met Open Access · CC0', kind: 'artwork' },
    { title: 'Mérode Altarpiece', image: './images/details/cloisters-merode.jpg', alt: '실내의 수태고지 장면을 그린 세 폭 제단화', caption: 'Robert Campin의 작업실, 1427–32년경. 일상 사물에 담긴 상징을 찾아보는 작품.', credit: 'The Met Open Access · CC0', kind: 'artwork' },
  ],
};

export function displayName(item: GuideItem) {
  return displayNameById[item.id] ?? item.name;
}
