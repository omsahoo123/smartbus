import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(
        "rounded-md font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" && "px-2.5 py-1 text-xs",
        size === "md" && "px-4 py-2 text-sm",
        size === "lg" && "px-5 py-2.5 text-base",
        variant === "primary" && "bg-primary text-white hover:bg-primary-dark",
        variant === "secondary" && "border border-line bg-surface text-ink hover:border-primary",
        variant === "ghost" && "text-ink hover:bg-primary-light",
        variant === "danger" && "bg-danger text-white hover:opacity-90",
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
