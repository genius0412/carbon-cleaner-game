"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Wraps the app in a Framer Motion config that respects the user's OS
 * "reduce motion" preference. With reducedMotion="user", transforms/opacity
 * animations are automatically toned down (effectively instant) for people who
 * ask for less motion, while everyone else gets the full animations.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
