import { useQuery } from "@tanstack/react-query";
import { fetchAnalysis, fetchTimeline, fetchVideos } from "../lib/api";

export function useVideos() {
  return useQuery({
    queryKey: ["videos"],
    queryFn: fetchVideos,
    staleTime: 30_000,
  });
}

export function useAnalysis(videoId: number) {
  return useQuery({
    queryKey: ["analysis", videoId],
    queryFn: () => fetchAnalysis(videoId),
    staleTime: 60_000,
    enabled: videoId > 0,
  });
}

export function useTimeline(videoId: number) {
  return useQuery({
    queryKey: ["timeline", videoId],
    queryFn: () => fetchTimeline(videoId),
    staleTime: 60_000,
    enabled: videoId > 0,
  });
}
