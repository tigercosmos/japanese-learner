/**
 * Split card IDs sequentially across totalDays.
 * Early days get an extra card when cards don't divide evenly.
 * Example: 10 cards / 3 days → [4, 3, 3]
 */
export function splitCards(allCardIds: string[], totalDays: number): string[][] {
  const cardIds: string[][] = [];
  const totalCards = allCardIds.length;
  const baseSize = Math.floor(totalCards / totalDays);
  const remainder = totalCards % totalDays;

  let start = 0;
  for (let i = 0; i < totalDays; i++) {
    const size = i < remainder ? baseSize + 1 : baseSize;
    cardIds.push(allCardIds.slice(start, start + size));
    start += size;
  }

  return cardIds;
}
