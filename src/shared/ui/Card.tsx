import { cn } from "@/shared/lib/utils";

// The standard ruled container used across the app
// (`border border-[var(--rule)]`). Compose with `className` for padding etc.
export default function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("border border-[var(--rule)]", className)}>{children}</div>;
}
