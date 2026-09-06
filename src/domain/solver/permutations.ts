/**
 * All orderings of `items`, generated in a fixed, deterministic order:
 * the element at index 0 leads first, then index 1, and so on, recursively.
 */
export function permutations<T>(items: readonly T[]): T[][] {
  if (items.length === 0) return [[]];
  if (items.length === 1) return [[items[0]]];

  const result: T[][] = [];
  for (let i = 0; i < items.length; i += 1) {
    const head = items[i];
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const tail of permutations(rest)) {
      result.push([head, ...tail]);
    }
  }
  return result;
}

export function factorial(n: number): number {
  let acc = 1;
  for (let i = 2; i <= n; i += 1) acc *= i;
  return acc;
}
