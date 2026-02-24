export type LetterState = 'correct' | 'present' | 'absent' | 'empty' | 'tbd';

export function evaluateGuess(guess: string, solution: string): LetterState[] {
  const result: LetterState[] = Array(5).fill('absent');
  const solutionChars = solution.split('');
  const guessChars = guess.split('');

  guessChars.forEach((char, i) => {
    if (char === solutionChars[i]) {
      result[i] = 'correct';
      solutionChars[i] = null as any;
    }
  });

  guessChars.forEach((char, i) => {
    if (result[i] !== 'correct' && solutionChars.includes(char)) {
      result[i] = 'present';
      solutionChars[solutionChars.indexOf(char)] = null as any;
    }
  });

  return result;
}
