"use client";

import { useState, useMemo, useEffect } from "react";
import { kindyAdminApi } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { Spinner, ErrorAlert, EmptyState, Input, Chip, Badge, Button } from "@/components/ui";

interface WhatsAppTask {
  id: string;
  name: string;
  phone: string;
  key: string;
  waLink: string;
  no: number;
}

export default function StampSection() {
  const { data, isLoading, error } = useApi<WhatsAppTask[]>(
    () => kindyAdminApi.getWhatsAppTasks(),
    { fallbackMessage: "Gagal memuat tugas WhatsApp" }
  );
  const tasks = useMemo(() => data ?? [], [data]);

  const [searchTerm, setSearchTerm] = useState("");
  const [sentMessages, setSentMessages] = useState<Set<string>>(new Set());
  const [showSent, setShowSent] = useState(false);

  // Load sent messages from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("kindy-admin-sent-whatsapp");
    if (stored) {
      try {
        setSentMessages(new Set(JSON.parse(stored)));
      } catch (err) {
        console.error("Error parsing sent messages from localStorage:", err);
      }
    }
  }, []);

  const saveSentMessages = (next: Set<string>) => {
    localStorage.setItem("kindy-admin-sent-whatsapp", JSON.stringify(Array.from(next)));
    setSentMessages(next);
  };

  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.name.toLowerCase().includes(term) ||
          task.phone.includes(term) ||
          task.id.toLowerCase().includes(term)
      );
    }
    if (!showSent) {
      filtered = filtered.filter((task) => !sentMessages.has(task.id));
    }
    return filtered;
  }, [tasks, searchTerm, sentMessages, showSent]);

  const handleOpenWhatsApp = (waLink: string, taskId: string) => {
    const next = new Set(sentMessages);
    next.add(taskId);
    saveSentMessages(next);
    window.open(waLink, "_blank");
  };

  const isSent = (taskId: string) => sentMessages.has(taskId);

  if (isLoading) return <Spinner label="Memuat..." />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Tugas Pesan WhatsApp</h2>
        <p className="text-[13px] text-muted-foreground">
          Kirim tautan akses ke orang tua siswa
        </p>
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 items-center">
        <Input
          className="flex-1"
          placeholder="Cari nama, telepon, atau ID…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Chip active={showSent} onClick={() => setShowSent((prev) => !prev)}>
          Terkirim
        </Chip>
      </div>

      {/* Rows */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          message={
            searchTerm
              ? "Tidak ada siswa yang cocok."
              : !showSent
              ? 'Semua pesan sudah terkirim! Aktifkan "Terkirim" untuk melihatnya.'
              : "Tidak ada tugas WhatsApp."
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="bg-card border border-border rounded-xl shadow-card px-4 py-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{task.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                    {task.phone}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {isSent(task.id) && <Badge variant="default">Terkirim</Badge>}
                  <Button
                    size="sm"
                    onClick={() => handleOpenWhatsApp(task.waLink, task.id)}
                  >
                    <svg
                      style={{ width: 13, height: 13 }}
                      className="shrink-0"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                    </svg>
                    Kirim
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
