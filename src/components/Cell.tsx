import React, { useEffect, useState } from 'react';
import { LetterState } from '../utils';

interface CellProps {
  key?: React.Key;
  value: string;
  status: LetterState;
  animatePop?: boolean;
  animateFlip?: boolean;
  animateBounce?: boolean;
  animationDelay?: number;
  isOpponent?: boolean;
}

export default function Cell({ value, status, animatePop, animateFlip, animateBounce, animationDelay = 0, isOpponent }: CellProps) {
  const [displayStatus, setDisplayStatus] = useState<LetterState>(animateFlip ? 'tbd' : status);

  useEffect(() => {
    if (animateFlip) {
      const timer = setTimeout(() => {
        setDisplayStatus(status);
      }, animationDelay + 250); // Change color halfway through the 500ms flip
      return () => clearTimeout(timer);
    } else {
      setDisplayStatus(status);
    }
  }, [status, animateFlip, animationDelay]);

  let bgClass = 'bg-white dark:bg-gray-900';
  let borderClass = 'border-[#d3d6da] dark:border-gray-700';
  let textClass = 'text-black dark:text-white';

  if (displayStatus === 'tbd') {
    borderClass = 'border-[#878a8c] dark:border-gray-500';
  } else if (displayStatus === 'absent') {
    bgClass = 'bg-[#787c7e] dark:bg-gray-700';
    borderClass = 'border-[#787c7e] dark:border-gray-700';
    textClass = 'text-white';
  } else if (displayStatus === 'present') {
    bgClass = 'bg-[#c9b458] dark:bg-yellow-600';
    borderClass = 'border-[#c9b458] dark:border-yellow-600';
    textClass = 'text-white';
  } else if (displayStatus === 'correct') {
    bgClass = 'bg-[#6aaa64] dark:bg-green-600';
    borderClass = 'border-[#6aaa64] dark:border-green-600';
    textClass = 'text-white';
  }

  const classes = `
    w-14 h-14 sm:w-16 sm:h-16 border-2 flex items-center justify-center text-3xl font-bold uppercase select-none transition-colors duration-200
    ${bgClass} ${borderClass} ${textClass}
    ${animatePop ? 'cell-pop' : ''}
    ${animateBounce ? 'cell-bounce' : ''}
  `;

  const style = animateFlip ? {
    animation: `reveal 0.5s linear forwards`,
    animationDelay: `${animationDelay}ms`
  } : animateBounce ? {
    animationDelay: `${animationDelay}ms`
  } : {};

  return (
    <div className={classes} style={style}>
      {isOpponent ? '' : value}
    </div>
  );
}
