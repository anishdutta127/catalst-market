/**
 * World data — land mask + 3D sphere projection for the Code w/ Claude globe.
 *
 * Replaces the prior hand-curated 199-dot equirectangular silhouette. Earth
 * is now modeled as:
 *
 *   1. LAND_REGIONS — a list of (lat, lng) bounding rectangles approximating
 *      every continent. Hand-tuned for a halftone aesthetic, not for cartographic
 *      accuracy. The continents read as recognizable shapes when sampled into
 *      a 5° dot grid; finer than that the rectangles' edges show.
 *
 *   2. LAND_MASK — a 36×72 boolean grid (5° resolution) baked from LAND_REGIONS
 *      at module load. Used by `isLandAt()` and `getDotGrid()`.
 *
 *   3. project3D() — orthographic sphere projection. Rotates around Y axis
 *      (longitude), with optional X tilt (latitude) so the camera can look at
 *      a city near the pole or at a high latitude without it floating off-frame.
 *      Returns visible=false for points on the back hemisphere.
 *
 *   4. getDotGrid() — samples land cells in the visible hemisphere at the
 *      requested zoom and returns screen-space dots ready to render.
 *
 *   5. CITIES — a small database of cities the narrative globe focuses on.
 *      Lookup by slug; each city's lat/lng is verified to fall in a land cell
 *      so pins land on continents, not in the ocean.
 *
 * Backward-compat exports retained while Globe.tsx is mid-rebuild (Commit B):
 * `project`, `isInsideCircle`, `CONTINENT_DOTS` still resolve. They are derived
 * from the new model and will be removed when Globe.tsx gets rewritten.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Grid resolution
// ─────────────────────────────────────────────────────────────────────────────

export const LAT_STEP = 5;
export const LNG_STEP = 5;
export const ROWS = 180 / LAT_STEP; // 36
export const COLS = 360 / LNG_STEP; // 72

// ─────────────────────────────────────────────────────────────────────────────
// Land regions — bounding rectangles that paint the continents
//
// Order does not matter; cells are land if ANY rectangle contains them.
// Where a continent has irregular shape (e.g. India tapering, S America's
// cone, Africa's bulge), several rectangles stack to approximate the curve.
// ─────────────────────────────────────────────────────────────────────────────

type LatLngRect = {
  readonly lat: readonly [number, number];
  readonly lng: readonly [number, number];
};

const LAND_REGIONS: readonly LatLngRect[] = [
  // ── North America ──
  { lat: [55, 71], lng: [-168, -141] },   // Alaska
  { lat: [60, 78], lng: [-141, -65] },    // Canadian north
  { lat: [50, 70], lng: [-130, -55] },    // Canada main
  { lat: [40, 50], lng: [-125, -67] },    // Northern US
  { lat: [30, 40], lng: [-125, -75] },    // Mid-US (lng -125 so SF's cell lands)
  { lat: [25, 30], lng: [-115, -78] },    // Southern US + N Mexico
  { lat: [15, 25], lng: [-110, -87] },    // Mexico (extended south so MX City lands)
  { lat: [12, 18], lng: [-92, -77] },     // Central America
  { lat: [8, 14], lng: [-85, -76] },      // Panama isthmus

  // ── Greenland ──
  { lat: [60, 70], lng: [-50, -25] },
  { lat: [70, 78], lng: [-55, -22] },
  { lat: [78, 83], lng: [-45, -22] },

  // ── South America ── (hand-tuned: tighter west coast, eastern bulge)
  { lat: [-5, 12], lng: [-78, -55] },     // Northern bulge (Colombia/Venezuela)
  { lat: [-12, -5], lng: [-78, -45] },    // North-Amazon mid (peru→brazil-east)
  { lat: [-20, -12], lng: [-72, -38] },   // South Amazon to Brazilian east coast
  { lat: [-25, -20], lng: [-68, -40] },   // Mid (Bolivia→Brazil narrow)
  { lat: [-35, -25], lng: [-70, -53] },   // Argentina/Uruguay
  { lat: [-45, -35], lng: [-72, -60] },   // Patagonia
  { lat: [-55, -45], lng: [-75, -65] },   // Patagonia tip

  // ── Europe ──
  { lat: [36, 45], lng: [-10, 30] },      // Mediterranean Europe
  { lat: [45, 55], lng: [-5, 35] },       // Central Europe
  { lat: [55, 70], lng: [4, 40] },        // Scandinavia
  { lat: [50, 60], lng: [-10, 2] },       // British Isles
  { lat: [63, 67], lng: [-25, -13] },     // Iceland

  // ── Africa ── (hand-tuned: clearer Horn, narrower south)
  { lat: [15, 37], lng: [-17, 36] },      // Sahara band
  { lat: [10, 17], lng: [-17, 45] },      // Sahel
  { lat: [4, 12], lng: [38, 51] },        // Horn (Ethiopia, Somalia)
  { lat: [-5, 10], lng: [-10, 42] },      // Equatorial belt
  { lat: [-20, -5], lng: [10, 40] },      // Southern interior
  { lat: [-30, -20], lng: [13, 35] },     // South Africa wide
  { lat: [-35, -30], lng: [16, 30] },     // Cape narrow
  { lat: [-25, -12], lng: [42, 50] },     // Madagascar

  // ── Middle East ──
  { lat: [12, 30], lng: [33, 60] },       // Arabian Peninsula
  { lat: [30, 42], lng: [25, 65] },       // Levant + Iran

  // ── Russia / Siberia ──
  { lat: [50, 78], lng: [30, 180] },      // Wide swath

  // ── Central Asia ──
  { lat: [40, 50], lng: [50, 90] },       // 'Stans

  // ── India ── (hand-tuned: less blocky tip + Bay-of-Bengal coast)
  { lat: [28, 36], lng: [72, 80] },       // Punjab/Kashmir north
  { lat: [25, 33], lng: [76, 90] },       // Northern wide incl. Bihar
  { lat: [20, 27], lng: [70, 87] },       // Central India
  { lat: [15, 22], lng: [70, 85] },       // Deccan plateau (Konkan coast included)
  { lat: [10, 17], lng: [74, 82] },       // Karnataka + Andhra
  { lat: [8, 13], lng: [76, 80] },        // Tamil Nadu tip (narrower)

  // ── China ──
  { lat: [22, 50], lng: [75, 135] },

  // ── Korea + Japan ──
  { lat: [33, 43], lng: [124, 132] },     // Korean peninsula
  { lat: [30, 46], lng: [130, 146] },     // Japan

  // ── SE Asia ──
  { lat: [12, 28], lng: [92, 110] },      // Indochina
  { lat: [5, 12], lng: [98, 110] },       // S Indochina + Malay
  { lat: [-10, 5], lng: [95, 142] },      // Indonesia
  { lat: [-10, -5], lng: [140, 150] },    // New Guinea
  { lat: [5, 19], lng: [117, 127] },      // Philippines

  // ── Australia ── (hand-tuned: narrower south-east, gulf-of-carpentaria notch)
  { lat: [-15, -10], lng: [125, 145] },   // Top end + Cape York
  { lat: [-25, -15], lng: [113, 154] },   // Northern half wide
  { lat: [-33, -25], lng: [115, 154] },   // Mid (Perth→Brisbane)
  { lat: [-39, -33], lng: [115, 154] },   // Southern (Adelaide→Sydney, lng 154 so Sydney's cell lands)

  // ── New Zealand ──
  { lat: [-47, -34], lng: [166, 179] },

  // ── Antarctica ──
  { lat: [-90, -68], lng: [-180, 180] },
];

// ─────────────────────────────────────────────────────────────────────────────
// Cities — at minimum the set the narrative globe drives through.
// All entries verified to fall in a land cell (test enforces this).
// ─────────────────────────────────────────────────────────────────────────────

export type City = {
  readonly slug: string;
  readonly name: string;
  readonly country: string;
  readonly lat: number;
  readonly lng: number;
  /**
   * 2-3 letter airport-code-style abbreviation. IATA city code where one
   * exists; common 2-letter shorthand for very recognizable US cities (SF,
   * LA). Used everywhere a short city identifier is rendered (cassette
   * pin labels, route line). MUST be uppercase A-Z + 0-9 only — the 5×7
   * bitmap font has no diacritics.
   */
  readonly labelShort: string;
};

