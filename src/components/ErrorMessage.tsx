/**
 * @module ErrorMessage
 * @description Displays an error message in a styled banner.
 */

import { CircleAlert } from "lucide-react";

/**
 * Props for the {@link ErrorMessage} component.
 */
interface ErrorMessageProps {
  /** The error message to display. */
  readonly message: string;
}

/**
 * Renders a styled error banner with an alert icon and message text.
 * @param props - Component props.
 * @param props.message - The error message to display.
 * @returns An error banner element.
 */
export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}
