"use client";

import { useMemo, useState } from "react";
import { kindyAdminApi } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import {
  Spinner,
  ErrorAlert,
  EmptyState,
  Button,
  SectionHeader,
  Card,
} from "@/components/ui";
import { ExternalLink } from "lucide-react";
import ListControls, { useSort } from "@/components/ListControls";

type MealFilter = "all" | "meal" | "noMeal";

interface OpenAsStudent {
  id: string;
  name: string;
  phone: string | null;
  isMeal: boolean;
  openas: string;
}

export default function OpenAsSection() {
  const { data, isLoading, error } = useApi<OpenAsStudent[]>(
    () => kindyAdminApi.getAllStudents(),
    { fallbackMessage: "Gagal memuat data siswa" },
  );
  const students = useMemo(() => data ?? [], [data]);

  const [searchQuery, setSearchQuery] = useState("");
  const [mealFilter, setMealFilter] = useState<MealFilter>("all");
  const { sortBy, order, toggle, signed } = useSort<"name">("name", "asc");

  const filteredStudents = useMemo(() => {
    let list = students;
    if (mealFilter === "meal") list = list.filter((s) => s.isMeal);
    else if (mealFilter === "noMeal") list = list.filter((s) => !s.isMeal);
    const q = searchQuery.toLowerCase();
    if (q) {
      list = list.filter(
        (student) =>
          student.name.toLowerCase().includes(q) ||
          (student.phone && student.phone.includes(q)),
      );
    }
    return [...list].sort((a, b) => signed(a.name.localeCompare(b.name)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, mealFilter, searchQuery, sortBy, order]);

  // The student portal keeps its own cookie (kindy_token), apart from the
  // admin's, so it can open in a plain new tab without ending this session.
  const handleOpen = (openas: string) => {
    window.open(openas, "_blank", "noopener");
  };

  if (isLoading) return <Spinner label="Memuat..." />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Buka Sebagai Siswa"
        subtitle="Buka portal siswa di tab baru tanpa keluar dari sesi admin"
      />

      <ListControls
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: "Cari nama siswa…",
        }}
        filter={{
          options: [
            { key: "all", label: "Semua" },
            { key: "meal", label: "Ikut katering" },
            { key: "noMeal", label: "Tanpa katering" },
          ],
          value: mealFilter,
          onChange: setMealFilter,
        }}
        sort={{
          options: [{ key: "name", label: "Nama" }],
          value: sortBy,
          order,
          onChange: toggle,
        }}
      />

      {filteredStudents.length === 0 ? (
        <EmptyState
          message={
            searchQuery || mealFilter !== "all"
              ? "Tidak ada siswa ditemukan"
              : "Tidak ada siswa"
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
                onClick={() => handleOpen(student.openas)}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Buka
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