export const CITIES: Readonly<Record<string, City>> = {
  sf:           { slug: "sf",           name: "San Francisco", country: "USA",          lat: 37.77, lng: -122.42, labelShort: "SF"  },
  la:           { slug: "la",           name: "Los Angeles",   country: "USA",          lat: 34.05, lng: -118.24, labelShort: "LA"  },
  austin:       { slug: "austin",       name: "Austin",        country: "USA",          lat: 30.27, lng:  -97.74, labelShort: "AUS" },
  chicago:      { slug: "chicago",      name: "Chicago",       country: "USA",          lat: 41.88, lng:  -87.63, labelShort: "CHI" },
  nyc:          { slug: "nyc",          name: "New York",      country: "USA",          lat: 40.71, lng:  -74.01, labelShort: "NYC" },
  miami:        { slug: "miami",        name: "Miami",         country: "USA",          lat: 25.76, lng:  -80.19, labelShort: "MIA" },
  toronto:      { slug: "toronto",      name: "Toronto",       country: "Canada",       lat: 43.65, lng:  -79.38, labelShort: "YTO" },
  mexicocity:   { slug: "mexicocity",   name: "Mexico City",   country: "Mexico",       lat: 19.43, lng:  -99.13, labelShort: "MEX" },
  saopaulo:     { slug: "saopaulo",     name: "São Paulo",     country: "Brazil",       lat: -23.55, lng: -46.63, labelShort: "GRU" },
  buenosaires:  { slug: "buenosaires",  name: "Buenos Aires",  country: "Argentina",    lat: -34.61, lng: -58.40, labelShort: "BUE" },
  london:       { slug: "london",       name: "London",        country: "UK",           lat: 51.51, lng:   -0.13, labelShort: "LON" },
  paris:        { slug: "paris",        name: "Paris",         country: "France",       lat: 48.86, lng:    2.35, labelShort: "PAR" },
  amsterdam:    { slug: "amsterdam",    name: "Amsterdam",     country: "Netherlands",  lat: 52.37, lng:    4.90, labelShort: "AMS" },
  berlin:       { slug: "berlin",       name: "Berlin",        country: "Germany",      lat: 52.52, lng:   13.41, labelShort: "BER" },
  stockholm:    { slug: "stockholm",    name: "Stockholm",     country: "Sweden",       lat: 59.33, lng:   18.06, labelShort: "STO" },
  istanbul:     { slug: "istanbul",     name: "Istanbul",      country: "Turkey",       lat: 41.01, lng:   28.98, labelShort: "IST" },
  cairo:        { slug: "cairo",        name: "Cairo",         country: "Egypt",        lat: 30.04, lng:   31.24, labelShort: "CAI" },
  telaviv:      { slug: "telaviv",      name: "Tel Aviv",      country: "Israel",       lat: 32.08, lng:   34.78, labelShort: "TLV" },
  dubai:        { slug: "dubai",        name: "Dubai",         country: "UAE",          lat: 25.20, lng:   55.27, labelShort: "DXB" },
  lagos:        { slug: "lagos",        name: "Lagos",         country: "Nigeria",      lat:  6.52, lng:    3.38, labelShort: "LOS" },
  capetown:     { slug: "capetown",     name: "Cape Town",     country: "South Africa", lat: -33.92, lng:  18.42, labelShort: "CPT" },
  bangalore:    { slug: "bangalore",    name: "Bangalore",     country: "India",        lat: 12.97, lng:   77.59, labelShort: "BLR" },
  mumbai:       { slug: "mumbai",       name: "Mumbai",        country: "India",        lat: 19.08, lng:   72.88, labelShort: "BOM" },
  delhi:        { slug: "delhi",        name: "Delhi",         country: "India",        lat: 28.61, lng:   77.21, labelShort: "DEL" },
  singapore:    { slug: "singapore",    name: "Singapore",     country: "Singapore",    lat:  1.35, lng:  103.82, labelShort: "SIN" },
  jakarta:      { slug: "jakarta",      name: "Jakarta",       country: "Indonesia",    lat: -6.20, lng:  106.85, labelShort: "JKT" },
  hongkong:     { slug: "hongkong",     name: "Hong Kong",     country: "Hong Kong",    lat: 22.32, lng:  114.17, labelShort: "HKG" },
  shanghai:     { slug: "shanghai",     name: "Shanghai",      country: "China",        lat: 31.23, lng:  121.47, labelShort: "SHA" },
  beijing:      { slug: "beijing",      name: "Beijing",       country: "China",        lat: 39.90, lng:  116.41, labelShort: "BJS" },
  seoul:        { slug: "seoul",        name: "Seoul",         country: "South Korea",  lat: 37.57, lng:  126.98, labelShort: "SEL" },
  tokyo:        { slug: "tokyo",        name: "Tokyo",         country: "Japan",        lat: 35.68, lng:  139.69, labelShort: "TYO" },
  sydney:       { slug: "sydney",       name: "Sydney",        country: "Australia",    lat: -33.87, lng: 151.21, labelShort: "SYD" },
};

