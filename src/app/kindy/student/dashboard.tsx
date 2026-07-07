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
import { formatCurrency } from "@/lib/utils";
import { Spinner, ErrorAlert } from "@/components/ui";
import Navigation from "./components/Navigation";
import ProfileSection from "./components/ProfileSection";
import InvoicesSection from "./components/InvoicesSection";
import PaymentSection from "./components/PaymentSection";
import SavingsSection from "./components/SavingsSection";
import InfaqSection from "./components/InfaqSection";
import FullDayModal from "./components/modals/FullDayModal";
import BankRequiredModal from "./components/modals/BankRequiredModal";
import PaymentConfirmModal from "./components/modals/PaymentConfirmModal";
import WithdrawModal from "./components/modals/WithdrawModal";
import GlobalErrorModal from "./components/modals/GlobalErrorModal";

type Section =
  | "dashboard"
  | "profile"
  | "invoices"
  | "savings"
  | "infaq"
  | "fullday"
  | "laporan-harian"
  | "perkembangan-anak";

// GitHub-style contribution intensity: each cell is shaded by its amount
// relative to the largest amount (ratio-to-max), so bigger contributions read
// darker. Uses opacity ramps of a theme token (no raw palette) so it re-themes.
type GraphTone = "primary" | "info";

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

// Tooltip date format (long-ish) — distinct from lib/utils' compact formatDate.
const formatTooltipDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function Dashboard() {
  const [profile, setProfile] = useState<KindyStudent | null>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [orgFinInfo, setOrgFinInfo] = useState<OrgFinancialInfo | null>(null);
  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [currentTab, setCurrentTab] = useState<
    "invoices" | "payment" | "saving" | "infaq"
  >("invoices");

  const [savingData, setSavingData] = useState<Saving[]>([]);
  const [infaqData, setInfaqData] = useState<Infaq[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isChangingFullDay, setIsChangingFullDay] = useState(false);
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
  const [fullDaySuccess, setFullDaySuccess] = useState<string | null>(null);

  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);

  const [bankInfoIntent, setBankInfoIntent] = useState<
    "withdraw" | "standalone"
  >("standalone");
  const [globalError, setGlobalError] = useState<string | null>(null);

  const isFullDayEnrolled =
    profile?.KindyStudentRecurringFee?.some((fee) =>
      fee.KindyRecurringFee.name.toLowerCase().includes("full day"),
    ) || false;

  const showGlobalError = (err: unknown) => {
    let errorMessage = "Terjadi kesalahan. Mohon ulangi berkala.";
    if (err instanceof ApiError) errorMessage = err.message;
    else if (typeof err === "string") errorMessage = err;
    setGlobalError(errorMessage);
    (
      document.getElementById("global_error_modal") as HTMLDialogElement | null
    )?.showModal();
  };

  const handleFullDayToggle = async () => {
    setIsChangingFullDay(true);
    setError(null);
    setFullDaySuccess(null);
    try {
      const wasEnrolled = isFullDayEnrolled;
      await kindyStudentApi.changeFullDay(!isFullDayEnrolled);
      const profileResponse = await kindyStudentApi.getProfile();
      setProfile(profileResponse.data);
      setFullDaySuccess(
        wasEnrolled
          ? "Ananda dapat mendaftar kembali kapan saja di bulan berikutnya."
          : "Pendaftaran berhasil. Ananda dapat mengikuti Full Day mulai bulan depan.",
      );
    } catch (err) {
      showGlobalError(err);
    } finally {
      setIsChangingFullDay(false);
    }
  };

  const handleWithdrawClick = () => {
    const hasBankInfo = profile?.finEnt && profile?.finNum && profile?.finName;
    if (!hasBankInfo) {
      (
        document.getElementById(
          "bank_required_modal",
        ) as HTMLDialogElement | null
      )?.showModal();
      return;
    }
    (
      document.getElementById("withdraw_modal") as HTMLDialogElement | null
    )?.showModal();
  };

  const handleAddBankInfo = () => {
    setBankInfoIntent("withdraw");
    (
      document.getElementById("bank_required_modal") as HTMLDialogElement | null
    )?.close();
    setActiveSection("profile");
    setTimeout(() => {
      (
        document.getElementById("bank_modal") as HTMLDialogElement | null
      )?.showModal();
    }, 200);
  };

  const handleBankInfoAdded = () => {
    if (bankInfoIntent === "withdraw") {
      setActiveSection("dashboard");
      setTimeout(() => {
        setCurrentTab("saving");
        setTimeout(() => {
          (
            document.getElementById(
              "withdraw_modal",
            ) as HTMLDialogElement | null
          )?.showModal();
        }, 200);
      }, 300);
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
    (
      document.getElementById(
        "payment_confirm_modal",
      ) as HTMLDialogElement | null
    )?.showModal();
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
      setError("Ukuran file terlalu besar. Maksimal 5MB.");
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
      setError("Format file tidak didukung. Gunakan JPG, PNG, atau PDF.");
      e.target.value = "";
      return;
    }
    setPaymentFile(file);
    setError(null);
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
        "Verifikasi segera dilakukan. Mungkin membutuhkan waktu hingga 1 x 24 Jam. Jika berhasil, pembayaran diperbarui otomatis. Cek berkala.",
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
        "Verifikasi segera dilakukan. Mungkin membutuhkan waktu hingga 1 x 24 Jam. Jika berhasil, pembayaran diperbarui otomatis. Cek berkala.",
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
        `Berhasil mengirimkan permintaan penarikan dana sebesar ${formatCurrency(
          amount,
        )} dari tabungan. Dana otomatis akan dikirim ke rekening penerimaan apabila pengecekan berhasil.`,
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorAlert message={error || "Terjadi kesalahan"} />
      </div>
    );
  }

  const admission = stats.admission;

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return (
          <ProfileSection
            profile={profile}
            onUpdate={setProfile}
            onBankInfoAdded={handleBankInfoAdded}
            onError={showGlobalError}
          />
        );
      case "laporan-harian":
        return (
          <div className="space-y-4 p-4">
            <h2 className="text-lg font-bold">Laporan Harian</h2>
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body items-center text-center py-12">
                <span className="text-4xl">📋</span>
                <p className="text-base-content/50 mt-3">Belum ada data</p>
              </div>
            </div>
          </div>
        );
      case "perkembangan-anak":
        return (
          <div className="space-y-4 p-4">
            <h2 className="text-lg font-bold">Perkembangan Anak</h2>
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body items-center text-center py-12">
                <span className="text-4xl">🌱</span>
                <p className="text-base-content/50 mt-3">Belum ada data</p>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            {/* Outstanding Payment */}
            <div className="card bg-base-100 shadow-sm border">
              <div className="card-body p-6">
                <div className="text-center space-y-4">
                  <div>
                    <p className="text-md font-medium text-base-content/60 mb-1">
                      Tagihan saat ini
                    </p>
                    <div
                      className="text-2xl font-bold"
                      suppressHydrationWarning
                    >
                      {formatCurrency(Math.max(0, stats.outstanding))}
                    </div>
                    {stats.outstanding > 0 ? (
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <span className="text-sm text-error font-medium">
                          Mohon segera lunasi tagihan
                        </span>
                        <span className="text-lg animate-bounce">🙏</span>
                      </div>
                    ) : (
                      <p className="text-sm text-success font-medium mt-2">
                        <strong>Lunas! Terima Kasih 🤩</strong>
                      </p>
                    )}
                  </div>

                  {admission && (
                    <div className="flex flex-col gap-2">
                      <div className="alert p-2 text-xs text-left">
                        <span>
                          Tagihan biaya masuk{" "}
                          <strong>
                            {formatCurrency(admission.outstanding)}.
                          </strong>
                          <br />
                          Bayar hanya{" "}
                          <strong>
                            {formatCurrency(admission.discount)}
                          </strong>{" "}
                          jika lunas sebelum <strong>13 Juli.</strong>
                        </span>
                      </div>
                      <div className="alert p-2 text-xs text-left">
                        <span>
                          Pembayaran{" "}
                          <strong>{formatCurrency(admission.minimum)}</strong>{" "}
                          lagi untuk <strong>50%</strong>
                        </span>
                      </div>
                    </div>
                  )}

                  {stats.outstandingInvoice &&
                    stats.outstandingInvoice.length > 0 && (
                      <div className="rounded-lg border border-base-300 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="table table-sm">
                            <thead className="bg-base-200">
                              <tr className="border-b border-base-300">
                                <th className="text-xs font-semibold">
                                  Tagihan
                                </th>
                                <th className="text-xs font-semibold text-center">
                                  Jumlah
                                </th>
                                <th className="text-xs font-semibold text-center">
                                  Terlambat
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {stats.outstandingInvoice.map((invoice, idx) => (
                                <tr
                                  key={idx}
                                  className="border-b border-base-300"
                                >
                                  <td className="text-base-content/60 font-medium">
                                    {invoice.name}
                                  </td>
                                  <td className="text-base-content/60 text-right font-medium">
                                    {formatCurrency(invoice.outstanding)}
                                  </td>
                                  <td
                                    className={`text-center font-medium ${
                                      invoice.daysLate > 0
                                        ? "text-error font-extrabold"
                                        : "text-base-content/60"
                                    }`}
                                  >
                                    {invoice.daysLate} hari
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                  <div className="w-full mt-4 text-xs">
                    <div className="flex justify-between">
                      <span className="text-base-content/60 font-medium">
                        Semua Tagihan (
                        <strong>{stats.countInvoice ?? 0}</strong>)
                      </span>
                      <span className="text-base-content/60 font-medium">
                        {formatCurrency(stats.totalInvoice)}
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-base-content/60 font-medium">
                        Semua Pembayaran (
                        <strong>{stats.countPayment ?? 0}</strong>)
                      </span>
                      <span className="text-base-content/60 font-medium">
                        {formatCurrency(stats.totalPayment)}
                      </span>
                    </div>
                    <hr className="my-2 border-t border-base-300" />
                    <div className="flex justify-end">
                      <span className="text-sm font-bold">
                        {stats.outstanding < 0 ? "+" : "-"}
                        {formatCurrency(Math.abs(stats.outstanding))}
                      </span>
                    </div>
                  </div>

                  <div className="card bg-base-100 border-2 py-4 px-1">
                    {orgFinInfo ? (
                      <div className="flex flex-col items-center space-y-2">
                        <div className="text-xs font-medium text-center">
                          Pembayaran dapat dilakukan melalui:
                        </div>
                        <Image
                          src={orgFinInfo.img}
                          alt={orgFinInfo.ent.replace(/-/g, " ")}
                          width={100}
                          height={100}
                          className="h-10 w-auto object-contain"
                        />
                        <p className="text-xs font-medium text-center">
                          {orgFinInfo.ent.replace(/-/g, " ")}
                        </p>
                        <div className="flex items-center justify-center gap-2">
                          <p className="text-xs font-medium text-center">
                            {orgFinInfo.num}
                          </p>
                          <button
                            onClick={copyBankNumber}
                            className={`btn btn-xs ${isCopied ? "btn-success" : "btn-primary"}`}
                            title={
                              isCopied ? "Disalin!" : "Salin nomor rekening"
                            }
                          >
                            {isCopied ? "Disalin!" : "Salin"}
                          </button>
                        </div>
                        <p className="text-xs font-medium text-center">
                          a.n.{" "}
                          {orgFinInfo.name
                            .replace(/-/g, " ")
                            .toLowerCase()
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </p>
                      </div>
                    ) : (
                      <div className="text-xs text-base-content/60 space-y-1">
                        <p className="font-medium">Informasi pembayaran:</p>
                        <p>• Memuat informasi bank...</p>
                      </div>
                    )}
                  </div>

                  <button
                    className="btn btn-success w-full"
                    onClick={openPaymentConfirmModal}
                  >
                    Konfirmasi Pembayaran
                  </button>
                </div>
              </div>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="card bg-gradient-to-br from-success/5 to-success/10 shadow-sm border border-success/20">
                <div className="card-body p-4">
                  <div className="text-center">
                    <p className="text-xs font-medium text-base-content/60 mb-2">
                      Total Tabungan
                    </p>
                    <p
                      className="text-lg font-bold mb-3"
                      suppressHydrationWarning
                    >
                      {formatCurrency(stats.saving)}
                    </p>
                    <button
                      className="btn btn-warning btn-sm w-full mb-3"
                      onClick={handleWithdrawClick}
                      disabled={stats.saving <= 0}
                    >
                      Tarik
                    </button>

                    <ContributionGraph
                      tone="primary"
                      items={savingData.map((s) => ({
                        amount: s.amount,
                        date: s.date,
                      }))}
                    />
                  </div>
                </div>
              </div>

              <div className="card bg-gradient-to-br from-info/5 to-info/10 shadow-sm border border-info/20">
                <div className="card-body p-4">
                  <div className="text-center">
                    <p className="text-xs font-medium text-base-content/60 mb-2">
                      Total Infaq
                    </p>
                    <p
                      className="text-lg font-bold mb-2"
                      suppressHydrationWarning
                    >
                      {formatCurrency(stats.infaq)}
                    </p>
                    <span className="text-2xl mb-3 block">🤲</span>

                    <ContributionGraph
                      tone="info"
                      items={infaqData.map((i) => ({
                        amount: i.amount,
                        date: i.date,
                      }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Tabs */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="border-base-300 px-6 py-4">
                  <h3 className="font-semibold text-base-content">
                    Aktivitas Terbaru
                  </h3>
                  <div className="alert mt-2 border border-base-300 bg-base-200">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      className="stroke-current shrink-0 w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                    <span className="text-xs">
                      Pembaruan data mungkin memerlukan waktu hingga 1 x 24 Jam.
                      Cek berkala.
                    </span>
                  </div>
                </div>

                <div className="tabs tabs-lifted -mb-px justify-evenly">
                  {(
                    [
                      ["invoices", "Tagihan"],
                      ["payment", "Pembayaran"],
                      ["saving", "Tabungan"],
                      ["infaq", "Infaq"],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      className={`tab tab-lifted font-medium text-sm transition-all ${
                        currentTab === key
                          ? "tab-active [--tab-bg:theme(colors.base-100)] text-base-content font-bold decoration-2 underline-offset-8"
                          : "text-base-content/60 hover:text-base-content"
                      }`}
                      onClick={() => setCurrentTab(key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="p-6 min-h-[200px]">
                  {currentTab === "invoices" && <InvoicesSection />}
                  {currentTab === "payment" && <PaymentSection />}
                  {currentTab === "saving" && (
                    <SavingsSection stats={stats} onStatsUpdate={setStats} />
                  )}
                  {currentTab === "infaq" && <InfaqSection />}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-base-200/50">
      <Navigation
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        studentName={profile.name}
      />
      <main className="px-4 py-6 pb-24 w-full">{renderContent()}</main>

      <FullDayModal
        isEnrolled={isFullDayEnrolled}
        isSubmitting={isChangingFullDay}
        success={fullDaySuccess}
        error={error}
        onToggle={handleFullDayToggle}
        onClearError={() => setError(null)}
        onClose={() => {
          setError(null);
          setFullDaySuccess(null);
        }}
      />

      <BankRequiredModal onAddBankInfo={handleAddBankInfo} />

      <PaymentConfirmModal
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
          setError(null);
          setPaymentSuccess(null);
          setPaymentFile(null);
          setPaymentFilePreview(null);
          setPaymentChoice("");
        }}
      />

      <WithdrawModal
        balance={stats.saving}
        amount={withdrawAmount}
        onAmountChange={handleWithdrawAmountChange}
        onSetAmount={setWithdrawAmount}
        isSubmitting={isWithdrawing}
        success={withdrawSuccess}
        onWithdraw={handleWithdraw}
        onClose={() => {
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

/** 40-cell contribution graph shared by the savings and infaq balance cards. */
function ContributionGraph({
  items,
  tone,
}: {
  items: { amount: number; date: string }[];
  tone: GraphTone;
}) {
  const max = items.length ? Math.max(...items.map((i) => i.amount)) : 0;
  return (
    <div className="pt-3">
      <div className="flex flex-col gap-1">
        {Array.from({ length: 4 }).map((_, row) => (
          <div key={row} className="flex gap-1">
            {Array.from({ length: 10 }).map((_, col) => {
              const index = row * 10 + col;
              const item = items[index];
              const colorClass = item
                ? cellColor(item.amount, max, tone)
                : "bg-base-300/60";
              return (
                <div
                  key={col}
                  className={`flex-1 aspect-square rounded-sm transition-all duration-300 ${colorClass} hover:ring-2 hover:ring-base-content/20 cursor-pointer relative group`}
                  title={
                    item
                      ? `${formatTooltipDate(item.date)}: ${formatCurrency(item.amount)}`
                      : `${index + 1}/40`
                  }
                >
                  {item && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-base-content text-base-100 text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {formatTooltipDate(item.date)}
                      <br />
                      {formatCurrency(item.amount)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 mt-2">
        <span className="text-xs font-bold text-base-content">
          {items.length}/40
        </span>
        <span className="text-xs text-base-content/40">•</span>
        <span className="text-xs font-bold text-base-content">
          {Math.round((items.length / 40) * 100)}%
        </span>
      </div>
    </div>
  );
}
