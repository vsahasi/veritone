import { useState, useRef, useCallback, useEffect } from "react";
import type { Utterance } from "../types";

interface UseVideoSyncReturn {
  currentTime: number;
  isPlaying: boolean;
  duration: number;
  seekTo: (time: number) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  setDuration: (d: number) => void;
  activeUtteranceIndex: number | null;
}

export function useVideoSync(utterances: Utterance[], totalDuration: number): UseVideoSyncReturn {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(totalDuration);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentTimeRef = useRef(0);

  useEffect(() => {
    setDuration(totalDuration);
  }, [totalDuration]);

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTick = useCallback(() => {
    clearTick();
    intervalRef.current = setInterval(() => {
      currentTimeRef.current = Math.min(currentTimeRef.current + 0.1, duration);
      setCurrentTime(currentTimeRef.current);
      if (currentTimeRef.current >= duration) {
        clearTick();
        setIsPlaying(false);
      }
    }, 100);
  }, [clearTick, duration]);

  const play = useCallback(() => {
    setIsPlaying(true);
    startTick();
  }, [startTick]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    clearTick();
  }, [clearTick]);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  const seekTo = useCallback(
    (time: number) => {
      const clamped = Math.max(0, Math.min(time, duration));
      currentTimeRef.current = clamped;
      setCurrentTime(clamped);
    },
    [duration]
  );

  useEffect(() => {
    return () => clearTick();
  }, [clearTick]);

  const activeUtteranceIndex =
    utterances.length === 0
      ? null
      : (() => {
          let idx: number | null = null;
          for (let i = 0; i < utterances.length; i++) {
            if (
              currentTime >= utterances[i].start_time &&
              currentTime <= utterances[i].end_time
            ) {
              idx = i;
              break;
            }
          }
          return idx;
        })();

  return {
    currentTime,
    isPlaying,
    duration,
    seekTo,
    play,
    pause,
    toggle,
    setDuration,
    activeUtteranceIndex,
  };
}
