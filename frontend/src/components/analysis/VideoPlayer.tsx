import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import type { Video } from "../../types";
import { formatTime } from "../../lib/utils";

interface VideoPlayerProps {
  video: Video;
  currentTime: number;
  isPlaying: boolean;
  onToggle: () => void;
  onSeek: (time: number) => void;
}

export function VideoPlayer({ video, currentTime, isPlaying, onToggle, onSeek }: VideoPlayerProps) {
  const duration = video.duration_seconds;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    onSeek(ratio * duration);
  };

  const skip = (delta: number) => onSeek(Math.max(0, Math.min(duration, currentTime + delta)));

  return (
    <div className="flex flex-col bg-[var(--bg-root)] border-b border-[var(--border-subtle)]">
      {/* Mock video area */}
      <div
        className="relative w-full flex items-center justify-center overflow-hidden"
        style={{ aspectRatio: "16/9", background: "var(--bg-surface)" }}
      >
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 40%, rgba(59,130,246,0.06) 0%, transparent 70%)",
          }}
        />

        {/* Video content placeholder */}
        <div className="flex flex-col items-center gap-3 z-10 text-center px-8">
          <div
            className="text-[40px] leading-none select-none"
            style={{ color: "var(--accent)", opacity: 0.4 }}
          >
            ◆
          </div>
          <div>
            <div
              className="text-sm font-semibold text-[var(--text-primary)]"
              style={{ letterSpacing: "-0.01em" }}
            >
              {video.title}
            </div>
            <div className="mt-1 text-xs text-[var(--text-tertiary)]">
              {video.speaker_count} speaker{video.speaker_count !== 1 ? "s" : ""} · {video.utterance_count} utterances
            </div>
          </div>
          {isPlaying && (
            <div className="flex items-center gap-1 mt-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-0.5 rounded-full bg-[var(--accent)]"
                  style={{
                    height: 16 + Math.sin(i * 1.2) * 8,
                    opacity: 0.7,
                    animation: `bounce_dot 1.2s ease-in-out ${i * 0.15}s infinite`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Current time overlay */}
        <div className="absolute bottom-3 right-3 font-mono text-xs text-[var(--text-secondary)] bg-[var(--bg-root)] bg-opacity-70 px-2 py-0.5 rounded">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 py-3 flex flex-col gap-2">
        {/* Progress bar */}
        <div
          className="group relative h-1.5 rounded-full cursor-pointer overflow-hidden bg-[var(--bg-elevated)]"
          onClick={handleProgressClick}
          role="slider"
          aria-label="Seek video"
          aria-valuenow={Math.round(currentTime)}
          aria-valuemin={0}
          aria-valuemax={duration}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") skip(5);
            if (e.key === "ArrowLeft") skip(-5);
          }}
        >
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-none"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>

        {/* Buttons row */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => skip(-10)}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
            aria-label="Skip back 10 seconds"
          >
            <SkipBack size={14} />
          </button>
          <button
            onClick={onToggle}
            className="w-8 h-8 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] flex items-center justify-center transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause size={14} className="text-white" />
            ) : (
              <Play size={14} className="text-white ml-0.5" />
            )}
          </button>
          <button
            onClick={() => skip(10)}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
            aria-label="Skip forward 10 seconds"
          >
            <SkipForward size={14} />
          </button>
          <span className="ml-auto font-mono text-xs text-[var(--text-tertiary)] tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
