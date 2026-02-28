export type VideoStatus =
  | "pending"
  | "ingesting"
  | "processing_audio"
  | "processing_video"
  | "processing_text"
  | "computing_divergence"
  | "embedding"
  | "complete"
  | "failed";

export interface Video {
  id: number;
  title: string;
  source_url: string;
  duration_seconds: number;
  speaker_count: number;
  status: VideoStatus;
  created_at: string;
  utterance_count: number;
  avg_divergence: number;
  max_divergence: number;
  high_divergence_count: number;
  thumbnail_url: string;
}

export interface Speaker {
  id: number;
  label: string;
  name: string;
  utterance_count: number;
  avg_divergence: number;
  baseline_f0: number;
  dominant_sentiment: string;
  dominant_vocal_affect: string;
  color: string;
}

export type SemanticSentiment = "positive" | "negative" | "neutral" | "hedging" | "deflecting";
export type VocalAffect = "confident" | "stressed" | "monotone" | "animated" | "hesitant";
export type VisualAffect = "congruent" | "incongruent" | "neutral";

export interface Utterance {
  id: number;
  index: number;
  video_id: number;
  speaker_id: number;
  speaker_name: string;
  start_time: number;
  end_time: number;
  text: string;
  semantic_sentiment: SemanticSentiment;
  semantic_confidence: number;
  semantic_claim_density: number;
  vocal_affect: VocalAffect;
  vocal_stress_index: number;
  vocal_f0_deviation: number;
  vocal_speech_rate: number;
  vocal_pause_before: number;
  visual_affect: VisualAffect;
  visual_congruence_score: number;
  visual_blink_rate: number;
  visual_lip_compression: number;
  visual_gaze_deviation: number;
  divergence_score: number;
  divergence_flag: string | null;
  divergence_details: {
    semantic_vocal_distance: number;
    semantic_visual_distance: number;
    vocal_visual_distance: number;
  };
}

export interface AnalysisSummary {
  total_utterances: number;
  avg_divergence: number;
  max_divergence: number;
  high_divergence_count: number;
  top_flags: string[];
  modality_agreement_rate: number;
}

export interface Analysis {
  video: Video;
  speakers: Speaker[];
  utterances: Utterance[];
  summary: AnalysisSummary;
}

export interface TimelinePoint {
  time: number;
  divergence_score: number;
  semantic_score: number;
  vocal_score: number;
  visual_score: number;
  speaker_name: string;
  flag: string | null;
}

export interface QueryRequest {
  question: string;
  video_ids?: number[];
}

export interface QuerySourceItem {
  video_id: number;
  video_title: string;
  utterance_id: number;
  speaker_name: string;
  start_time: number;
  text: string;
  divergence_score: number;
}

export interface QueryResponse {
  answer: string;
  sources: QuerySourceItem[];
  tokens_used: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: QuerySourceItem[];
  timestamp: Date;
}
