import { type ButtonHTMLAttributes } from "react";
import "./Button.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "ghost";
  icon?: React.ReactNode;
  content?: "start" | "center";
}

export function Button({
  variant = "default",
  icon,
  children,
  className,
  content,
  ...props
}: ButtonProps) {
  const cls = [
    "cc-btn",
    variant === "primary" && "cc-btn-primary",
    variant === "ghost" && "cc-btn-ghost",
    content === "center" ? "cc-center" : "cc-start",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={cls} {...props}>
      {icon}
      {children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost";
}

export function IconButton({
  variant = "default",
  children,
  className,
  ...props
}: IconButtonProps) {
  const cls = [
    variant === "ghost" ? "cc-btn-icon-ghost" : "cc-btn-icon",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}

interface ButtonGroupProps {
  children: React.ReactNode;
  label?: string;
}

export function ButtonGroup({ children, label }: ButtonGroupProps) {
  return (
    <div className="cc-shape-group" role="group" aria-label={label}>
      {children}
    </div>
  );
}
