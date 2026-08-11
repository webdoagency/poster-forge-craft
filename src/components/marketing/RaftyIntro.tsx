import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import iconAsset from "@/assets/rafty-icon.png.asset.json";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

const SESSION_KEY = "rafty-intro-shown";

/**
 * Quick, once-per-session brand intro shown before the marketing home
 * finishes revealing. Skipped entirely under reduced motion or on repeat
 * visits within the same session.
 */
export function RaftyIntro() {
  const reduced = usePrefersReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (reduced) return;
    const shown = window.sessionStorage.getItem(SESSION_KEY);
    if (shown) return;

    setVisible(true);
    window.sessionStorage.setItem(SESSION_KEY, "1");
    const timer = window.setTimeout(() => setVisible(false), 620);
    return () => window.clearTimeout(timer);
  }, [reduced]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="rafty-intro"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: "easeInOut" }}
        >
          <motion.img
            src={iconAsset.url}
            alt="Rafty"
            className="h-10 w-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
