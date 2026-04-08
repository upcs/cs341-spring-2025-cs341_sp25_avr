import archiveContentSql from "../../initialApp/public/archiveContent/sqlScripts/create_content_table.sql?raw";

// Building data from the University of Portland campus
export interface Building {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
  year?: number;
  description?: string;
  category?: "academic" | "residence" | "athletic" | "campus-life" | "admin";
}

export interface BuildingContent {
  buildingId: string;
  year: number;
  description: string;
  imagePath?: string;
}

export interface ArchivePhoto {
  id: string;
  buildingId: string;
  buildingName: string;
  year: number;
  caption: string;
  imageUrl: string;
}

const archiveAssetModules = {
  ...import.meta.glob("../../initialApp/public/archiveContent/**/*.{jpg,JPG,jpeg,png}", {
    eager: true,
    import: "default",
  }),
  ...import.meta.glob("../../initialApp/public/images/**/*.{jpg,JPG,jpeg,png}", {
    eager: true,
    import: "default",
  }),
} as Record<string, string>;

const archiveAssetMap = Object.fromEntries(
  Object.entries(archiveAssetModules).map(([key, value]) => [
    key.replace(/^..\/..\/initialApp\/public/, ""),
    value,
  ])
);

const resolveStaticImage = (path: string) => archiveAssetMap[path] || path;

function normalizeArchiveImagePathKey(path: string) {
  return path.replace(/\\/g, "/").trim().toLowerCase();
}

const invalidArchiveImagePaths = new Set([
  "/archiveContent/shiley/1969.jpg",
  "/archiveContent/mago/1972.jpg",
  "/archiveContent/mago/1973.jpg",
  "/archiveContent/merlo/2002.jpg",
  "/archiveContent/chapel/1937.jpg",
  "/archiveContent/chapel/1996.jpg",
  "/archiveContent/chapel/2009.jpg",
  "/archiveContent/commons/2010.JPG",
  "/archiveContent/waldschmidt/1958.jpg",
  "/archiveContent/waldschmidt/1975.jpg",
  "/archiveContent/db/1927.jpg",
  "/archiveContent/db/1982.jpg",
  "/archiveContent/db/2017.jpg",
  "/archiveContent/db/2019.jpg",
  "/archiveContent/fields/2009.jpg",
  "/archiveContent/beauchamp/2015.jpg",
  "/archiveContent/baseball/2004.jpg",
  "/archiveContent/buckley/2019.jpg",
  "/archiveContent/chiles/1997.jpg",
  "/archiveContent/library/1958.jpg",
  "/archiveContent/library/1978.jpg",
  "/archiveContent/library/2013.jpg",
  "/archiveContent/phouse/1949.JPG",
  "/archiveContent/phouse/2015.jpg",
  "/archiveContent/franz/1996.jpg",
].map(normalizeArchiveImagePathKey));

export function isKnownBrokenArchiveImage(path: string | null | undefined) {
  if (!path) return false;
  return invalidArchiveImagePaths.has(normalizeArchiveImagePathKey(path));
}

function resolveArchiveImage(path: string) {
  return isKnownBrokenArchiveImage(path) ? null : path;
}

