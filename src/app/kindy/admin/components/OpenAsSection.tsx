"use client";

import { useState } from "react";
import { kindyAdminApi } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import {
  Spinner,
  ErrorAlert,
  EmptyState,
  Input,
  Button,
  SectionHeader,
  Card,
} from "@/components/ui";
import { cn } from "@/lib/utils";

interface OpenAsStudent {
  id: string;
  name: string;
  phone: string | null;
  openas: string;
}

export default function OpenAsSection() {
  const { data, isLoading, error } = useApi<OpenAsStudent[]>(
    () => kindyAdminApi.getAllStudents(),
    { fallbackMessage: "Gagal memuat data siswa" },
  );
  const students = data ?? [];

  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.phone && student.phone.includes(searchQuery)),
  );

  const handleCopyForIncognito = (openas: string, studentId: string) => {
    navigator.clipboard
      .writeText(openas)
      .then(() => {
        setCopiedId(studentId);
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch(() => {
        console.error("Failed to copy to clipboard");
      });
  };

  if (isLoading) return <Spinner label="Memuat..." />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Buka Sebagai Siswa"
        subtitle="Buka dashboard siswa untuk melihat portal mereka"
      />

      <Input
        placeholder="Cari nama atau telepon…"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {filteredStudents.length === 0 ? (
        <EmptyState
          message={
            searchQuery ? "Tidak ada siswa ditemukan" : "Tidak ada siswa"
          }
        />
      ) : (
        <Card className="px-4">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="flex justify-between items-start gap-3 py-3 border-b border-border last:border-b-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{student.name}</p>
                {student.phone && (
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                    {student.phone}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleCopyForIncognito(student.openas, student.id)
                }
                className={cn(
                  copiedId === student.id &&
                    "bg-primary-soft text-primary border-transparent",
                )}
              >
                {copiedId === student.id ? "Tersalin" : "Salin tautan"}
              </Button>
            </div>
          ))}
        </Card>
      )}

      {filteredStudents.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Menampilkan {filteredStudents.length} dari {students.length} siswa
        </p>
      )}
    </div>
  );
}