// ─────────────────────────────────────────────────────────────────────────────
// LAND_MASK — built once at module load from LAND_REGIONS
// ─────────────────────────────────────────────────────────────────────────────

function buildLandMask(): boolean[][] {
  const grid: boolean[][] = [];
  for (let row = 0; row < ROWS; row++) {
    // Cell center latitude — row 0 is 90→85N (center 87.5), row 35 is -85→-90 (center -87.5)
    const lat = 90 - row * LAT_STEP - LAT_STEP / 2;
    const cells: boolean[] = [];
    for (let col = 0; col < COLS; col++) {
      // Cell center longitude — col 0 is -180→-175 (center -177.5), col 71 is 175→180 (center 177.5)
      const lng = -180 + col * LNG_STEP + LNG_STEP / 2;
      let isLand = false;
      for (const r of LAND_REGIONS) {
        if (lat >= r.lat[0] && lat <= r.lat[1] && lng >= r.lng[0] && lng <= r.lng[1]) {
          isLand = true;
          break;
        }
      }
      cells.push(isLand);
    }
    grid.push(cells);
  }
  return grid;
}

export const LAND_MASK: readonly (readonly boolean[])[] = buildLandMask();

/**
 * True if the given (lat, lng) falls in a land cell. Uses LAND_MASK lookup,
 * not a fresh LAND_REGIONS scan, so this is O(1).
 */
