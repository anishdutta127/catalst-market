/**
 * PixelCharacter — 13×10 invader-style pixel figure.
 *
 * The character stands in a fixed pose; relocations between scenes are
 * HARD CUTS (opacity 1 → 0 → reposition → 0 → 1), NOT translate/slide
 * animations. Slides feel cute but undermine the dot-matrix aesthetic
 * the rest of the composition lives in. The reference video does this
 * exact cut — so we honor it.
 *
 * Two poses: "stand" (default) and "wave" (one arm raised). Three
 * positions: lower-left, lower-right, upper-right. Position is a layout
 * concern controlled by the parent — the character itself just renders
 * its grid; the parent absolutely positions it inside the composition.
 *
 * Hidden via opacity: when `hidden` is true the SVG goes to opacity 0
 * with a 200ms ease transition. The parent flips position during the
 * hidden window so the user perceives a clean cut, not a smear.
 */

const GRID_W = 13;
const GRID_H = 10;

export type CharacterPose = "stand" | "wave";
export type CharacterPosition = "lower-left" | "lower-right" | "upper-right";

const POSES: Readonly<Record<CharacterPose, readonly string[]>> = {
  stand: [
    ".....###.....",
    "....#####....",
    "....#.#.#....",
    "....#####....",
    "...#######...",
    "..#.#####.#..",
    "..#.#####.#..",
    "....#...#....",
    "....#...#....",
    "...##...##...",
  ],
  wave: [
    ".....###..#..",
    "....######...",
    "....#.#.##...",
    "....#######..",
    "...#######...",
    "..#.#####.#..",
    "....#####....",
    "....#...#....",
    "....#...#....",
    "...##...##...",
  ],
};

export interface PixelCharacterProps {
  pose?: CharacterPose;
  position: CharacterPosition;
  /** Pixel size of each grid cell in SVG units. Defaults to 3. */
  cell?: number;
  color?: string;
  className?: string;
  /** When true the character fades to opacity 0 over 200ms. */
  hidden?: boolean;
}

export function PixelCharacter({
  pose = "stand",
  position,
  cell = 3,
  color = "var(--color-cta)",
  className,
  hidden = false,
}: PixelCharacterProps) {
  const grid = POSES[pose];
  const totalW = GRID_W * cell;
  const totalH = GRID_H * cell;

  const dots: React.ReactNode[] = [];
  for (let y = 0; y < GRID_H; y++) {
    const row = grid[y];
    if (!row) continue;
    for (let x = 0; x < GRID_W; x++) {
      if (row[x] === "#") {
        dots.push(
          <rect
            key={`${x}-${y}`}
            data-character-pixel=""
            x={x * cell}
            y={y * cell}
            width={cell}
            height={cell}
            fill={color}
          />,
        );
      }
    }
  }

  return (
    <svg
      data-character=""
      data-character-position={position}
      data-character-pose={pose}
      data-character-hidden={hidden ? "true" : "false"}
      width={totalW}
      height={totalH}
      viewBox={`0 0 ${totalW} ${totalH}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        display: "block",
        opacity: hidden ? 0 : 1,
        transition: "opacity 200ms ease",
      }}
      aria-hidden="true"
    >
      {dots}
    </svg>
  );
}

/** Test helper — counts on-pixels in the encoded pose. */
export function countPosePixels(pose: CharacterPose): number {
  let n = 0;
  for (const row of POSES[pose]) for (const ch of row) if (ch === "#") n++;
  return n;
}
