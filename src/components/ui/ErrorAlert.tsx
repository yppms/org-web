import { ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface ErrorAlertProps {
  message: ReactNode;
  className?: string;
}

/**
 * Standard error banner — destructive-soft tint. Pair with useApi's `error`:
 * {error && <ErrorAlert message={error} />}
 */
export default function ErrorAlert({ message, className = "" }: ErrorAlertProps) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-2 rounded-lg bg-destructive-soft px-3 py-2.5 text-[13px] text-destructive ${className}`}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