export function isLandAt(lat: number, lng: number): boolean {
  // Wrap longitude to [-180, 180)
  let l = lng;
  while (l < -180) l += 360;
  while (l >= 180) l -= 360;
  // Clamp lat to [-90, 90]
  const la = Math.max(-90, Math.min(90, lat));
  const row = Math.min(ROWS - 1, Math.max(0, Math.floor((90 - la) / LAT_STEP)));
  const col = Math.min(COLS - 1, Math.max(0, Math.floor((l + 180) / LNG_STEP)));
  return LAND_MASK[row]![col]!;
}

// ─────────────────────────────────────────────────────────────────────────────
// Density bias — purely decorative texture variation between regions
//
// Hand-tuned bounding rectangles. Each cell falls in zero or one region;
// `getDensityBias` picks the first match (so DENSITY_REGIONS order matters
// for overlapping bounds — high-density regions listed first to win ties).
// Bias drives the keep-or-skip decision in `getDotGrid` so high-density
// regions render denser, low-density regions render sparser. Not tied to
// any Catalst data — this is map-texture flavor, nothing more.
// ─────────────────────────────────────────────────────────────────────────────

export type DensityRegion = {
  readonly name: string;
  readonly lat: readonly [number, number];
  readonly lng: readonly [number, number];
  readonly bias: number;
};

export const DEFAULT_DENSITY_BIAS = 0.4;

