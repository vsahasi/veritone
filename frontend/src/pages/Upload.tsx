import { motion } from "framer-motion";
import { UploadView } from "../components/upload/UploadView";

export default function Upload() {
  return (
    <motion.div
      className="h-full overflow-hidden"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <UploadView />
    </motion.div>
  );
}
