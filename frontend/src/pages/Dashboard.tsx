import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useVideos } from "../hooks/useAnalysis";
import { StatsStrip } from "../components/dashboard/StatsStrip";
import { VideoGrid } from "../components/dashboard/VideoGrid";
import { Button } from "../components/ui/Button";

export default function Dashboard() {
  const { data: videos, isLoading, error } = useVideos();

  return (
    <motion.div
      className="h-full overflow-y-auto"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-semibold text-[var(--text-primary)]"
              style={{ letterSpacing: "-0.025em" }}
            >
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Multimodal credibility analysis across {videos?.length ?? 0} video{(videos?.length ?? 0) !== 1 ? "s" : ""}
            </p>
          </div>
          <Link to="/upload">
            <Button variant="primary" size="md">
              <Plus size={15} />
              Analyze Video
            </Button>
          </Link>
        </div>

        {error && (
          <div className="p-4 rounded-[var(--radius-md)] bg-[var(--score-high-bg)] border border-[var(--score-high)] text-sm text-[var(--score-high)]">
            Failed to load videos. Please check the backend connection.
          </div>
        )}

        <StatsStrip videos={videos ?? []} />

        <div>
          <h2 className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.05em] mb-4">
            Analyzed Videos
          </h2>
          <VideoGrid videos={videos ?? []} isLoading={isLoading} />
        </div>
      </div>
    </motion.div>
  );
}
