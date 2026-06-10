/**
 * Format a carbon delta in the same unit the main gauge shows (ppm/mo), so
 * every action's effect reads directly against "Carbon Gain / mo".
 */
export function gainCut(delta: number): string {
  const v = Math.abs(delta);
  if (v === 0) return "0 ppm/mo";
  if (v < 0.0001) return "<0.0001 ppm/mo";
  return `${v.toFixed(4)} ppm/mo`;
}
