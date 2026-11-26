import type { Point } from "./types";
export function chartPath(
  points: Point[],
  width: number,
  height: number,
  min: number,
  max: number,
  start: number,
  end: number,
  onlyValid = false,
): string {
  let path = "",
    pen = false,
    previous = 0;
  for (const p of points) {
    const invalid =
      !Number.isFinite(p.y) ||
      p.quality === 0 ||
      (onlyValid && p.quality !== 4);
    if (invalid) {
      pen = false;
      continue;
    }
    if (p.gap || p.t - previous > 30000) pen = false;
    const x = 48 + ((p.t - start) / Math.max(1, end - start)) * (width - 60),
      y = 12 + (1 - (p.y - min) / Math.max(1, max - min)) * (height - 40);
    path += `${pen ? "L" : "M"}${x.toFixed(2)},${Math.max(12, Math.min(height - 28, y)).toFixed(2)} `;
    pen = true;
    previous = p.t;
  }
  return path;
}
