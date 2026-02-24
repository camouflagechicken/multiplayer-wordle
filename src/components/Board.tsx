import React from 'react';
import Row from './Row';

interface BoardProps {
  guesses: string[];
  currentGuess: string;
  solution: string;
  shakeRowIndex: number | null;
  winRowIndex: number | null;
}

export default function Board({ guesses, currentGuess, solution, shakeRowIndex, winRowIndex }: BoardProps) {
  const empties = Array(Math.max(0, 5 - guesses.length)).fill('');

  return (
    <div className="flex flex-col gap-1.5 sm:gap-2 items-center justify-center flex-grow w-full px-2">
      {guesses.map((guess, i) => (
        <Row
          key={i}
          guess={guess}
          solution={solution}
          isCurrentRow={false}
          isSubmitted={true}
          isWinningRow={winRowIndex === i}
        />
      ))}
      {guesses.length < 6 && (
        <Row
          guess={currentGuess}
          solution={solution}
          isCurrentRow={true}
          isSubmitted={false}
          shake={shakeRowIndex === guesses.length}
        />
      )}
      {empties.map((_, i) => (
        <Row
          key={i + guesses.length + 1}
          guess=""
          solution={solution}
          isCurrentRow={false}
          isSubmitted={false}
        />
      ))}
    </div>
  );
}