export const buildings: Building[] = [
  {
    id: "shiley", name: "Shiley School of Engineering", lat: 45.571874, lng: -122.727942, radius: 45,
    year: 1948, category: "academic",
    description: "Home to the Donald P. Shiley School of Engineering. Named after inventor and philanthropist Donald Shiley, the school offers programs in civil, electrical, mechanical, and computer science engineering. The building features modern labs and collaborative learning spaces."
  },
  {
    id: "mago", name: "Mago Hunt Center", lat: 45.57331, lng: -122.72814, radius: 30,
    year: 2007, category: "campus-life",
    description: "The Mago Hunt Center for Nursing and Health Sciences serves as the hub for UP's acclaimed nursing program. Named after benefactors, it contains simulation labs, clinical practice rooms, and state-of-the-art healthcare training equipment."
  },
  {
    id: "merlo", name: "Merlo Field", lat: 45.574692, lng: -122.727368, radius: 60,
    year: 2002, category: "athletic",
    description: "Merlo Field is a 4,892-seat soccer stadium and the home of the UP Pilots soccer teams. Named after Harry A. Merlo, a Portland lumber executive, it has hosted multiple NCAA tournament matches and is considered one of the best college soccer venues in the nation."
  },
  {
    id: "chapel", name: "Chapel of Christ the Teacher", lat: 45.571187, lng: -122.726441, radius: 30,
    year: 1986, category: "campus-life",
    description: "Dedicated in 1986, the Chapel of Christ the Teacher is the spiritual heart of campus. Designed by architect Pietro Belluschi, it features stunning stained glass windows and a distinctive copper roof. The chapel hosts daily Mass, weddings, and university celebrations."
  },
  {
    id: "commons", name: "The Commons (Bauccio Commons)", lat: 45.570989, lng: -122.727184, radius: 50,
    year: 2014, category: "campus-life",
    description: "Bauccio Commons is the university's main dining facility, named after Pat Bauccio, founder of Bon Appétit Management Company. Opened in 2014, it replaced the old Commons and features farm-to-table dining, multiple food stations, and sustainable design with LEED certification."
  },
  {
    id: "waldschmidt", name: "Waldschmidt Hall", lat: 45.571798, lng: -122.724533, radius: 30,
    year: 1891, category: "admin",
    description: "The oldest building on campus, originally built in 1891 as 'West Hall' for the short-lived Portland University. Purchased in 1901 by Archbishop Christie for Columbia University (later renamed UP in 1935). It serves as the main administrative building and is a campus landmark listed on the National Register of Historic Places."
  },
  {
    id: "db", name: "Dundon-Berchtold Hall", lat: 45.572485, lng: -122.724856, radius: 50,
    year: 2019, category: "academic",
    description: "Opened in September 2019, Dundon-Berchtold Hall is a transformational 52,000 sq ft academic center housing the College of Arts and Sciences. It features flexible classrooms, a 200-seat auditorium, faculty offices, and collaborative study spaces. The $28 million building was named after major donors."
  },
  {
    id: "shiley-marcos", name: "Shiley-Marcos Center", lat: 45.571907, lng: -122.729026, radius: 30,
    year: 2024, category: "academic",
    description: "The Shiley-Marcos Center for Design & Innovation opened in January 2024 as UP's newest building. This cutting-edge facility blends art and science with makerspaces, robotics labs, design studios, and interdisciplinary collaboration spaces. It supports engineering, arts, and entrepreneurship programs."
  },
  {
    id: "fields", name: "Athletic Fields", lat: 45.575874, lng: -122.731994, radius: 60,
    category: "athletic",
    description: "The university's outdoor athletic and recreation fields used for intramural sports, club teams, and physical education classes. Located on the north end of campus with views of the surrounding Portland neighborhood."
  },
  {
    id: "beauchamp", name: "Beauchamp Recreation Center", lat: 45.575249, lng: -122.730305, radius: 60,
    year: 1997, category: "athletic",
    description: "The Beauchamp Recreation & Wellness Center provides fitness and recreation facilities for the UP community. It features a gym, weight room, indoor track, swimming pool, and group fitness studios. Named after a generous university benefactor."
  },
  {
    id: "chiles", name: "Chiles Center", lat: 45.575107, lng: -122.728492, radius: 60,
    year: 1984, category: "athletic",
    description: "The Earle A. and Virginia H. Chiles Center is a 4,852-seat multi-purpose arena. Dedicated on October 20, 1984, it hosts Pilots basketball, volleyball, concerts, and graduation ceremonies. Its distinctive dome roof is a campus landmark visible from across North Portland."
  },
  {
    id: "baseball", name: "Joe Etzel Field", lat: 45.573995, lng: -122.729502, radius: 80,
    year: 2012, category: "athletic",
    description: "Joe Etzel Field is the home of UP Pilots baseball. Named after legendary coach Joe Etzel who led the program for over 30 years, the field features a modern grandstand, press box, batting cages, and artificial turf. It underwent major renovations in 2012."
  },
  {
    id: "library", name: "Clark Library", lat: 45.572786, lng: -122.726733, radius: 40,
    year: 1958, category: "academic",
    description: "The Wilson W. Clark Memorial Library opened in 1958 and serves as the academic research hub of campus. It houses over 300,000 volumes, special collections, digital archives, and quiet study spaces. The library was significantly expanded in 1985 and digitized its archives in 2010."
  },
  {
    id: "phouse", name: "Pilot House", lat: 45.573091, lng: -122.725589, radius: 30,
    year: 2012, category: "campus-life",
    description: "The Pilot House is a student gathering space offering food, coffee, and a casual hangout atmosphere. Renovated and modernized, it serves as an alternative dining option and social hub with game areas and late-night hours popular with students."
  },
  {
    id: "franz", name: "Franz Hall", lat: 45.572661, lng: -122.727712, radius: 35,
    year: 1961, category: "academic",
    description: "Franz Hall houses the sciences, including biology, chemistry, and environmental science departments. Built in 1961 and named after a university benefactor, it contains research laboratories, lecture halls, and a greenhouse. The building was fully modernized in 2015 with cutting-edge lab facilities."
  },
  {
    id: "buckley", name: "Buckley Center", lat: 45.572048, lng: -122.726039, radius: 55,
    year: 1960, category: "academic",
    description: "Buckley Center is a central academic and events building featuring classrooms, the Buckley Center Auditorium, faculty offices, and student services. Built in 1960, it hosts lectures, performances, film screenings, and university events. The auditorium was renovated in 1999."
  },
];

