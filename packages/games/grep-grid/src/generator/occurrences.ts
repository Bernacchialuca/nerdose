import { DIRECTIONS, DIRECTION_STEPS, GRID_SIZE } from '../shared/geometry';

/** Apariciones de `word` contando solo las 4 direcciones hacia adelante (la reversa no cuenta). */
export function countOccurrences(grid: readonly (readonly string[])[], word: string): number {
  let count = 0;
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      for (const direction of DIRECTIONS) {
        const { dRow, dCol } = DIRECTION_STEPS[direction];
        let matches = true;
        for (let i = 0; i < word.length && matches; i++) {
          matches = grid[row + dRow * i]?.[col + dCol * i] === word[i];
        }
        if (matches) count++;
      }
    }
  }
  return count;
}
