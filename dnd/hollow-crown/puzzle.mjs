export const CAPACITIES = Object.freeze([8, 5, 3]);
export const INITIAL = Object.freeze([8, 0, 0]);
export function solved(amounts) {
  return amounts.length === 3 && amounts[0] === 4 && amounts[1] === 4 && amounts[2] === 0;
}
export function pour(amounts, source, destination) {
  const next = [...amounts];
  if (!Number.isInteger(source) || !Number.isInteger(destination) || source < 0 || source > 2 || destination < 0 || destination > 2 || source === destination) return next;
  const quantity = Math.min(next[source], CAPACITIES[destination] - next[destination]);
  next[source] -= quantity;
  next[destination] += quantity;
  return next;
}