const normalizeBuildingKey = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const buildingIdLookup = new Map<string, string>();
const buildingNameLookup = new Map<string, string>();

for (const building of buildings) {
  buildingIdLookup.set(normalizeBuildingKey(building.id), building.id);
  buildingIdLookup.set(normalizeBuildingKey(building.name), building.id);
  buildingNameLookup.set(building.id, building.name);
}

function normalizeArchiveImagePath(rawPath: string) {
  let imagePath = rawPath.replace(/''/g, "'").replace(/\\/g, "/");
  imagePath = imagePath.replace(/^\/?initialApp\/public/, "");
  imagePath = imagePath.replace(/^public/, "");
  if (!imagePath.startsWith("/")) {
    imagePath = `/${imagePath}`;
  }
  return imagePath;
}

function parseArchiveSqlRows() {
  const tuplePattern = /\('([^']*(?:''[^']*)*)',\s*(\d+),\s*'([^']*(?:''[^']*)*)',\s*'([^']*(?:''[^']*)*)'\)/g;
  const parsedRows: Array<BuildingContent> = [];
  const parsedPhotos: Array<ArchivePhoto> = [];

  for (const match of archiveContentSql.matchAll(tuplePattern)) {
    const [, rawBuildingName, rawYear, rawDescription, rawImagePath] = match;
    const buildingId = buildingIdLookup.get(normalizeBuildingKey(rawBuildingName));
    if (!buildingId) {
      continue;
    }

    const year = Number(rawYear);
    const description = rawDescription.replace(/''/g, "'");
    const imagePath = normalizeArchiveImagePath(rawImagePath);
    const resolvedImageUrl = resolveArchiveImage(imagePath);
    const buildingName = buildingNameLookup.get(buildingId) ?? rawBuildingName.replace(/''/g, "'");

    parsedRows.push({
      buildingId,
      year,
      description,
      imagePath: resolvedImageUrl ? imagePath : undefined,
    });

    if (resolvedImageUrl) {
      parsedPhotos.push({
        id: `${buildingId}-${year}-archive`,
        buildingId,
        buildingName,
        year,
        caption: description,
        imageUrl: resolvedImageUrl,
      });
    }
  }

  return {
    parsedRows,
    parsedPhotos,
  };
}

const curatedBuildingContent: Record<string, BuildingContent[]> = {
  shiley: [
    { buildingId: "shiley", year: 1948, description: "The original engineering building was established as part of the university's commitment to technical education in the post-war era." },
    { buildingId: "shiley", year: 1965, description: "Major renovations expanded the engineering facilities to accommodate growing student enrollment and new programs." },
    { buildingId: "shiley", year: 2009, description: "The Donald P. Shiley School of Engineering was renamed after a generous donation transformed the program." },
    { buildingId: "shiley", year: 2020, description: "Modern laboratories and collaborative spaces were added, making it one of the premier engineering schools in the Pacific Northwest." },
  ],
  library: [
    { buildingId: "library", year: 1958, description: "Wilson W. Clark Memorial Library opened its doors, named after a beloved university benefactor." },
    { buildingId: "library", year: 1985, description: "A significant expansion doubled the library's capacity and added state-of-the-art research facilities." },
    { buildingId: "library", year: 2010, description: "Digital archives were introduced, preserving the university's rich history for future generations." },
  ],
  chapel: [
    { buildingId: "chapel", year: 1986, description: "The Chapel of Christ the Teacher was dedicated, designed by renowned architect Pietro Belluschi, becoming the spiritual heart of campus life." },
    { buildingId: "chapel", year: 2000, description: "The chapel underwent restoration, preserving its stunning stained glass windows and copper roof." },
  ],
  waldschmidt: [
    { buildingId: "waldschmidt", year: 1891, description: "Originally built as 'West Hall' for the short-lived Portland University, it is the oldest building on campus." },
    { buildingId: "waldschmidt", year: 1901, description: "Purchased by Archbishop Alexander Christie along with 25 acres for Columbia University (renamed UP in 1935)." },
    { buildingId: "waldschmidt", year: 1975, description: "The hall was renovated to serve as the main administrative building for the university." },
  ],
  buckley: [
    { buildingId: "buckley", year: 1960, description: "Buckley Center was constructed as a central hub for student activities and academic events." },
    { buildingId: "buckley", year: 1999, description: "Major auditorium renovations modernized the performance and lecture spaces." },
  ],
  franz: [
    { buildingId: "franz", year: 1961, description: "Franz Hall was built to house the growing natural sciences departments including biology and chemistry." },
    { buildingId: "franz", year: 2015, description: "A complete modernization brought cutting-edge laboratory facilities to Franz Hall." },
  ],
  db: [
    { buildingId: "db", year: 2019, description: "Dundon-Berchtold Hall opened as a $28 million, 52,000 sq ft academic center for the College of Arts and Sciences." },
  ],
  chiles: [
    { buildingId: "chiles", year: 1984, description: "The Chiles Center was dedicated on October 20, 1984, as a 4,852-seat multi-purpose arena for athletics and events." },
  ],
  merlo: [
    { buildingId: "merlo", year: 2002, description: "Merlo Field opened as a 4,892-seat soccer stadium, named after Portland lumber executive Harry A. Merlo." },
  ],
  commons: [
    { buildingId: "commons", year: 2014, description: "Bauccio Commons replaced the old dining hall with a modern, LEED-certified farm-to-table dining facility." },
  ],
  "shiley-marcos": [
    { buildingId: "shiley-marcos", year: 2024, description: "The Shiley-Marcos Center for Design & Innovation opened in January 2024, blending art and science with makerspaces and robotics labs." },
  ],
  baseball: [
    { buildingId: "baseball", year: 2012, description: "Joe Etzel Field underwent major renovations, honoring legendary coach Joe Etzel who led the program for over 30 years." },
  ],
  beauchamp: [
    { buildingId: "beauchamp", year: 1997, description: "The Beauchamp Recreation & Wellness Center opened with gym, pool, and fitness facilities for the campus community." },
  ],
  mago: [
    { buildingId: "mago", year: 2007, description: "The Mago Hunt Center opened to house UP's nursing and health sciences programs with simulation labs and clinical training rooms." },
  ],
  phouse: [
    { buildingId: "phouse", year: 2012, description: "The Pilot House was renovated as a modern student gathering space with food, coffee, and late-night social areas." },
  ],
};

const curatedArchivePhotos: ArchivePhoto[] = [
  {
    id: "shiley-1948",
    buildingId: "shiley",
    buildingName: "shiley",
    year: 1948,
    caption: "Historic view of the original engineering building.",
    imageUrl: "/archiveContent/shiley/1948.jpg",
  },
  {
    id: "shiley-2009",
    buildingId: "shiley",
    buildingName: "shiley",
    year: 2009,
    caption: "Donald P. Shiley School of Engineering after major renewal.",
    imageUrl: "/archiveContent/shiley/2009.jpg",
  },
  {
    id: "chapel-1986",
    buildingId: "chapel",
    buildingName: "chapel",
    year: 1986,
    caption: "The Chapel of Christ the Teacher shortly after dedication.",
    imageUrl: "/archiveContent/chapel/1986.jpg",
  },
  {
    id: "chapel-2009",
    buildingId: "chapel",
    buildingName: "chapel",
    year: 2009,
    caption: "Later exterior view of the chapel and its grounds.",
    imageUrl: "",
  },
  {
    id: "waldschmidt-1892",
    buildingId: "waldschmidt",
    buildingName: "waldschmidt",
    year: 1892,
    caption: "One of the earliest surviving images of Waldschmidt Hall.",
    imageUrl: "/archiveContent/waldschmidt/1892.jpg",
  },
  {
    id: "waldschmidt-2021",
    buildingId: "waldschmidt",
    buildingName: "waldschmidt",
    year: 2021,
    caption: "Waldschmidt Hall in its modern administrative role.",
    imageUrl: "/archiveContent/waldschmidt/2021.jpg",
  },
  {
    id: "franz-1994",
    buildingId: "franz",
    buildingName: "franz",
    year: 1994,
    caption: "Franz Hall before its later science-facility modernization.",
    imageUrl: "/archiveContent/franz/1994.JPG",
  },
  {
    id: "franz-1996",
    buildingId: "franz",
    buildingName: "franz",
    year: 1996,
    caption: "Franz Hall in the mid-1990s.",
    imageUrl: "",
  },
  {
    id: "library-1958",
    buildingId: "library",
    buildingName: "library",
    year: 1958,
    caption: "Clark Library around its opening era.",
    imageUrl: "",
  },
  {
    id: "library-2013",
    buildingId: "library",
    buildingName: "library",
    year: 2013,
    caption: "Clark Library in the digital archive era.",
    imageUrl: "",
  },
  {
    id: "chiles-1984",
    buildingId: "chiles",
    buildingName: "chiles",
    year: 1984,
    caption: "Early years of the Chiles Center arena.",
    imageUrl: "/archiveContent/chiles/1984.jpg",
  },
  {
    id: "shiley-marcos-2025",
    buildingId: "shiley-marcos",
    buildingName: "shiley marcos",
    year: 2025,
    caption: "Design and innovation space in the new Shiley-Marcos Center.",
    imageUrl: "/images/04_01_2025_X-Design.png",
  },
];

const { parsedRows: parsedArchiveRows, parsedPhotos: parsedArchivePhotos } = parseArchiveSqlRows();

export const buildingContent: Record<string, BuildingContent[]> = (() => {
  const merged = new Map<string, Map<number, BuildingContent>>();

  const pushRow = (row: BuildingContent) => {
    const byBuilding = merged.get(row.buildingId) ?? new Map<number, BuildingContent>();
    if (!byBuilding.has(row.year)) {
      byBuilding.set(row.year, row);
    }
    merged.set(row.buildingId, byBuilding);
  };

  for (const row of parsedArchiveRows) {
    pushRow(row);
  }

  for (const row of Object.values(curatedBuildingContent).flat()) {
    pushRow(row);
  }

  return Object.fromEntries(
    Array.from(merged.entries()).map(([buildingId, rows]) => [
      buildingId,
      Array.from(rows.values()).sort((a, b) => a.year - b.year),
    ])
  );
})();

export const archivePhotos: ArchivePhoto[] = (() => {
  const merged = new Map<string, ArchivePhoto>();

  const pushPhoto = (photo: ArchivePhoto) => {
    const key = `${photo.buildingId}:${photo.year}`;
    if (!merged.has(key)) {
      merged.set(key, photo);
    }
  };

  for (const photo of parsedArchivePhotos) {
    pushPhoto(photo);
  }

  for (const photo of curatedArchivePhotos) {
    if (photo.imageUrl) {
      pushPhoto(photo);
    }
  }

  return Array.from(merged.values()).sort((a, b) => {
    if (a.buildingId === b.buildingId) {
      return a.year - b.year;
    }
    return a.buildingId.localeCompare(b.buildingId);
  });
})();

// Campus center coordinates
export const CAMPUS_CENTER = { lat: 45.5730, lng: -122.7275 };
export const DEFAULT_ZOOM = 16;
