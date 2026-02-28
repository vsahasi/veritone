import { motion } from "framer-motion";
import { CompareView } from "../components/compare/CompareView";

export default function Compare() {
  return (
    <motion.div
      className="h-full overflow-hidden"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <CompareView />
    </motion.div>
  );
}
