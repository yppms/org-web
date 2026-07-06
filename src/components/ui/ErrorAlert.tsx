import { ReactNode } from "react";

interface ErrorAlertProps {
  message: ReactNode;
  className?: string;
}

/**
 * Standard error banner. Replaces the copy-pasted `alert alert-error` blocks.
 * Pair with useApi's `error` value: {error && <ErrorAlert message={error} />}
 */
export default function ErrorAlert({ message, className = "" }: ErrorAlertProps) {
  return (
    <div className={`alert alert-error ${className}`}>
      <span>{message}</span>
    </div>
  );
}
