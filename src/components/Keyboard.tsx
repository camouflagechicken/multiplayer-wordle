import React from 'react';
import { Delete } from 'lucide-react';

const ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['Enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'Backspace']
];

interface KeyboardProps {
  onChar: (char: string) => void;
  onDelete: () => void;
  onEnter: () => void;
  keyStatuses: { [key: string]: string };
}

export default function Keyboard({ onChar, onDelete, onEnter, keyStatuses }: KeyboardProps) {
  return (
    <div className="w-full max-w-[500px] mx-auto flex flex-col gap-2 p-2 pb-8">
      {ROWS.map((row, i) => (
        <div key={i} className="flex justify-center gap-1 sm:gap-1.5">
          {row.map((key) => {
            const isEnter = key === 'Enter';
            const isBackspace = key === 'Backspace';
            const status = keyStatuses[key];
            
            let bgClass = 'bg-[#d3d6da] hover:bg-[#c3c6ca]';
            let textClass = 'text-black';
            
            if (status === 'correct') {
              bgClass = 'bg-[#6aaa64]';
              textClass = 'text-white';
            } else if (status === 'present') {
              bgClass = 'bg-[#c9b458]';
              textClass = 'text-white';
            } else if (status === 'absent') {
              bgClass = 'bg-[#787c7e]';
              textClass = 'text-white';
            }

            const widthClass = isEnter || isBackspace ? 'w-[65px] sm:w-[75px]' : 'w-[40px] sm:w-[43px]';

            return (
              <button
                key={key}
                onClick={() => {
                  if (isEnter) onEnter();
                  else if (isBackspace) onDelete();
                  else onChar(key);
                }}
                className={`${widthClass} h-[58px] rounded font-bold uppercase flex items-center justify-center transition-colors select-none ${bgClass} ${textClass}`}
              >
                {isBackspace ? <Delete size={24} /> : key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
