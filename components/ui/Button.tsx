import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "amber";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-leaf text-night font-semibold hover:bg-leaf-dim glow-leaf disabled:opacity-40 disabled:shadow-none",
  secondary:
    "bg-cyan/15 text-cyan border border-cyan/30 hover:bg-cyan/25 disabled:opacity-40",
  ghost:
    "border border-white/12 text-fog/90 hover:bg-white/5 disabled:opacity-40",
  danger:
    "bg-danger/90 text-white font-semibold hover:bg-danger disabled:opacity-40",
  amber:
    "bg-amber/90 text-night font-semibold hover:bg-amber disabled:opacity-40",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-8 py-3 text-base",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", className = "", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-full transition-all active:scale-[0.98] disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    />
  );
});
