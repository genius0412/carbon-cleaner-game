import { HTMLAttributes } from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  glow?: "leaf" | "cyan" | "none";
}

export function Card({ glow = "none", className = "", ...rest }: Props) {
  const glowClass =
    glow === "leaf" ? "glow-leaf" : glow === "cyan" ? "glow-cyan" : "";
  return (
    <div
      className={`glass rounded-2xl p-5 ${glowClass} ${className}`}
      {...rest}
    />
  );
}
