"use client";

import { ReactNode, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  wide?: boolean;
}

export function Modal({ open, onClose, title, children, wide }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            className="absolute inset-0 bg-night/80 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          />
          <motion.div
            className={`glass relative z-10 max-h-[88vh] w-full overflow-y-auto rounded-2xl p-6 ${
              wide ? "max-w-3xl" : "max-w-lg"
            }`}
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            {title && (
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-fog">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="rounded-full p-1.5 text-mist transition-colors hover:bg-white/8 hover:text-fog"
                >
                  ✕
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
