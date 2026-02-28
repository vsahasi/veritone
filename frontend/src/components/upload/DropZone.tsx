import { useState, useRef } from "react";
import { Upload, Link as LinkIcon } from "lucide-react";
import { cn } from "../../lib/utils";

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  onUrlSubmit: (url: string) => void;
  title: string;
  onTitleChange: (title: string) => void;
  disabled?: boolean;
}

export function DropZone({ onFileSelect, onUrlSubmit, title, onTitleChange, disabled }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState<"file" | "url">("file");
  const [url, setUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) {
      onFileSelect(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex items-center gap-1 p-1 bg-[var(--bg-elevated)] rounded-[var(--radius-md)] w-fit">
        {(["file", "url"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-colors"
            style={{
              background: mode === m ? "var(--bg-surface)" : "transparent",
              color: mode === m ? "var(--text-primary)" : "var(--text-tertiary)",
              border: mode === m ? "1px solid var(--border-subtle)" : "1px solid transparent",
            }}
          >
            {m === "file" ? <Upload size={11} /> : <LinkIcon size={11} />}
            {m === "file" ? "Upload File" : "From URL"}
          </button>
        ))}
      </div>

      {mode === "file" ? (
        <div
          className={cn(
            "relative flex flex-col items-center justify-center gap-4 rounded-[var(--radius-xl)] border-2 border-dashed transition-all cursor-pointer",
            isDragging
              ? "border-[var(--accent)] bg-[var(--accent-muted)]"
              : "border-[var(--border-muted)] bg-[var(--bg-surface)] hover:border-[var(--border-accent)] hover:bg-[var(--bg-elevated)]"
          )}
          style={{ height: 200 }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled}
          />
          <div
            className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center"
            style={{ background: "var(--accent-muted)" }}
          >
            <Upload size={22} style={{ color: "var(--accent)" }} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Drop a video file here
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              or click to browse · MP4, MOV, WebM, AVI
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.05em] block mb-1.5">
              Video URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=... or C-SPAN link"
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--border-accent)] transition-colors"
              disabled={disabled}
            />
            <p className="text-[11px] text-[var(--text-tertiary)] mt-1.5">
              Supports YouTube, C-SPAN, Vimeo, and direct video links
            </p>
          </div>
        </div>
      )}

      {/* Title input */}
      <div>
        <label className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.05em] block mb-1.5">
          Title (optional)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Tesla Q4 2024 Earnings Call"
          className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--border-accent)] transition-colors"
          disabled={disabled}
        />
      </div>

      {mode === "url" && (
        <button
          onClick={() => url.trim() && onUrlSubmit(url.trim())}
          disabled={!url.trim() || disabled}
          className="w-full h-11 flex items-center justify-center gap-2 text-sm font-medium text-white rounded-[var(--radius-md)] bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <LinkIcon size={15} />
          Analyze from URL
        </button>
      )}
    </div>
  );
}
