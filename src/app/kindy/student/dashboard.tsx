"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import kindyStudentApi, { ApiError, orgApi } from "@/lib/api";
import {
  KindyStudent,
  StudentStats,
  OrgFinancialInfo,
  Saving,
  Infaq,
} from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Spinner,
  ErrorAlert,
  Button,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  Tabs,
  TabsList,
  TabsTrigger,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui";
import Navigation, { type StudentSection } from "./components/Navigation";
import ProfileSection from "./components/ProfileSection";
import InvoicesSection from "./components/InvoicesSection";
import PaymentSection from "./components/PaymentSection";
import SavingsSection from "./components/SavingsSection";
import InfaqSection from "./components/InfaqSection";
import BankRequiredModal from "./components/modals/BankRequiredModal";
import PaymentConfirmModal from "./components/modals/PaymentConfirmModal";
import WithdrawModal from "./components/modals/WithdrawModal";
import GlobalErrorModal from "./components/modals/GlobalErrorModal";

type GraphTone = "primary" | "info";
type ModalKind = null | "pay" | "withdraw" | "bank_required";

const RAMP: Record<GraphTone, string[]> = {
  primary: ["bg-primary/25", "bg-primary/45", "bg-primary/70", "bg-primary"],
  info: ["bg-info/25", "bg-info/45", "bg-info/70", "bg-info"],
};

const cellColor = (amount: number, max: number, tone: GraphTone): string => {
  const ramp = RAMP[tone];
  if (max <= 0) return ramp[3];
  const ratio = amount / max;
  if (ratio > 0.75) return ramp[3];
  if (ratio > 0.5) return ramp[2];
  if (ratio > 0.25) return ramp[1];
  return ramp[0];
};

