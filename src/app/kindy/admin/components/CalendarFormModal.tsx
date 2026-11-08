"use client";

import { useEffect, useState } from "react";
import type {
  CalendarCategory,
  CalendarEvent,
  CalendarEventInput,
} from "@/lib/types";
import {
  CATEGORIES,
  CATEGORY_META,
  MAX_TITLE_WORDS,
  MAX_TITLE_WORD_LENGTH,
  titleProblem,
} from "@/lib/calendar";
import { todayYmd } from "@/lib/harian";
import { cn } from "@/lib/utils";
import {
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@/components/ui";

interface CalendarFormModalProps {
  mode: "add" | "edit" | null;
  event: CalendarEvent | null;
  onClose: () => void;
  onSubmit: (data: CalendarEventInput) => void;
}

interface FormState {
  title: string;
  description: string;
  category: CalendarCategory;
  startDate: string;
  endDate: string;
}

const blank = (): FormState => ({
  title: "",
  description: "",
  category: "ACADEMIC",
  startDate: todayYmd(),
  endDate: todayYmd(),
});

/**
 * Add or edit one calendar event. The end date follows the start date until
 * the admin moves it, so a single-day event needs one date typed, not two.
 */
export default function CalendarFormModal({
  mode,
  event,
  onClose,
  onSubmit,
}: CalendarFormModalProps) {
  const [form, setForm] = useState<FormState>(blank);
  const [touchedEnd, setTouchedEnd] = useState(false);

  useEffect(() => {
    if (mode === "add") {
      setForm(blank());
      setTouchedEnd(false);
    } else if (mode === "edit" && event) {
      setForm({
        title: event.title,
        description: event.description ?? "",
        category: event.category,
        startDate: event.startDate,
        endDate: event.endDate,
      });
      setTouchedEnd(event.startDate !== event.endDate);
    }
  }, [mode, event]);

  if (!mode) return null;

  // The title is drawn inside a date cell on the parent's phone, so it must
  // stay short; the long version belongs in the description.
  const titleError = titleProblem(form.title);
  const invalid =
    !form.title.trim() ||
    !!titleError ||
    !form.startDate ||
    !form.endDate ||
    form.endDate < form.startDate;

  const submit = () => {
    if (invalid) return;
    onSubmit({
      title: form.title.trim(),
      description: form.description.trim() || null,
      category: form.category,
      startDate: form.startDate,
      endDate: form.endDate,
    });
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Tambah Agenda" : "Ubah Agenda"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit" && event?.official
              ? "Agenda ini berasal dari kalender dinas; perubahan tetap bisa disimpan."
              : "Agenda tampil di kalender portal orang tua."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Nama agenda</Label>
            <Input
              type="text"
              value={form.title}
              maxLength={40}
              placeholder="mis. Outing Kelas"
              aria-invalid={!!titleError || undefined}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <p
              className={cn(
                "text-xs",
                titleError ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {titleError ??
                `Maksimal ${MAX_TITLE_WORDS} kata, tiap kata maksimal ${MAX_TITLE_WORD_LENGTH} huruf — tampil di kotak tanggal kalender. Cerita lengkapnya di Keterangan.`}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Jenis</Label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((category) => (
                <Chip
                  key={category}
                  active={form.category === category}
                  onClick={() => setForm({ ...form, category })}
                  className="inline-flex items-center gap-1.5"
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      CATEGORY_META[category].dot,
                    )}
                  />
                  {CATEGORY_META[category].label}
                </Chip>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Libur = tidak ada sekolah (tanggal diblok merah). Akademik =
              kegiatan sekolah lainnya: hari pertama, penerimaan rapor, outing,
              pentas.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Mulai</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => {
                  const startDate = e.target.value;
                  setForm({
                    ...form,
                    startDate,
                    endDate:
                      !touchedEnd || form.endDate < startDate
                        ? startDate
                        : form.endDate,
                  });
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Selesai</Label>
              <Input
                type="date"
                value={form.endDate}
                min={form.startDate || undefined}
                onChange={(e) => {
                  setTouchedEnd(true);
                  setForm({ ...form, endDate: e.target.value });
                }}
              />
            </div>
          </div>
          {form.endDate && form.startDate && form.endDate < form.startDate && (
            <p className="text-xs text-destructive">
              Tanggal selesai mendahului tanggal mulai.
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Keterangan (opsional)</Label>
            <textarea
              value={form.description}
              maxLength={1000}
              rows={3}
              placeholder="mis. Outing ke Taman Pintar. Berangkat 07.30 dari sekolah, bawa bekal."
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="flex w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={submit} disabled={invalid}>
            {mode === "add" ? "Tambah" : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
