import { Fragment } from "react";

/**
 * Renders one entry's `noteParent`.
 *
 * Teacher notes run 500–1,500 characters and arrive as plain text carrying
 * three conventions from the app the teachers actually write in (WhatsApp):
 * hard line breaks, blank lines between sections, and `*asterisk*` for
 * emphasis. This preserves all three and nothing else — it is deliberately not
 * a markdown renderer, because the text was never authored as markdown.
 *
 * Each line is its own block so a blank source line becomes a tightened 10px
 * gap rather than a full empty line — notes stack several blank lines and a
 * literal render leaves holes in the card.
 *
 * Never truncated: lines wrap and the card grows.
 *
 * Justified via the `prose` utility. Only lines long enough to wrap are
 * affected — a short line is its own last line, which justify leaves alone —
 * so the WhatsApp-style short lines and headings keep their ragged right.
 */
export default function ReportEntryBody({ text }: { text: string }) {
  return (
    <div className="prose text-sm leading-[1.65]">
      {text.split("\n").map((line, index) =>
        line.trim() === "" ? (
          <div key={index} aria-hidden className="h-2.5" />
        ) : (
          <p key={index} className="break-words">
            {renderEmphasis(line)}
          </p>
        ),
      )}
    </div>
  );
}

/**
 * `*bold*` → semibold. Splits on paired asterisks; an unpaired one is left as
 * a literal character, which is what a parent would expect to see.
 */
function renderEmphasis(line: string) {
  return line
    .split(/(\*[^*]+\*)/g)
    .map((part, index) =>
      part.length > 2 && part.startsWith("*") && part.endsWith("*") ? (
        <strong key={index} className="font-semibold">
          {part.slice(1, -1)}
        </strong>
      ) : (
        <Fragment key={index}>{part}</Fragment>
      ),
    );
}
