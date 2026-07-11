"use client";

import { useState } from "react";
import { kindyAdminApi, ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import {
  Spinner,
  ErrorAlert,
  StatCard,
  EmptyState,
  Badge,
  Button,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface Setor {
  id: string;
  amount: number;
  type: "bank" | "amil";
  no: number;
  createdAt: string;
  updatedAt: string;
}

interface DeltaSetor {
  totalCollected: number;
  totalSetor: number;
  delta: number;
}

interface SetorData {
  setor: Setor[];
  delta: DeltaSetor | null;
}

export default function SetorSection() {
  const { data, isLoading, error, refetch } = useApi<SetorData>(
    async () => {
      const [setorRes, deltaRes] = await Promise.all([
        kindyAdminApi.getSetor(),
        kindyAdminApi.getDeltaSetor(),
      ]);
      return {
        status: "success",
        data: {
          setor: (setorRes.data as Setor[]) || [],
          delta: (deltaRes.data as DeltaSetor) || null,
        },
      };
    },
    { fallbackMessage: "Gagal memuat data setoran" }
  );

  const setorData = data?.setor ?? [];
  const deltaData = data?.delta ?? null;

  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    amount: "",
    type: "bank" as "bank" | "amil",
  });

  const closeModal = () => {
    setShowAddModal(false);
    setFormData({ amount: "", type: "bank" });
    setFormError(null);
  };

  const handleSubmit = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setFormError("Masukkan jumlah yang valid");
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    try {
      await kindyAdminApi.addSetor({
        amount: parseFloat(formData.amount),
        type: formData.type,
      });
      await refetch();
      closeModal();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Gagal mencatat setoran. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimestamp = (value: string) =>
    new Date(value).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (isLoading) return <Spinner label="Memuat..." />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Kontrol Setoran</h2>
          <p className="text-[13px] text-muted-foreground">
            Setoran dana terkumpul ke rekening yayasan
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAddModal(true)} className="flex-shrink-0">
          + Catat
        </Button>
      </div>

      {deltaData && (
        <>
          <div className="bg-card border border-border rounded-xl shadow-card px-4 py-3.5">
            <p className="text-xs text-muted-foreground">Sisa untuk disetor</p>
            <p className="text-2xl font-bold font-mono tracking-[-0.02em] text-warning">
              {formatCurrency(deltaData.delta)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard
              tone="neutral"
              label="Total terkumpul"
              value={formatCurrency(deltaData.totalCollected)}
            />
            <StatCard
              tone="primary"
              label="Total disetor"
              value={formatCurrency(deltaData.totalSetor)}
            />
          </div>
        </>
      )}

      {setorData.length === 0 ? (
        <EmptyState message="Belum ada catatan setoran" />
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-card px-4">
          {setorData.map((setor) => (
            <div
              key={setor.id}
              className="flex justify-between items-center gap-3 py-3 border-b border-border last:border-b-0"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={setor.type === "bank" ? "default" : "secondary"}>
                    {setor.type === "bank" ? "Bank" : "Amil"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">#{setor.no}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatTimestamp(setor.createdAt)}
                  {setor.createdAt !== setor.updatedAt && (
                    <> · Diperbarui {formatTimestamp(setor.updatedAt)}</>
                  )}
                </p>
              </div>
              <span className="text-[13px] font-semibold font-mono">
                {formatCurrency(setor.amount)}
              </span>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showAddModal} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat Setoran Baru</DialogTitle>
            <DialogDescription>
              Sisa untuk disetor:{" "}
              <strong className="text-foreground font-mono">
                {formatCurrency(deltaData?.delta ?? 0)}
              </strong>
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            {formError && <ErrorAlert message={formError} />}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="setor-amount">Jumlah (Rp)</Label>
              <Input
                id="setor-amount"
                type="text"
                inputMode="numeric"
                placeholder="100.000"
                className="font-mono"
                value={
                  formData.amount
                    ? formatCurrency(parseFloat(formData.amount)).replace("Rp", "").trim()
                    : ""
                }
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/\D/g, "");
                  setFormData({ ...formData, amount: numericValue });
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Jenis setoran</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: "bank" })}
                  className={cn(
                    "h-9 rounded-lg border text-sm font-medium transition-colors",
                    formData.type === "bank"
                      ? "border-primary bg-primary-soft text-foreground"
                      : "border-border text-muted-foreground"
                  )}
                >
                  Transfer Bank
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: "amil" })}
                  className={cn(
                    "h-9 rounded-lg border text-sm font-medium transition-colors",
                    formData.type === "amil"
                      ? "border-primary bg-primary-soft text-foreground"
                      : "border-border text-muted-foreground"
                  )}
                >
                  Via Amil
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal} disabled={isSubmitting}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Catat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
