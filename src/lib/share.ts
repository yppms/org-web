/**
 * Sharing a photo or clip from the portal to wherever the phone can send it
 * — WhatsApp status or chat, Instagram stories or feed, the gallery — via
 * the system share sheet (the Web Share API with files). The media lives on
 * the school's blob store behind short-lived signed URLs, so it is fetched
 * into a `File` first; the store allows cross-origin reads.
 *
 * Where the share sheet cannot take files (desktop browsers, older Android
 * WebViews) the same `File` is saved instead, so the parent can post it by
 * hand.
 */

/** A photo or clip fetched into memory, ready to share or save. */
export interface ShareableFile {
  file: File;
}

const extensionOf = (path: string) => path.split(".").pop()?.toLowerCase() ?? "";

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  mp4: "video/mp4",
  m4v: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
};

/**
 * The name the shared file carries, from the blob path: "reports/x7Qz.jpg"
 * becomes "miftahussalam-x7Qz.jpg". Apps show it, so it should say where
 * the photo is from rather than read as a random id.
 */
export const shareFileName = (path: string) =>
  `miftahussalam-${path.split("/").pop() ?? "media"}`;

/** Fetch `url` and wrap it as a `File` named after `path`. */
export const fetchAsFile = async (
  url: string,
  path: string,
): Promise<File> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
  const blob = await response.blob();
  const type = blob.type || MIME_BY_EXT[extensionOf(path)] || "";
  return new File([blob], shareFileName(path), { type });
};

/** True when this browser can hand a file to the system share sheet. */
export const canShareFile = (file: File): boolean =>
  typeof navigator !== "undefined" &&
  typeof navigator.share === "function" &&
  typeof navigator.canShare === "function" &&
  navigator.canShare({ files: [file] });

/**
 * Open the share sheet with the file. Resolves `"shared"` when the sheet
 * closed normally (the browser does not say whether the parent actually
 * sent it), `"cancelled"` when they dismissed it, and falls back to saving
 * the file when the sheet cannot take files.
 */
export const shareOrSave = async (
  file: File,
  title: string,
): Promise<"shared" | "cancelled" | "saved"> => {
  if (canShareFile(file)) {
    try {
      await navigator.share({ files: [file], title });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled";
      }
      throw error;
    }
  }
  saveFile(file);
  return "saved";
};

/** Save the file through a temporary object URL (the `download` attribute is ignored cross-origin). */
export const saveFile = (file: File) => {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoke after the click has been handled.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
