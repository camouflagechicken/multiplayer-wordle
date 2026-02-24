import React, { useEffect, useState } from 'react';
import Cell from './Cell';
import { LetterState, evaluateGuess } from '../utils';

interface RowProps {
  key?: React.Key;
  guess: string;
  solution: string;
  isCurrentRow: boolean;
  isSubmitted: boolean;
  shake?: boolean;
  isWinningRow?: boolean;
  isOpponent?: boolean;
}

export default function Row({ guess, solution, isCurrentRow, isSubmitted, shake, isWinningRow, isOpponent }: RowProps) {
  const paddedGuess = guess.padEnd(5, ' ');
  const statuses = isSubmitted ? evaluateGuess(guess, solution) : Array(5).fill('empty');
  
  const [doBounce, setDoBounce] = useState(false);

  useEffect(() => {
    if (isWinningRow) {
      const timer = setTimeout(() => {
        setDoBounce(true);
      }, 1500); // Wait for flips to finish
      return () => clearTimeout(timer);
    }
  }, [isWinningRow]);

  return (
    <div className={`flex gap-1.5 sm:gap-2 ${shake ? 'row-shake' : ''}`}>
      {paddedGuess.split('').map((char, i) => {
        const isLetter = char !== ' ';
        let status: LetterState = 'empty';
        if (isSubmitted) {
          status = statuses[i];
        } else if (isLetter) {
          status = 'tbd';
        }

        return (
          <Cell
            key={i}
            value={char}
            status={status}
            animatePop={isCurrentRow && isLetter && !isSubmitted}
            animateFlip={isSubmitted}
            animateBounce={doBounce}
            animationDelay={doBounce ? i * 100 : isSubmitted ? i * 300 : 0}
            isOpponent={isOpponent}
          />
        );
      })}
    </div>
  );
}
