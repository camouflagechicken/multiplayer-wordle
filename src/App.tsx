import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ANSWERS, VALID_GUESSES } from './constants/words';
import { evaluateGuess, LetterState } from './utils';
import Board from './components/Board';
import Keyboard from './components/Keyboard';
import Toast from './components/Toast';
import { HelpCircle, BarChart2, Settings, Moon, Sun, Users, User } from 'lucide-react';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

function getCurrentEpoch() {
  return Math.floor(Date.now() / FIFTEEN_MINUTES_MS);
}

function getWordForEpoch(epoch: number) {
  // Simple seeded random using LCG
  const a = 1664525;
  const c = 1013904223;
  const m = 4294967296;
  const seed = (a * epoch + c) % m;
  return ANSWERS[seed % ANSWERS.length];
}

const playRefreshSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {
    console.error('Audio play failed', e);
  }
};

const formatTime = (ms: number) => {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export default function App() {
  const [epoch, setEpoch] = useState(getCurrentEpoch());
  const [solution, setSolution] = useState(getWordForEpoch(epoch));
  const [timeLeft, setTimeLeft] = useState((epoch + 1) * FIFTEEN_MINUTES_MS - Date.now());
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [shakeRowIndex, setShakeRowIndex] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [keyStatuses, setKeyStatuses] = useState<{ [key: string]: LetterState }>({});
  const [isRevealing, setIsRevealing] = useState(false);
  const [opponents, setOpponents] = useState<{ [id: string]: any[] }>({});
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isPracticeMode, setIsPracticeMode] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const userIdRef = useRef<string>(`user_${Math.random().toString(36).substring(2, 9)}`);

  useEffect(() => {
    // Connect to socket
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
    const socket = io(socketUrl);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to server with ID:', socket.id);
    });

    socket.on('playerStateUpdate', (data) => {
      console.log('Received playerStateUpdate:', data);
      setOpponents(prev => ({
        ...prev,
        [data.id]: data.grid
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (isPracticeMode) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const currentEpoch = Math.floor(now / FIFTEEN_MINUTES_MS);
      const nextEpochTime = (currentEpoch + 1) * FIFTEEN_MINUTES_MS;
      
      setTimeLeft(nextEpochTime - now);

      if (currentEpoch !== epoch) {
        setEpoch(currentEpoch);
        setSolution(getWordForEpoch(currentEpoch));
        setGuesses([]);
        setCurrentGuess('');
        setGameStatus('playing');
        setKeyStatuses({});
        setShakeRowIndex(null);
        setToastMessage(null);
        setIsRevealing(false);
        playRefreshSound();
        
        if (socketRef.current) {
          socketRef.current.emit('playerStateUpdate', {
            id: userIdRef.current,
            grid: []
          });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [epoch, isPracticeMode]);

  const showToast = (message: string, duration = 2000) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, duration);
  };

  const onChar = useCallback((char: string) => {
    if (gameStatus !== 'playing' || isRevealing) return;
    if (currentGuess.length < 5) {
      setCurrentGuess(prev => prev + char.toLowerCase());
    }
  }, [currentGuess, gameStatus, isRevealing]);

  const onDelete = useCallback(() => {
    if (gameStatus !== 'playing' || isRevealing) return;
    setCurrentGuess(prev => prev.slice(0, -1));
  }, [currentGuess, gameStatus, isRevealing]);

  const onEnter = useCallback(() => {
    if (gameStatus !== 'playing' || isRevealing) return;
    
    if (currentGuess.length !== 5) {
      setShakeRowIndex(guesses.length);
      showToast('Not enough letters');
      setTimeout(() => setShakeRowIndex(null), 600);
      return;
    }

    if (!VALID_GUESSES.includes(currentGuess)) {
      setShakeRowIndex(guesses.length);
      showToast('Not in word list');
      setTimeout(() => setShakeRowIndex(null), 600);
      return;
    }

    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);
    setCurrentGuess('');
    setIsRevealing(true);

    const fullGrid = newGuesses.map(guess => {
      const rowStatuses = evaluateGuess(guess, solution);
      return guess.split('').map((char, i) => ({
        char,
        status: rowStatuses[i]
      }));
    });

    if (!isPracticeMode && socketRef.current) {
      socketRef.current.emit('playerStateUpdate', {
        id: userIdRef.current,
        grid: fullGrid
      });
    }

    // Wait for reveal animation to finish before updating keyboard and game status
    setTimeout(() => {
      setIsRevealing(false);
      
      const newKeyStatuses = { ...keyStatuses };
      const statuses = evaluateGuess(currentGuess, solution);
      
      currentGuess.split('').forEach((char, i) => {
        const status = statuses[i];
        const currentStatus = newKeyStatuses[char];
        if (status === 'correct') {
          newKeyStatuses[char] = 'correct';
        } else if (status === 'present' && currentStatus !== 'correct') {
          newKeyStatuses[char] = 'present';
        } else if (status === 'absent' && currentStatus !== 'correct' && currentStatus !== 'present') {
          newKeyStatuses[char] = 'absent';
        }
      });
      setKeyStatuses(newKeyStatuses);

      if (currentGuess === solution) {
        setGameStatus('won');
        setTimeout(() => showToast('Splendid!', 3000), 1500); // Wait for bounce
        
        if (isPracticeMode) {
          setTimeout(() => {
            setSolution(ANSWERS[Math.floor(Math.random() * ANSWERS.length)]);
            setGuesses([]);
            setCurrentGuess('');
            setGameStatus('playing');
            setKeyStatuses({});
            setShakeRowIndex(null);
            setToastMessage(null);
            setIsRevealing(false);
          }, 2000);
        }
      } else if (newGuesses.length === 6) {
        setGameStatus('lost');
        setTimeout(() => showToast(solution.toUpperCase(), 5000), 500);
        
        if (isPracticeMode) {
          setTimeout(() => {
            setSolution(ANSWERS[Math.floor(Math.random() * ANSWERS.length)]);
            setGuesses([]);
            setCurrentGuess('');
            setGameStatus('playing');
            setKeyStatuses({});
            setShakeRowIndex(null);
            setToastMessage(null);
            setIsRevealing(false);
          }, 2000);
        }
      }
    }, 1500); // 5 letters * 300ms delay

  }, [currentGuess, gameStatus, guesses, isRevealing, solution, keyStatuses, isPracticeMode]);

  useEffect(() => {
    if (isPracticeMode) {
      setSolution(ANSWERS[Math.floor(Math.random() * ANSWERS.length)]);
      setGuesses([]);
      setCurrentGuess('');
      setGameStatus('playing');
      setKeyStatuses({});
      setShakeRowIndex(null);
      setToastMessage(null);
      setIsRevealing(false);
    } else {
      const currentEpoch = getCurrentEpoch();
      setEpoch(currentEpoch);
      setSolution(getWordForEpoch(currentEpoch));
      setGuesses([]);
      setCurrentGuess('');
      setGameStatus('playing');
      setKeyStatuses({});
      setShakeRowIndex(null);
      setToastMessage(null);
      setIsRevealing(false);
      
      if (socketRef.current) {
        socketRef.current.emit('playerStateUpdate', {
          id: userIdRef.current,
          grid: []
        });
      }
    }
  }, [isPracticeMode]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      
      if (e.key === 'Enter') {
        onEnter();
      } else if (e.key === 'Backspace') {
        onDelete();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        onChar(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onChar, onDelete, onEnter]);

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 text-black dark:text-white font-sans transition-colors duration-200">
      <header className="flex items-center justify-between px-4 h-12 sm:h-16 border-b border-[#d3d6da] dark:border-gray-800 relative">
        <div className="flex gap-2">
          <HelpCircle className="w-6 h-6 text-[#878a8c] dark:text-gray-400 cursor-pointer" />
        </div>
        <div className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-wider uppercase">
            Wordle
          </h1>
          <div className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-[-2px] sm:mt-[-4px]">
            {isPracticeMode ? 'PRACTICE' : formatTime(timeLeft)}
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={() => setIsPracticeMode(!isPracticeMode)} className="focus:outline-none mr-1">
            {isPracticeMode ? (
              <User className="w-6 h-6 text-[#878a8c] dark:text-gray-400 cursor-pointer" />
            ) : (
              <Users className="w-6 h-6 text-[#878a8c] dark:text-gray-400 cursor-pointer" />
            )}
          </button>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="focus:outline-none">
            {isDarkMode ? (
              <Sun className="w-6 h-6 text-[#878a8c] dark:text-gray-400 cursor-pointer" />
            ) : (
              <Moon className="w-6 h-6 text-[#878a8c] dark:text-gray-400 cursor-pointer" />
            )}
          </button>
          <BarChart2 className="w-6 h-6 text-[#878a8c] dark:text-gray-400 cursor-pointer" />
          <Settings className="w-6 h-6 text-[#878a8c] dark:text-gray-400 cursor-pointer" />
        </div>
      </header>

      <Toast message={toastMessage} />

      <div className="flex-grow flex flex-row overflow-hidden relative">
        {/* Floating Opponent Badges */}
        {!isPracticeMode && (
          <div className="absolute left-2 sm:left-4 top-4 bottom-4 w-16 sm:w-20 flex flex-col gap-3 overflow-y-auto pointer-events-none z-20">
            {Object.entries(opponents).map(([id, grid]) => {
              const opponentGuesses = (grid as any[]).map(row => row.map((cell: any) => cell.char).join(''));
              const hasWon = opponentGuesses.length > 0 && opponentGuesses[opponentGuesses.length - 1] === solution;
              
              return (
                <div key={id} className="flex flex-col items-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-1.5 sm:p-2 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 pointer-events-auto transition-colors duration-200">
                  <div className="text-[9px] sm:text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
                    {id.slice(0, 4)}
                  </div>
                  <div className="flex justify-center h-[55px] sm:h-[65px] overflow-hidden">
                    <div className="transform scale-[0.13] sm:scale-[0.15] origin-top w-[350px]">
                      <Board
                        guesses={opponentGuesses}
                        currentGuess=""
                        solution={solution}
                        shakeRowIndex={null}
                        winRowIndex={hasWon ? opponentGuesses.length - 1 : null}
                        isOpponent={true}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <main className="flex-grow flex flex-col items-center justify-between w-full max-w-[500px] mx-auto pt-8 pb-4 relative z-10">
          <Board
            guesses={guesses}
            currentGuess={currentGuess}
            solution={solution}
            shakeRowIndex={shakeRowIndex}
            winRowIndex={gameStatus === 'won' ? guesses.length - 1 : null}
          />
          <Keyboard
            onChar={onChar}
            onDelete={onDelete}
            onEnter={onEnter}
            keyStatuses={keyStatuses}
          />
        </main>
      </div>
    </div>
  );
}
