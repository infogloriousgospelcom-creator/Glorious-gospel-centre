"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function SermonAudioPlayer({ src, title }: { src: string; title: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onLoaded = () => setDuration(a.duration || 0);
    const onTime = () => setCurrent(a.currentTime || 0);
    const onEnd = () => setPlaying(false);
    const onError = () => setError("Unable to load this audio file.");
    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);
    a.addEventListener("error", onError);
    return () => {
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnd);
      a.removeEventListener("error", onError);
    };
  }, []);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      void a.play().then(() => setPlaying(true)).catch(() => setError("Playback was blocked."));
    }
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const a = audioRef.current;
    if (!a) return;
    const value = Number(e.target.value);
    a.currentTime = value;
    setCurrent(value);
  }

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-soft">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? `Pause ${title}` : `Play ${title}`}
          aria-pressed={playing}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white transition-colors hover:bg-brand-800 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          {playing ? (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div className="flex-1">
          <label className="sr-only" htmlFor="sermon-progress">
            Audio progress
          </label>
          <div className="relative h-2 overflow-hidden rounded-full bg-brand-100">
            <div
              className="absolute inset-y-0 left-0 bg-brand-600 transition-[width] duration-150"
              style={{ width: `${progress}%` }}
              aria-hidden="true"
            />
            <input
              id="sermon-progress"
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={current}
              onChange={seek}
              className={cn(
                "absolute inset-0 h-2 w-full cursor-pointer appearance-none bg-transparent",
                "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-700",
                "[&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-brand-700 [&::-moz-range-thumb]:border-0",
              )}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-ink-muted">
            <span aria-live="off">{formatTime(current)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-xs text-danger-700">
          {error}
        </p>
      ) : null}

      <audio ref={audioRef} src={src} preload="metadata" className="sr-only">
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}
