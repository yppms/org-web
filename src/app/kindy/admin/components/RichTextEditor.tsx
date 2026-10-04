"use client";

import { useEffect } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  RICH_TEXT_CLASS,
  isHtml,
  plainTextToHtml,
} from "@/components/RichText";

// The schema must match the allowlist in org-server
// (kindy-admin/services/invoice.service.js, DESCRIPTION_HTML): p, br, strong,
// em, ul, ol, li. StarterKit v3 brings more — headings, quotes, code, rules,
// links — reachable through markdown shortcuts even without a toolbar button,
// and the server would strip them, so they are off.
const extensions = [
  StarterKit.configure({
    heading: false,
    blockquote: false,
    codeBlock: false,
    code: false,
    horizontalRule: false,
    strike: false,
    link: false,
    underline: false,
  }),
];

const toEditorHtml = (value: string) =>
  !value || isHtml(value) ? value : plainTextToHtml(value);

interface RichTextEditorProps {
  value: string;
  /** "" when empty — an empty editor would otherwise report "<p></p>". */
  onChange: (html: string) => void;
}

export default function RichTextEditor({
  value,
  onChange,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions,
    content: toEditorHtml(value),
    // The page is prerendered; rendering here would mismatch on hydration.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          // Same frame as <Input>, same typography as <RichText>.
          "min-h-24 w-full rounded-b-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          RICH_TEXT_CLASS,
        ),
      },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  // The modal fills its form after the dialog mounts, so the first `content`
  // can be stale. Follow `value` without echoing it back through onChange.
  useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? "" : editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(toEditorHtml(value), { emitUpdate: false });
    }
  }, [editor, value]);

  // v3 no longer re-renders on every transaction; subscribe to what the
  // toolbar shows.
  const active = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive("bold") ?? false,
      italic: editor?.isActive("italic") ?? false,
      bulletList: editor?.isActive("bulletList") ?? false,
      orderedList: editor?.isActive("orderedList") ?? false,
    }),
  });

  const tools = [
    {
      key: "bold",
      label: "Tebal",
      icon: Bold,
      run: () => editor?.chain().focus().toggleBold().run(),
    },
    {
      key: "italic",
      label: "Miring",
      icon: Italic,
      run: () => editor?.chain().focus().toggleItalic().run(),
    },
    {
      key: "bulletList",
      label: "Daftar bullet",
      icon: List,
      run: () => editor?.chain().focus().toggleBulletList().run(),
    },
    {
      key: "orderedList",
      label: "Daftar bernomor",
      icon: ListOrdered,
      run: () => editor?.chain().focus().toggleOrderedList().run(),
    },
  ] as const;

  return (
    <div>
      <div className="flex gap-0.5 rounded-t-lg border border-b-0 border-input bg-muted p-1">
        {tools.map(({ key, label, icon: Icon, run }) => (
          <Button
            key={key}
            type="button"
            variant="ghost"
            size="xs"
            aria-label={label}
            aria-pressed={active?.[key] ?? false}
            className={cn(active?.[key] && "bg-card text-primary")}
            onClick={run}
          >
            <Icon className="h-3.5 w-3.5" />
          </Button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
