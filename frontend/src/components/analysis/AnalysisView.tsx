import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { Analysis, Utterance, QuerySourceItem } from "../../types";
import { useVideoSync } from "../../hooks/useVideoSync";
import { buildTimeline } from "../../lib/mock-data";
import { VideoPlayer } from "./VideoPlayer";
import { Transcript } from "./Transcript";
import { UtteranceList } from "./UtteranceList";
import { DivergenceTimeline } from "./DivergenceTimeline";
import { ModalityLanes } from "./ModalityLanes";
import { UtteranceDetail } from "./UtteranceDetail";
import { ChatPanel } from "../chat/ChatPanel";

interface AnalysisViewProps {
  analysis: Analysis;
}

export function AnalysisView({ analysis }: AnalysisViewProps) {
  const { video, speakers, utterances } = analysis;

  const [activeSpeakerId, setActiveSpeakerId] = useState<number | null>(null);
  const [selectedUtterance, setSelectedUtterance] = useState<Utterance | null>(null);
  const [chatCollapsed, setChatCollapsed] = useState(false);

  const { currentTime, isPlaying, duration, seekTo, toggle, activeUtteranceIndex } = useVideoSync(
    utterances,
    video.duration_seconds
  );

  const timeline = buildTimeline(utterances);
  const speakerColorMap = Object.fromEntries(speakers.map((s) => [s.id, s.color]));

  const handleSourceClick = (source: QuerySourceItem) => {
    seekTo(source.start_time);
    const u = utterances.find((u) => u.id === source.utterance_id);
    if (u) setSelectedUtterance(u);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left panel */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Upper section: video + utterance list */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Video + Transcript */}
          <div className="flex flex-col w-[55%] min-w-0 border-r border-[var(--border-subtle)] overflow-hidden">
            <VideoPlayer
              video={video}
              currentTime={currentTime}
              isPlaying={isPlaying}
              onToggle={toggle}
              onSeek={seekTo}
            />
            <Transcript
              utterances={utterances}
              speakerColorMap={speakerColorMap}
              activeIndex={activeUtteranceIndex}
              selectedId={selectedUtterance?.id ?? null}
              onUtteranceClick={(u) => {
                setSelectedUtterance(u);
                seekTo(u.start_time);
              }}
            />
          </div>

          {/* Utterance list */}
          <div className="flex flex-col w-[45%] min-w-0 overflow-hidden">
            <UtteranceList
              analysis={analysis}
              activeSpeakerId={activeSpeakerId}
              onSpeakerSelect={setActiveSpeakerId}
              activeUtteranceIndex={activeUtteranceIndex}
              selectedUtterance={selectedUtterance}
              onSelectUtterance={(u) => {
                setSelectedUtterance(u);
                seekTo(u.start_time);
              }}
              onSeek={seekTo}
            />
          </div>
        </div>

        {/* Timeline section */}
        <div
          className="shrink-0 border-t border-[var(--border-subtle)] bg-[var(--bg-root)]"
          style={{ maxHeight: 240 }}
        >
          <DivergenceTimeline
            data={timeline}
            currentTime={currentTime}
            duration={duration}
            onSeek={seekTo}
          />
          <ModalityLanes
            data={timeline}
            currentTime={currentTime}
            onSeek={seekTo}
          />
        </div>

        {/* Utterance detail panel */}
        <AnimatePresence>
          {selectedUtterance && (
            <UtteranceDetail
              key={selectedUtterance.id}
              utterance={selectedUtterance}
              speakerColor={speakerColorMap[selectedUtterance.speaker_id] ?? "var(--accent)"}
              onClose={() => setSelectedUtterance(null)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Chat panel */}
      <ChatPanel
        videoId={video.id}
        isCollapsed={chatCollapsed}
        onToggle={() => setChatCollapsed((v) => !v)}
        onSourceClick={handleSourceClick}
      />
    </div>
  );
}
