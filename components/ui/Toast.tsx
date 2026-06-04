"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";

interface ToastItem {
  id: number;
  message: string;
  tone: "info" | "success" | "error";
}

const ToastCtx = createContext<(message: string, tone?: ToastItem["tone"]) => void>(
  () => {},
);

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, tone: ToastItem["tone"] = "info") => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, message, tone }]);
    setTimeout(() => setItems((s) => s.filter((i) => i.id !== id)), 3500);
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed right-4 top-4 z-[200] flex flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={`glass rounded-xl px-4 py-2.5 text-sm shadow-lg ${
              t.tone === "success"
                ? "border-l-2 border-l-leaf text-leaf"
                : t.tone === "error"
                  ? "border-l-2 border-l-danger text-danger"
                  : "border-l-2 border-l-cyan text-cyan"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
