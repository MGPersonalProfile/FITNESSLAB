import { cn } from "@/shared/lib/utils";

// The lab-report micro-label. Styling lives in the `mono-label` utility
// (globals.css); pass `className` to tweak color/spacing per use.
export default function MonoLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={cn("mono-label", className)}>{children}</span>;
}
