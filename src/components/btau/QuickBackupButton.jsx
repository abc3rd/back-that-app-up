import { motion } from 'framer-motion';
import { Rewind } from 'lucide-react';

// Floating quick-backup button, fixed above the tab bar so it stays reachable
// without scrolling. Only rendered while the pre-roll engine is listening.
export default function QuickBackupButton({ listening, onSave }) {
  if (!listening) return null;
  return (
    <motion.button
      type="button"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileTap={{ scale: 0.92 }}
      aria-label="Back up now"
      onClick={onSave}
      className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#00F2FF] to-[#FF00FF] text-[#050508] shadow-[0_0_20px_rgba(0,242,255,0.45)]"
    >
      <Rewind className="h-6 w-6" strokeWidth={1.75} />
    </motion.button>
  );
}