export const DENSITY_REGIONS: readonly DensityRegion[] = [
  // High density — busy, populated, visually "alive"
  { name: "India",          lat: [8, 35],   lng: [70, 92],    bias: 1.0  },
  { name: "Western Europe", lat: [40, 60],  lng: [-10, 30],   bias: 1.0  },
  { name: "US East Coast",  lat: [25, 50],  lng: [-90, -65],  bias: 1.0  },
  { name: "Eastern China",  lat: [22, 45],  lng: [105, 125],  bias: 0.95 },
  { name: "SE Asia",        lat: [-10, 25], lng: [95, 130],   bias: 0.9  },
  { name: "Japan + Korea",  lat: [30, 46],  lng: [124, 146],  bias: 0.95 },
  // Low density — sparse, empty, visual breathing room
  { name: "Sahara",            lat: [15, 30],  lng: [-5, 30],   bias: 0.3  },
  { name: "Australian Outback",lat: [-30, -18],lng: [120, 145], bias: 0.3  },
  { name: "Siberia",           lat: [55, 75],  lng: [60, 170],  bias: 0.35 },
  { name: "Antarctica",        lat: [-90, -65],lng: [-180, 180],bias: 0.25 },
  { name: "Greenland Interior",lat: [70, 83],  lng: [-50, -30], bias: 0.3  },
];

