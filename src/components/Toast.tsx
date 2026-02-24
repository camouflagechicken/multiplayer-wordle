import React from 'react';

interface ToastProps {
  message: string | null;
}

export default function Toast({ message }: ToastProps) {
  if (!message) return null;

  return (
    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-black text-white px-4 py-3 rounded font-bold text-sm shadow-lg transition-opacity duration-300">
        {message}
      </div>
    </div>
  );
}
