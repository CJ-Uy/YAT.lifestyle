type Rating = { like?: number; strength?: number };

export function ratingComplete(rating?: Rating): boolean {
  return !!rating && [rating.like, rating.strength].every((value) =>
    typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5);
}

export function ratingsComplete(letters: string[], ratings: Partial<Record<string, Rating>>): boolean {
  return letters.every((letter) => ratingComplete(ratings[letter]));
}

export function ladderComplete(ladder: Partial<Record<number, number>>): boolean {
  return [1, 2, 3, 4].every((vial) => ladderAnswerComplete(ladder[vial]));
}

export function ladderAnswerComplete(value?: number): boolean {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 3;
}

export function pairComplete(pair: string[]): boolean {
  return pair.length === 2 && new Set(pair).size === 2 && pair.every((letter) => /^[A-F]$/.test(letter));
}