/** Returns the density bias [0..1] for the given (lat, lng). */
export function getDensityBias(lat: number, lng: number): number {
  for (const r of DENSITY_REGIONS) {
    if (lat >= r.lat[0] && lat <= r.lat[1] && lng >= r.lng[0] && lng <= r.lng[1]) {
      return r.bias;
    }
  }
  return DEFAULT_DENSITY_BIAS;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mixed-glyph terrain — deterministic per (lat, lng)
//
// Distribution:
//   70% — small dot
//   20% — large dot
//    8% — asterisk (3×3 dot-matrix X)
//    2% — plus-sign (3×3 dot-matrix +)
//
// `cellHash` is a tiny deterministic hash so the same cell always picks the
// same glyph and same keep-or-skip outcome across renders. Two independent
// hashes derived from the same seed (one for keep, one for glyph) keep the
// two distributions independent so density bias doesn't accidentally bias
// glyph kind.
// ─────────────────────────────────────────────────────────────────────────────

export type GlyphKind =
  | "dot" // ~50%
  | "dot-medium" // ~30%
  | "dot-large" // ~12%
  | "asterisk" // ~6%
  | "plus" // ~2%
  | "ocean-dot"; // sparse ocean texture, low opacity

/** Deterministic 0..1 hash from (lat, lng). Stable across calls. */
function cellHash(lat: number, lng: number, salt: number): number {
  // Multiply lat/lng by a large prime to spread similar inputs across the hash.
  const x = Math.floor((lat + 90) * 113);
  const y = Math.floor((lng + 180) * 211);
  let h = (x * 73856093) ^ (y * 19349663) ^ (salt * 83492791);
  h = (h ^ (h >>> 16)) >>> 0;
  return (h % 100000) / 100000;
}

/** True if a cell at (lat, lng) should be rendered, given its density bias. */
export function shouldRenderCell(lat: number, lng: number): boolean {
  const bias = getDensityBias(lat, lng);
  // salt=1 for the keep-or-skip hash
  return cellHash(lat, lng, 1) < bias;
}

/**
 * True when a land cell sits adjacent to at least one ocean cell at the given
 * sample step. Used to bump opacity on coastal dots so the continent edges
 * register as "darker accent" against the interior — the printed-map look
 * the Anthropic reference video uses.
 */
export function isCoastal(lat: number, lng: number, step: number = 3): boolean {
  if (!isLandAt(lat, lng)) return false;
  return (
    !isLandAt(lat + step, lng) ||
    !isLandAt(lat - step, lng) ||
    !isLandAt(lat, lng + step) ||
    !isLandAt(lat, lng - step)
  );
}

/** Picks a glyph kind for a LAND cell. Distribution: 50/30/12/6/2. */
export function pickGlyph(lat: number, lng: number): GlyphKind {
  // salt=2 for the glyph-kind hash
  const h = cellHash(lat, lng, 2);
  if (h < 0.5) return "dot";
  if (h < 0.8) return "dot-medium";
  if (h < 0.92) return "dot-large";
  if (h < 0.98) return "asterisk";
  return "plus";
}

/** True if an OCEAN cell should render a faint texture dot. ~5% sample rate. */
export function shouldRenderOceanDot(lat: number, lng: number): boolean {
  // salt=4 — independent of land hashes
  return cellHash(lat, lng, 4) < 0.05;
}

// ─────────────────────────────────────────────────────────────────────────────
// Accent glyph paths — 5 sub-cell offsets per glyph, drawn as small <rect>s
// in the same dot-matrix vocabulary as font-bitmap.ts.
//
// Each entry is (dx, dy) in sub-cell units. The renderer translates them
// into the glyph's local coordinate frame, scaled by the glyph's sub-cell
// size (typically ~1.0 viewBox units).
//
//   PLUS_GLYPH      ASTERISK_GLYPH (X-shape — reads as "star" at this size)
//      .#.            #.#
//      ###            .#.
//      .#.            #.#
//
// Both are 5 sub-cells, drawn with rect width = sub-cell, centered on (cx, cy).
// ─────────────────────────────────────────────────────────────────────────────

export const PLUS_GLYPH: ReadonlyArray<readonly [number, number]> = [
  [ 0, -1],
  [-1,  0], [0, 0], [1, 0],
  [ 0,  1],
];

export const ASTERISK_GLYPH: ReadonlyArray<readonly [number, number]> = [
  [-1, -1], [1, -1],
  [ 0,  0],
  [-1,  1], [1,  1],
];

// ─────────────────────────────────────────────────────────────────────────────
// project3D — orthographic sphere projection
// ─────────────────────────────────────────────────────────────────────────────

export type Projected3D = {
  /** Screen X in viewBox units. May fall outside [0, viewBox] at zoom > 1. */
  x: number;
  /** Screen Y in viewBox units. May fall outside [0, viewBox] at zoom > 1. */
  y: number;
  /** True if the point is on the front hemisphere (z >= 0 after rotation). */
  visible: boolean;
};

export type Project3DOptions = {
  /**
   * Optional X-axis tilt in degrees. To bring a city at latitude `L` to the
   * vertical center of the visible disc, pass `tiltX: L` (after rotating
   * around Y by the city's longitude). Positive tilt rotates the equator
   * toward the bottom of the screen, lifting northern latitudes upward
   * onto the visible center.
   */
  tiltX?: number;
};

/**
 * Project (lat, lng) on a unit sphere to viewBox-space coordinates.
 *
 * The sphere is rotated around the Y axis by `rotationY` degrees (so the
 * meridian at longitude `rotationY` ends up at the visible center), then
 * optionally tilted around the X axis by `options.tiltX` degrees, then
 * scaled by `zoom`. The base radius is 42% of the viewBox at zoom=1, so
 * the visible hemisphere just fits inside the box.
 *
 * @param lat        Latitude in degrees, [-90, 90].
 * @param lng        Longitude in degrees, [-180, 180].
 * @param rotationY  Y-axis rotation in degrees. Equivalent to "longitude
 *                   shift" — e.g. rotationY = -122 puts SF at center X.
 * @param zoom       Linear scale factor; 1 = full hemisphere fits viewBox.
 * @param viewBox    Width = height of the viewBox in user units.
 * @param options    Optional tiltX for vertical centering at zoom.
 */
export function project3D(
  lat: number,
  lng: number,
  rotationY: number,
  zoom: number = 1,
  viewBox: number = 200,
  options: Project3DOptions = {},
): Projected3D {
  const cx = viewBox / 2;
  const cy = viewBox / 2;
  const baseR = viewBox * 0.42;
  const R = baseR * zoom;

  const lngRad = ((lng - rotationY) * Math.PI) / 180;
  const latRad = (lat * Math.PI) / 180;

  // Step 1: spherical → Cartesian on a unit sphere
  let x = Math.cos(latRad) * Math.sin(lngRad);
  let y = Math.sin(latRad);
  let z = Math.cos(latRad) * Math.cos(lngRad);

  // Step 2: optional tilt around the X axis (rotates Y/Z plane)
  if (options.tiltX) {
    const t = (options.tiltX * Math.PI) / 180;
    const cosT = Math.cos(t);
    const sinT = Math.sin(t);
    const yRot = y * cosT - z * sinT;
    const zRot = y * sinT + z * cosT;
    y = yRot;
    z = zRot;
  }

  // Orthographic projection: x and y to screen, z is depth
  return {
    x: cx + x * R,
    y: cy - y * R,
    visible: z >= 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// getDotGrid — sample visible land cells into screen-space dots
// ─────────────────────────────────────────────────────────────────────────────

export type GlobeDot3D = {
  x: number;
  y: number;
  /** 0..1 — falls off toward the limb so the disc reads as a sphere. */
  opacity: number;
  /** Latitude of the source cell — exposed so callers can filter by region. */
  lat: number;
  /** Longitude of the source cell — exposed so callers can filter by region. */
  lng: number;
  /** Glyph kind for this cell. Caller decides how to render each kind. */
  glyph: GlyphKind;
};

export type DotGridOptions = Project3DOptions & {
  /** Sampling step in degrees. Defaults to 3°. Lower = denser dots. */
  step?: number;
  /** Base opacity at the visible center. Defaults to 0.35. */
  baseOpacity?: number;
  /** When false, skip the density-bias keep/skip filter (renders every land
      cell uniformly). Default true. */
  applyDensityBias?: boolean;
  /** When false, skip the sparse ocean-dot texture pass. Default true. */
  includeOcean?: boolean;
};

/**
 * Sample land cells in the visible hemisphere into screen-space dots.
 *
 * Iterates a uniform (lat, lng) grid at `options.step` degrees, calls
 * `isLandAt()` to filter to land cells, projects each via `project3D()`,
 * and emits a dot for every visible projection. Opacity scales with depth
 * so the limb dims to ~30% of center.
 *
 * Caller controls density. Defaults give ~400 dots inside the viewBox at
 * zoom 1; at zoom 4 with step=4° you'll see ~150–200 dots inside the box
 * (the rest project off-screen because the visible hemisphere is bigger
 * than the viewBox at high zoom — that's the desired "zoom-into-continent"
 * behavior).
 */
export function getDotGrid(
  rotationY: number,
  zoom: number = 1,
  viewBox: number = 200,
  options: DotGridOptions = {},
): GlobeDot3D[] {
  const step = options.step ?? 3;
  const baseOpacity = options.baseOpacity ?? 0.35;
  const applyDensityBias = options.applyDensityBias !== false;
  const includeOcean = options.includeOcean !== false;
  const dots: GlobeDot3D[] = [];

  for (let lat = -88 + step / 2; lat < 90; lat += step) {
    for (let lng = -180 + step / 2; lng < 180; lng += step) {
      const land = isLandAt(lat, lng);
      // Ocean texture: sparse low-opacity dots in the empty hemisphere so the
      // composition reads as "printed paper with ink" rather than "vector
      // wireframe over blank canvas." Skipped if includeOcean === false.
      if (!land) {
        if (!includeOcean) continue;
        if (!shouldRenderOceanDot(lat, lng)) continue;
        const p = project3D(lat, lng, rotationY, zoom, viewBox, { tiltX: options.tiltX });
        if (!p.visible) continue;
        dots.push({
          x: p.x,
          y: p.y,
          opacity: 0.08,
          lat,
          lng,
          glyph: "ocean-dot",
        });
        continue;
      }
      // Density-bias keep/skip — drop cells in low-density regions to give
      // continents textural variation. Hashed deterministically per cell so
      // the same lat/lng always renders (or always skips).
      if (applyDensityBias && !shouldRenderCell(lat, lng)) continue;
      const p = project3D(lat, lng, rotationY, zoom, viewBox, { tiltX: options.tiltX });
      if (!p.visible) continue;
      // Compute depth from the center-of-disc distance — visible points have
      // z >= 0; we re-derive depth as the unit-sphere z value (0..1).
      const lngRad = ((lng - rotationY) * Math.PI) / 180;
      const latRad = (lat * Math.PI) / 180;
      let zUnit = Math.cos(latRad) * Math.cos(lngRad);
      if (options.tiltX) {
        const t = (options.tiltX * Math.PI) / 180;
        const yUnit = Math.sin(latRad);
        zUnit = yUnit * Math.sin(t) + zUnit * Math.cos(t);
      }
      const depthFactor = 0.3 + 0.7 * Math.max(0, zUnit);
      // Coastal accent: cells touching ocean render at +43% opacity so the
      // continent edges register as a slightly darker outline against
      // the interior. Pure printed-map texture, no data meaning.
      const coastalBoost = isCoastal(lat, lng, step) ? 1.43 : 1;
      dots.push({
        x: p.x,
        y: p.y,
        opacity: Math.min(1, baseOpacity * depthFactor * coastalBoost),
        lat,
        lng,
        glyph: pickGlyph(lat, lng),
      });
    }
  }
  return dots;
}

// ─────────────────────────────────────────────────────────────────────────────
// project3DCentered + getDotGridCentered — explicit-focus variants
//
// These always project with the focus city at the viewBox center, regardless
// of the camera state's rotationY/tiltX. Use them at zoom > 2.0 so the active
// continent stays framed cleanly even during in-tween moments. At zoom ≤ 2.0,
// prefer the camera-driven `project3D` / `getDotGrid` pair so the rotation
// tween between scenes still reads as a globe spinning, not a teleport.
// ─────────────────────────────────────────────────────────────────────────────

export type FocusPoint = { readonly lat: number; readonly lng: number };

/**
 * Project (lat, lng) with `focus` always at the viewBox center. Equivalent to
 * `project3D(lat, lng, focus.lng, zoom, viewBox, { tiltX: focus.lat })` but
 * named for intent at call sites.
 */
export function project3DCentered(
  lat: number,
  lng: number,
  zoom: number,
  viewBox: number,
  focus: FocusPoint,
): Projected3D {
  return project3D(lat, lng, focus.lng, zoom, viewBox, { tiltX: focus.lat });
}

/**
 * Same as `getDotGrid` but always renders with `focus` at the viewBox center.
 * Used during deep ZOOM phases of the narrative to keep the active city
 * framed even while the camera tween hasn't fully settled.
 */
export function getDotGridCentered(
  focus: FocusPoint,
  zoom: number,
  viewBox: number = 200,
  options: Omit<DotGridOptions, "tiltX"> = {},
): GlobeDot3D[] {
  return getDotGrid(focus.lng, zoom, viewBox, {
    ...options,
    tiltX: focus.lat,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Backward-compat exports — used by the in-flight Globe.tsx until Commit B
// rewrites it. These derive from the new model; do not extend them.
// ─────────────────────────────────────────────────────────────────────────────

export type GeoPoint = { lat: number; lng: number };
export type ProjectedPoint = { x: number; y: number };

/**
 * @deprecated — derived from LAND_MASK at 10° resolution for parity with the
 * pre-rebuild silhouette. Removed in Commit B.
 */
export const CONTINENT_DOTS: readonly GeoPoint[] = (() => {
  const out: GeoPoint[] = [];
  for (let lat = -85; lat <= 85; lat += 10) {
    for (let lng = -175; lng <= 175; lng += 10) {
      if (isLandAt(lat, lng)) out.push({ lat, lng });
    }
  }
  return out;
})();

/**
 * @deprecated — flat equirectangular projection used by the legacy Globe.
 * Removed in Commit B; use `project3D` instead.
 */
export function project(lat: number, lng: number): ProjectedPoint {
  const xScale = 0.48;
  const yScale = 0.85;
  return { x: lng * xScale + 100, y: -lat * yScale + 100 };
}

/**
 * @deprecated — circle clip used by legacy flat-disc Globe. Removed in
 * Commit B; the new sphere projection has no need for a separate clip.
 */
export function isInsideCircle(p: ProjectedPoint, radius = 92): boolean {
  const dx = p.x - 100;
  const dy = p.y - 100;
  return dx * dx + dy * dy <= radius * radius;
}
