import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useAnalysis } from "../hooks/useAnalysis";
import { AnalysisView } from "../components/analysis/AnalysisView";
import { Skeleton } from "../components/ui/Skeleton";

export default function VideoAnalysis() {
  const { id } = useParams<{ id: string }>();
  const videoId = parseInt(id ?? "0", 10);
  const { data: analysis, isLoading, error } = useAnalysis(videoId);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-subtle)]">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-[55%] border-r border-[var(--border-subtle)] p-4 space-y-3">
            <Skeleton className="w-full rounded-[var(--radius-md)]" style={{ aspectRatio: "16/9" }} />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <div className="flex-1 p-4 space-y-2">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <div className="text-4xl opacity-20">◆</div>
        <p className="text-sm text-[var(--text-secondary)]">Analysis not found.</p>
        <Link
          to="/"
          className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1"
        >
          <ArrowLeft size={12} /> Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      className="h-full overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <AnalysisView analysis={analysis} />
    </motion.div>
  );
}