export default function Dashboard() {
  const [profile, setProfile] = useState<KindyStudent | null>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [orgFinInfo, setOrgFinInfo] = useState<OrgFinancialInfo | null>(null);
  const [activeSection, setActiveSection] =
    useState<StudentSection>("dashboard");
  const [currentTab, setCurrentTab] = useState<
    "invoices" | "payment" | "saving" | "infaq"
  >("invoices");

  const [savingData, setSavingData] = useState<Saving[]>([]);
  const [infaqData, setInfaqData] = useState<Infaq[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const [modal, setModal] = useState<ModalKind>(null);
  const [bankSignal, setBankSignal] = useState(0);

  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentFinEnt, setPaymentFinEnt] = useState("");
  const [paymentFinNumName, setPaymentFinNumName] = useState("");
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [paymentFilePreview, setPaymentFilePreview] = useState<string | null>(
    null,
  );
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [paymentChoice, setPaymentChoice] = useState<
    "receipt" | "no_receipt" | ""
  >("");
  const [isCopied, setIsCopied] = useState(false);

  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);

  const [bankInfoIntent, setBankInfoIntent] = useState<
    "withdraw" | "standalone"
  >("standalone");
  const [globalError, setGlobalError] = useState<string | null>(null);

  const showGlobalError = (err: unknown) => {
    let errorMessage = "Terjadi kesalahan. Mohon ulangi berkala.";
    if (err instanceof ApiError) errorMessage = err.message;
    else if (typeof err === "string") errorMessage = err;
    setGlobalError(errorMessage);
  };

  const handleWithdrawClick = () => {
    const hasBankInfo = profile?.finEnt && profile?.finNum && profile?.finName;
    if (!hasBankInfo) {
      setModal("bank_required");
      return;
    }
    setWithdrawAmount("");
    setWithdrawSuccess(null);
    setModal("withdraw");
  };

  const handleAddBankInfo = () => {
    setBankInfoIntent("withdraw");
    setModal(null);
    setActiveSection("profile");
    setBankSignal((n) => n + 1);
  };

  const handleBankInfoAdded = () => {
    if (bankInfoIntent === "withdraw") {
      setActiveSection("dashboard");
      setCurrentTab("saving");
      setWithdrawAmount("");
      setWithdrawSuccess(null);
      setModal("withdraw");
    }
    setBankInfoIntent("standalone");
  };

  const openPaymentConfirmModal = () => {
    setPaymentDate("");
    setPaymentAmount("");
    setPaymentFinEnt("");
    setPaymentFinNumName("");
    setPaymentFile(null);
    setPaymentFilePreview(null);
    setPaymentChoice("");
    setError(null);
    setPaymentSuccess(null);
    setModal("pay");
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentAmount(e.target.value.replace(/[Rp.]/g, ""));
  };

  const handleWithdrawAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setWithdrawAmount(e.target.value.replace(/[Rp.]/g, ""));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setPaymentFile(null);
      setPaymentFilePreview(null);
      return;
    }
    const maxSizeInBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      showGlobalError("Ukuran file terlalu besar. Maksimal 5MB.");
      e.target.value = "";
      return;
    }
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      showGlobalError(
        "Format file tidak didukung. Gunakan JPG, PNG, atau PDF.",
      );
      e.target.value = "";
      return;
    }
    setPaymentFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setPaymentFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPaymentFilePreview(null);
    }
  };

  const refreshStats = async () => {
    try {
      const statsResponse = await kindyStudentApi.getStats();
      if (statsResponse?.data) setStats(statsResponse.data);
    } catch (refreshErr) {
      console.warn(
        "Failed to refresh data after payment confirmation:",
        refreshErr,
      );
    }
  };

  const handlePaymentWithFile = async () => {
    if (!paymentFile) {
      showGlobalError("Mohon pilih file untuk diunggah");
      return;
    }
    setIsConfirmingPayment(true);
    setPaymentSuccess(null);
    try {
      const formData = new FormData();
      formData.append("file", paymentFile);
      const response = await kindyStudentApi.confirmPayment(formData);
      if (!response || response.status !== "success")
        throw new Error("Respon server tidak valid");
      setPaymentSuccess(
        "Verifikasi membutuhkan waktu hingga 1×24 jam. Jika berhasil, pembayaran diperbarui otomatis.",
      );
      await refreshStats();
    } catch (err) {
      showGlobalError(err);
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  const handlePaymentWithForm = async () => {
    if (
      !paymentDate ||
      !paymentAmount.trim() ||
      !paymentFinEnt.trim() ||
      !paymentFinNumName.trim()
    ) {
      showGlobalError("Semua field wajib diisi");
      return;
    }
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      showGlobalError("Mohon masukkan jumlah yang benar");
      return;
    }
    setIsConfirmingPayment(true);
    setPaymentSuccess(null);
    try {
      const formData = new FormData();
      const message = {
        date: paymentDate,
        amount,
        fin_ent: paymentFinEnt.trim(),
        fin_num_name: paymentFinNumName.trim(),
      };
      formData.append("message", JSON.stringify(message));
      const response = await kindyStudentApi.confirmPayment(formData);
      if (!response || response.status !== "success")
        throw new Error("Respon server tidak valid");
      setPaymentSuccess(
        "Verifikasi membutuhkan waktu hingga 1×24 jam. Jika berhasil, pembayaran diperbarui otomatis.",
      );
      await refreshStats();
    } catch (err) {
      showGlobalError(err);
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  const copyBankNumber = async () => {
    if (!orgFinInfo?.num) return;
    const cleanNumber = orgFinInfo.num.replace(/-/g, "");
    try {
      await navigator.clipboard.writeText(cleanNumber);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = cleanNumber;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error("Gagal menyalin tulisan: ", err);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      showGlobalError("Mohon mengisi dengan angka yang benar");
      return;
    }
    if (stats && amount > stats.saving) {
      showGlobalError("Saldo tidak mencukupi");
      return;
    }
    setIsWithdrawing(true);
    setWithdrawSuccess(null);
    try {
      await kindyStudentApi.withdrawSaving(amount);
      const statsResponse = await kindyStudentApi.getStats();
      setStats(statsResponse.data);
      setWithdrawSuccess(
        `Penarikan ${formatCurrency(
          amount,
        )} akan dikirim ke rekening penerimaan setelah pengecekan berhasil.`,
      );
      setWithdrawAmount("");
    } catch (err) {
      showGlobalError(err);
    } finally {
      setIsWithdrawing(false);
    }
  };

  useEffect(() => {
    setIsClient(true);
    const fetchData = async () => {
      try {
        const [
          profileResponse,
          statsResponse,
          orgFinResponse,
          savingsResponse,
          infaqResponse,
        ] = await Promise.all([
          kindyStudentApi.getProfile(),
          kindyStudentApi.getStats(),
          orgApi.getFinancialInfo(),
          kindyStudentApi.getSavings(),
          kindyStudentApi.getInfaq(),
        ]);
        setProfile(profileResponse.data);
        setStats(statsResponse.data);
        setOrgFinInfo(orgFinResponse.data);
        const saveTransactions = (savingsResponse.data || []).filter(
          (s: Saving) => s.type === "SAVE" && s.status === "SUCCESS",
        );
        setSavingData(saveTransactions);
        setInfaqData(infaqResponse.data || []);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Gagal memuat data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (!isClient || isLoading) {
    return <Spinner variant="page" label="Memuat..." />;
  }

  if (error || !profile || !stats || !orgFinInfo) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center p-4">
        <ErrorAlert message={error || "Terjadi kesalahan"} />
      </div>
    );
  }

  const admission = stats.admission;
  const groupName = profile.KindyEnrollment[0]?.KindyGroup.name;
  const subtitle = groupName ? `TK IT Miftahussalam` : "TK IT Miftahussalam";

  const outstandingRows = stats.outstandingInvoice ?? [];
  const isLunas = stats.outstanding <= 0;
  const savingPct = Math.round((savingData.length / 40) * 100);
  const infaqPct = Math.round((infaqData.length / 40) * 100);

  const renderDashboard = () => (
    <div className="flex flex-col gap-4">
      {/* Hero card */}
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Tagihan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-3">
          <div className="flex flex-wrap items-baseline gap-2.5">
            <span
              className="font-mono text-3xl font-bold tracking-[-0.02em]"
              suppressHydrationWarning
            >
              {formatCurrency(Math.max(0, stats.outstanding))}
            </span>
            {isLunas ? (
              <Badge variant="default">Lunas — terima kasih</Badge>
            ) : (
              <Badge variant="destructive">
                {outstandingRows.length || stats.countInvoice} tagihan
              </Badge>
            )}
          </div>

          {/* {admission && (
            <div className="rounded-lg border border-border p-3 text-[13px] leading-relaxed text-muted-foreground">
              Tagihan biaya masuk{" "}
              <strong className="text-foreground">
                {formatCurrency(admission.outstanding)}
              </strong>{" "}
              — bayar hanya{" "}
              <strong className="text-foreground">
                {formatCurrency(admission.discount)}
              </strong>{" "}
              jika lunas sebelum{" "}
              <strong className="text-foreground">13 Juli</strong>. Pembayaran{" "}
              <strong className="text-foreground">
                {formatCurrency(admission.minimum)}
              </strong>{" "}
              lagi untuk mencapai{" "}
              <strong className="text-foreground">50%</strong>.
            </div>
          )} */}

          {outstandingRows.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow className="border-t-0">
                  <TableHead>Tagihan</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="text-right">Terakhir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outstandingRows.map((inv, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{inv.name}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(inv.outstanding)}
                    </TableCell>
                    {inv.daysLate > 0 ? (
                      <TableCell className="text-right font-semibold text-destructive">
                        Terlambat {inv.daysLate} hari
                      </TableCell>
                    ) : (
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {formatDate(inv.dueDate)}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="flex flex-col gap-1.5 text-[13px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Semua tagihan ({stats.countInvoice ?? 0})
              </span>
              <span className="font-mono">
                {formatCurrency(stats.totalInvoice)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Semua pembayaran ({stats.countPayment ?? 0})
              </span>
              <span className="font-mono">
                {formatCurrency(stats.totalPayment)}
              </span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between">
              <span className="font-semibold">Selisih</span>
              <span
                className={`font-mono font-semibold ${
                  stats.outstanding > 0 ? "text-destructive" : "text-primary"
                }`}
              >
                {stats.outstanding > 0 ? "−" : stats.outstanding < 0 ? "+" : ""}
                {formatCurrency(Math.abs(stats.outstanding))}
              </span>
            </div>
          </div>

          {/* Bank panel */}
          <div className="flex flex-col gap-2.5 rounded-lg bg-muted p-3.5">
            <p className="text-xs text-muted-foreground">
              Pembayaran melalui transfer
            </p>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                {orgFinInfo.img && (
                  <Image
                    src={orgFinInfo.img}
                    alt={orgFinInfo.ent.replace(/-/g, " ")}
                    width={100}
                    height={40}
                    className="mb-1 h-6 w-auto object-contain"
                  />
                )}
                <p className="text-sm font-semibold">
                  {orgFinInfo.ent.replace(/-/g, " ")}
                </p>
                <p className="mt-0.5 font-mono text-[13px] text-muted-foreground">
                  {orgFinInfo.num}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  a.n.{" "}
                  {orgFinInfo.name
                    .replace(/-/g, " ")
                    .toLowerCase()
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </p>
              </div>
              <Button
                variant={isCopied ? "default" : "outline"}
                size="sm"
                onClick={copyBankNumber}
                className="shrink-0"
              >
                {isCopied ? "Tersalin" : "Salin"}
              </Button>
            </div>
          </div>

          <Button className="w-full" onClick={openPaymentConfirmModal}>
            Konfirmasi Pembayaran
          </Button>
          <p className="-mt-1.5 text-center text-xs text-muted-foreground">
            Verifikasi hingga 1×24 jam — data diperbarui otomatis.
          </p>
        </CardContent>
      </Card>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="border-b border-border p-4">
            <CardTitle>Tabungan</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5 p-4">
            <p
              className="font-mono text-lg font-bold tracking-[-0.02em]"
              suppressHydrationWarning
            >
              {formatCurrency(stats.saving)}
            </p>
            <ContributionGraph
              tone="primary"
              items={savingData.map((s) => ({
                amount: s.amount,
                date: s.date,
              }))}
            />
            <p className="text-[11px] text-muted-foreground">
              {savingData.length} dari 40 · {savingPct}%
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleWithdrawClick}
              disabled={stats.saving <= 0}
            >
              Tarik
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border p-4">
            <CardTitle>Infaq</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5 p-4">
            <p
              className="font-mono text-lg font-bold tracking-[-0.02em]"
              suppressHydrationWarning
            >
              {formatCurrency(stats.infaq)}
            </p>
            <ContributionGraph
              tone="info"
              items={infaqData.map((i) => ({ amount: i.amount, date: i.date }))}
            />
            <p className="text-[11px] text-muted-foreground">
              {infaqData.length} dari 40 · {infaqPct}%
            </p>
            <div className="h-8" />
          </CardContent>
        </Card>
      </div>

      {/* Activity card */}
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Aktivitas</CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <Tabs
            value={currentTab}
            onValueChange={(v) => setCurrentTab(v as typeof currentTab)}
          >
            <TabsList>
              <TabsTrigger value="invoices">Tagihan</TabsTrigger>
              <TabsTrigger value="payment">Bayar</TabsTrigger>
              <TabsTrigger value="saving">Tabungan</TabsTrigger>
              <TabsTrigger value="infaq">Infaq</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="mt-1 min-h-[200px]">
            {currentTab === "invoices" && <InvoicesSection />}
            {currentTab === "payment" && <PaymentSection />}
            {currentTab === "saving" && (
              <SavingsSection stats={stats} onStatsUpdate={setStats} />
            )}
            {currentTab === "infaq" && <InfaqSection />}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-[100dvh]">
      <Navigation
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        studentName={profile.name}
        subtitle={subtitle}
      />
      <main className="px-5 pb-24 pt-5">
        {activeSection === "profile" ? (
          <ProfileSection
            profile={profile}
            onUpdate={setProfile}
            onBankInfoAdded={handleBankInfoAdded}
            onError={showGlobalError}
            openBankSignal={bankSignal}
          />
        ) : (
          renderDashboard()
        )}
      </main>

      <BankRequiredModal
        open={modal === "bank_required"}
        onClose={() => setModal(null)}
        onAddBankInfo={handleAddBankInfo}
      />

      <PaymentConfirmModal
        open={modal === "pay"}
        choice={paymentChoice}
        onChoiceChange={setPaymentChoice}
        file={paymentFile}
        filePreview={paymentFilePreview}
        onFileSelect={handleFileSelect}
        date={paymentDate}
        onDateChange={setPaymentDate}
        amount={paymentAmount}
        onAmountChange={handleAmountChange}
        finEnt={paymentFinEnt}
        onFinEntChange={setPaymentFinEnt}
        finNumName={paymentFinNumName}
        onFinNumNameChange={setPaymentFinNumName}
        error={error}
        success={paymentSuccess}
        isSubmitting={isConfirmingPayment}
        onSubmitFile={handlePaymentWithFile}
        onSubmitForm={handlePaymentWithForm}
        onClose={() => {
          setModal(null);
          setError(null);
          setPaymentSuccess(null);
          setPaymentFile(null);
          setPaymentFilePreview(null);
          setPaymentChoice("");
        }}
      />

      <WithdrawModal
        open={modal === "withdraw"}
        balance={stats.saving}
        amount={withdrawAmount}
        onAmountChange={handleWithdrawAmountChange}
        onSetAmount={setWithdrawAmount}
        isSubmitting={isWithdrawing}
        success={withdrawSuccess}
        onWithdraw={handleWithdraw}
        onClose={() => {
          setModal(null);
          setWithdrawAmount("");
          setWithdrawSuccess(null);
        }}
      />

      <GlobalErrorModal
        message={globalError}
        onClose={() => setGlobalError(null)}
      />
    </div>
  );
}

/** 40-cell contribution graph shared by the savings and infaq stat cards. */
function ContributionGraph({
  items,
  tone,
}: {
  items: { amount: number; date: string }[];
  tone: GraphTone;
}) {
  const max = items.length ? Math.max(...items.map((i) => i.amount)) : 0;
  return (
    <div className="grid grid-cols-10 gap-[3px]">
      {Array.from({ length: 40 }).map((_, index) => {
        const item = items[index];
        const colorClass = item
          ? cellColor(item.amount, max, tone)
          : "bg-border/60";
        return (
          <div
            key={index}
            className={`aspect-square rounded-sm ${colorClass}`}
            title={
              item
                ? `${formatDate(item.date)}: ${formatCurrency(item.amount)}`
                : `${index + 1}/40`
            }
          />
        );
      })}
    </div>
  );
}
