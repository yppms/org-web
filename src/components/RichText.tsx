import { cn } from "@/lib/utils";

/**
 * Typography for refund descriptions, shared by the admin's RichTextEditor
 * and every place the saved HTML is shown, so the admin sees exactly what the
 * parent gets. Preflight strips list markers and margins, hence the explicit
 * list styles. An empty <p> is a blank line the admin typed; min-h keeps it
 * from collapsing to nothing.
 */
export const RICH_TEXT_CLASS =
  "[&_p]:min-h-[1lh] [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-4 [&_ol]:pl-4 [&_li]:my-0.5 [&_strong]:font-semibold [&_em]:italic";

/** Descriptions saved before the editor existed are plain text. */
export const isHtml = (value: string) => value.trimStart().startsWith("<");

/** Plain text as editor HTML: one paragraph per line, escaped. */
export const plainTextToHtml = (text: string) =>
  text
    .split(/\r?\n/)
    .map(
      (line) =>
        `<p>${line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`,
    )
    .join("");

interface RichTextProps {
  html: string;
  className?: string;
}

/**
 * A refund description. org-server sanitizes it against the editor's
 * allowlist before storing it, so the HTML is rendered as-is.
 */
export default function RichText({ html, className }: RichTextProps) {
  if (!isHtml(html)) {
    return <div className={cn("whitespace-pre-line", className)}>{html}</div>;
  }
  return (
    <div
      className={cn(RICH_TEXT_CLASS, className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
