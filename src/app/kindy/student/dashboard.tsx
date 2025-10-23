"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import kindyStudentApi, { ApiError, orgApi } from "@/lib/api";
import { KindyStudent, StudentStats, OrgFinancialInfo } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import Navigation from "./components/Navigation";
import ProfileSection from "./components/ProfileSection";
import InvoicesSection from "./components/InvoicesSection";
import PaymentSection from "./components/PaymentSection";
import SavingsSection from "./components/SavingsSection";
import InfaqSection from "./components/InfaqSection";

type Section =
  | "dashboard"
  | "profile"
  | "invoices"
  | "savings"
  | "infaq"
  | "fullday";

export default function Dashboard() {
  const [profile, setProfile] = useState<KindyStudent | null>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [orgFinInfo, setOrgFinInfo] = useState<OrgFinancialInfo | null>(null);
  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [currentTab, setCurrentTab] = useState<
    "invoices" | "payment" | "saving" | "infaq"
  >("invoices");

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
    null
  );
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [paymentChoice, setPaymentChoice] = useState<
    "receipt" | "no_receipt" | ""
  >("");
  const [isCopied, setIsCopied] = useState(false);
  const [fullDaySuccess, setFullDaySuccess] = useState<string | null>(null);

  // Withdraw modal state
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);

  // Bank info intent tracking
  const [bankInfoIntent, setBankInfoIntent] = useState<
    "withdraw" | "standalone"
  >("standalone");

  // Unified error modal state
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Check if user is enrolled in full day program
  const isFullDayEnrolled =
    profile?.KindyStudentRecurringFee?.some((fee) =>
      fee.KindyRecurringFee.name.toLowerCase().includes("full day")
    ) || false;

  const showGlobalError = (error: any) => {
    let errorMessage = "Terjadi kesalahan. Mohon ulangi berkala.";
    if (error instanceof ApiError) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    }
    setGlobalError(errorMessage);

    // Show the global error modal
    const modal = document.getElementById(
      "global_error_modal"
    ) as HTMLDialogElement;
    modal?.showModal();
  };

  const handleFullDayToggle = async () => {
    setIsChangingFullDay(true);
    setError(null);
    setFullDaySuccess(null);

    try {
      // Call API to change full day status
      const wasEnrolled = isFullDayEnrolled;
      await kindyStudentApi.changeFullDay(!isFullDayEnrolled);

      // Refresh profile data to get updated status
      const profileResponse = await kindyStudentApi.getProfile();
      setProfile(profileResponse.data);

      // Show success message
      const action = wasEnrolled ? "berhenti" : "mendaftar";
      setFullDaySuccess(
        wasEnrolled
          ? "Ananda dapat mendaftar kembali kapan saja di bulan berikutnya."
          : "Pendaftaran berhasil. Ananda dapat mengikuti Full Day mulai bulan depan."
      );
    } catch (err) {
      showGlobalError(err);
    } finally {
      setIsChangingFullDay(false);
    }
  };

  const openFullDayModal = () => {
    setFullDaySuccess(null);
    const modal = document.getElementById("fullday_modal") as HTMLDialogElement;
    modal?.showModal();
  };

  const handleWithdrawClick = () => {
    // Check if user has bank information
    const hasBankInfo = profile?.finEnt && profile?.finNum && profile?.finName;

    if (!hasBankInfo) {
      // Show bank info required modal first
      const bankRequiredModal = document.getElementById(
        "bank_required_modal"
      ) as HTMLDialogElement;
      bankRequiredModal?.showModal();
      return;
    }

    // Open withdraw modal directly
    const modal = document.getElementById(
      "withdraw_modal"
    ) as HTMLDialogElement;
    modal?.showModal();
  };

  const handleAddBankInfo = () => {
    // Set intent to withdraw since this is triggered from withdraw flow
    setBankInfoIntent("withdraw");

    // Close the bank required modal
    const bankRequiredModal = document.getElementById(
      "bank_required_modal"
    ) as HTMLDialogElement;
    bankRequiredModal?.close();

    // Switch to profile section where the bank modal is available
    setActiveSection("profile");

    // Wait for the profile section to render, then open the bank modal
    setTimeout(() => {
      const bankModal = document.getElementById(
        "bank_modal"
      ) as HTMLDialogElement;
      if (bankModal) {
        bankModal.showModal();
      }
    }, 200);
  };

  const handleBankInfoAdded = () => {
    // Only redirect to withdraw modal if the intent was for withdrawal
    if (bankInfoIntent === "withdraw") {
      // When bank info is successfully added, switch back to dashboard and proceed to withdraw modal
      setActiveSection("dashboard");

      setTimeout(() => {
        // Switch to savings tab
        setCurrentTab("saving");
        // Wait for the component to render, then open the withdraw modal
        setTimeout(() => {
          const modal = document.getElementById(
            "withdraw_modal"
          ) as HTMLDialogElement;
          modal?.showModal();
        }, 200);
      }, 300); // Give time for dashboard to render
    }
    // For standalone bank info operations, don't redirect - just stay in profile with success feedback

    // Reset the intent for next time
    setBankInfoIntent("standalone");
  };

  const openPaymentConfirmModal = () => {
    // Reset form
    setPaymentDate("");
    setPaymentAmount("");
    setPaymentFinEnt("");
    setPaymentFinNumName("");
    setPaymentFile(null);
    setPaymentFilePreview(null);
    setPaymentChoice("");
    setError(null);
    setPaymentSuccess(null);

    const modal = document.getElementById(
      "payment_confirm_modal"
    ) as HTMLDialogElement;
    modal?.showModal();
  };

  // Currency formatting helper
  const formatRupiah = (value: string): string => {
    // Remove all non-digit characters
    const numericValue = value.replace(/\D/g, "");

    if (!numericValue) return "";

    // Add thousands separators
    const formatted = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `Rp${formatted}`;
  };

  // Handle currency input change for payment
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Remove Rp prefix and dots for storage
    const numericValue = inputValue.replace(/[Rp.]/g, "");

    // Store the numeric value
    setPaymentAmount(numericValue);
  };

  // Handle currency input change for withdraw
  const handleWithdrawAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Remove Rp prefix and dots for storage
    const numericValue = inputValue.replace(/[Rp.]/g, "");

    // Store the numeric value
    setWithdrawAmount(numericValue);
  };

  // File validation and preview handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (!file) {
      setPaymentFile(null);
      setPaymentFilePreview(null);
      return;
    }

    // Check file size (5MB = 5 * 1024 * 1024 bytes)
    const maxSizeInBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      setError("Ukuran file terlalu besar. Maksimal 5MB.");
      e.target.value = ""; // Reset the input
      return;
    }

    // Check file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      setError("Format file tidak didukung. Gunakan JPG, PNG, atau PDF.");
      e.target.value = ""; // Reset the input
      return;
    }

    setPaymentFile(file);
    setError(null);

    // Create preview for images only
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setPaymentFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPaymentFilePreview(null);
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

      await kindyStudentApi.confirmPayment(formData);

      setPaymentSuccess(
        "Pengecekan segera dilakukan. Pembayaran terupdate otomatis apabila pengecekan berhasil."
      );
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

      // Create message JSON with required fields
      const message = {
        date: paymentDate,
        amount: amount,
        fin_ent: paymentFinEnt.trim(),
        fin_num_name: paymentFinNumName.trim(),
      };
      formData.append("message", JSON.stringify(message));

      await kindyStudentApi.confirmPayment(formData);

      setPaymentSuccess(
        "Pengecekan segera dilakukan. Pembayaran terupdate otomatis apabila pengecekan berhasil."
      );
    } catch (err) {
      showGlobalError(err);
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  const copyBankNumber = async () => {
    if (orgFinInfo?.num) {
      // Remove dashes when copying
      const cleanNumber = orgFinInfo.num.replace(/-/g, "");
      try {
        await navigator.clipboard.writeText(cleanNumber);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        // Fallback for older browsers
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

      // Update stats
      const statsResponse = await kindyStudentApi.getStats();
      setStats(statsResponse.data);

      // Show success message in modal
      setWithdrawSuccess(
        `Berhasil mengirimkan permintaan penarikan dana sebesar ${formatCurrency(
          amount
        )} dari tabungan. Dana otomatis akan dikirim ke rekening penerimaan apabila pengecekan berhasil.`
      );

      // Reset form
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
        const [profileResponse, statsResponse, orgFinResponse] =
          await Promise.all([
            kindyStudentApi.getProfile(),
            kindyStudentApi.getStats(),
            orgApi.getFinancialInfo(),
          ]);

        setProfile(profileResponse.data);
        setStats(statsResponse.data);
        setOrgFinInfo(orgFinResponse.data);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Gagal memuat data");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Show loading state during both server and client rendering
  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-base-content/70">Memuat...</p>
        </div>
      </div>
    );
  }

  if (error || !profile || !stats || !orgFinInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-base alert">
          <span>{error || "Terjadi kesalahan"}</span>
        </div>
      </div>
    );
  }

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
      default:
        return (
          <div className="space-y-6">
            {/* Full Day Program - Only show if not enrolled */}
            {!isFullDayEnrolled && (
              <div className="relative p-0.5 rounded-lg bg-gradient-to-r from-primary via-secondary to-primary bg-[length:400%_400%] animate-[gradient_4s_ease_infinite]">
                <div className="card bg-base-100 shadow-sm rounded-lg h-full">
                  <div className="card-body p-6">
                    <div className="space-y-4">
                      <div className="w-full">
                        <h3 className="font-semibold text-base-content mb-1 flex items-center gap-4">
                          Program Full Day dibuka!
                          <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full font-medium animate-pulse">
                            Fleksibel!
                          </span>
                        </h3>
                        <p className="text-sm text-base-content/60 leading-relaxed">
                          Program Full Day dapat diikuti secara fleksibel.
                          Ananda bisa memilih ikut atau berhenti setiap
                          bulan-nya. Daftar sekarang!
                        </p>
                      </div>
                      <div className="w-full flex justify-end">
                        <button
                          onClick={openFullDayModal}
                          className="btn btn-sm btn-primary text-white shadow-lg hover:shadow-primary/25 transition-all duration-300"
                        >
                          Gabung Full Day
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Outstanding Payment */}
            <div className="card bg-gradient-to-br bg-base-100 from-error/5 to-error/10 shadow-sm border border-error/20">
              <div className="card-body p-6">
                <div className="text-center space-y-4">
                  <div>
                    <p className="text-md font-medium text-base-content/60 mb-1">
                      Tagihan saat ini
                    </p>
                    <div
                      className="text-2xl font-bold text-decoration-line"
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

                    {/* Totals summary (no title): total invoice, total payment, and outstanding with inverted sign */}
                    <div className="w-full mt-4 text-xs">
                      <div className="flex justify-between">
                        <span className="text-base-content/60 font-medium">
                          Semua Tagihan (<strong>{stats.count_invoice ?? 0}</strong>)
                        </span>
                        <span className="text-base-content/60 font-medium">{formatCurrency(stats.total_invoice)}</span>
                      </div>

                      <div className="flex justify-between mt-1">
                        <span className="text-base-content/60 font-medium">
                          Semua Pembayaran (<strong>{stats.count_payment ?? 0}</strong>)
                        </span>
                        <span className="text-base-content/60 font-medium">{formatCurrency(stats.total_payment)}</span>
                      </div>

                      <hr className="my-2 border-t border-base-300" />

                      <div className="flex justify-end">
                        {/* Inverted sign: show '+' when outstanding is negative, '-' when outstanding is zero or positive */}
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
                            className={`btn btn-xs ${
                              isCopied
                                ? "btn-success text-white"
                                : "btn-primary text-white"
                            }`}
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
                    className="btn btn-success text-white w-full"
                    onClick={openPaymentConfirmModal}
                  >
                    Konfirmasi Pembayaran
                  </button>
                </div>
              </div>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="card bg-gradient-to-br bg-base-100 from-success/5 to-success/10 shadow-sm border border-success/20">
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
                      className="btn btn-warning btn-sm text-white w-full"
                      onClick={handleWithdrawClick}
                      disabled={stats.saving <= 0}
                    >
                      Tarik
                    </button>
                  </div>
                </div>
              </div>

              <div className="card bg-gradient-to-br bg-base-100 from-info/5 to-info/10 shadow-sm border border-info/20">
                <div className="card-body p-4">
                  <div className="text-center">
                    <p className="text-xs font-medium text-base-content/60 mb-2">
                      Total Infaq
                    </p>
                    <p className="text-lg font-bold" suppressHydrationWarning>
                      {formatCurrency(stats.infaq)}
                    </p>
                    <span className="text-2xl">🤲</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Tabs */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-0">
                <div className="border-b border-base-300 px-6 py-4">
                  <h3 className="font-semibold text-base-content">
                  Aktivitas Terbaru
                  </h3>
                  <div className="alert mt-2 border border-base-300 bg-base-200">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span className="text-xs">Pembaruan data mungkin memerlukan waktu hingga 1 x 24 Jam. Cek berkala.</span>
                  </div>
                </div>

                <div className="tabs tabs-lifted -mb-px justify-evenly">
                  <button
                    className={`tab tab-lifted font-medium text-sm transition-all ${
                      currentTab === "invoices"
                        ? "tab-active [--tab-bg:theme(colors.base-100)] text-base-content font-bold underline decoration-2 underline-offset-8"
                        : "text-base-content/60 hover:text-base-content"
                    }`}
                    onClick={() => setCurrentTab("invoices")}
                  >
                    Tagihan
                  </button>
                  <button
                    className={`tab tab-lifted font-medium text-sm transition-all ${
                      currentTab === "payment"
                        ? "tab-active [--tab-bg:theme(colors.base-100)] text-base-content font-bold underline decoration-2 underline-offset-8"
                        : "text-base-content/60 hover:text-base-content"
                    }`}
                    onClick={() => setCurrentTab("payment")}
                  >
                    Pembayaran
                  </button>
                  <button
                    className={`tab tab-lifted font-medium text-sm transition-all ${
                      currentTab === "saving"
                        ? "tab-active [--tab-bg:theme(colors.base-100)] text-base-content font-bold underline decoration-2 underline-offset-8"
                        : "text-base-content/60 hover:text-base-content"
                    }`}
                    onClick={() => setCurrentTab("saving")}
                  >
                    Tabungan
                  </button>
                  <button
                    className={`tab tab-lifted font-medium text-sm transition-all ${
                      currentTab === "infaq"
                        ? "tab-active [--tab-bg:theme(colors.base-100)] text-base-content font-bold underline decoration-2 underline-offset-8"
                        : "text-base-content/60 hover:text-base-content"
                    }`}
                    onClick={() => setCurrentTab("infaq")}
                  >
                    Infaq
                  </button>
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

      {/* Full Day Confirmation Modal */}
      <dialog id="fullday_modal" className="modal">
        <div className="modal-box w-full max-w-sm mx-2">
          {fullDaySuccess ? (
            <>
              <div className="text-center py-8">
                <h3 className="font-bold text-lg text-success mb-4">Sukses!</h3>
                <p className="text-base-content/70 mb-6">{fullDaySuccess}</p>
                <button
                  className="btn btn-success text-white"
                  onClick={() => {
                    const modal = document.getElementById(
                      "fullday_modal"
                    ) as HTMLDialogElement;
                    modal?.close();
                    setFullDaySuccess(null);
                    setError(null);
                  }}
                >
                  Selesai
                </button>
              </div>
            </>
          ) : error ? (
            <>
              <div className="text-center py-8">
                <h3 className="font-bold text-lg text-error mb-4">
                  Update gagal
                </h3>
                <p className="text-base-content/70 mb-6">{error}</p>
                <div className="flex gap-2 justify-center">
                  <button
                    className="btn btn-outline"
                    onClick={() => {
                      setError(null);
                    }}
                  >
                    Ulangi lagi
                  </button>
                  <button
                    className="btn"
                    onClick={() => {
                      const modal = document.getElementById(
                        "fullday_modal"
                      ) as HTMLDialogElement;
                      modal?.close();
                      setError(null);
                      setFullDaySuccess(null);
                    }}
                  >
                    Keluar
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <h3 className="font-bold text-lg">
                {isFullDayEnrolled ? "Berhenti Full Day" : "Daftar Full Day"}
              </h3>

              <div className="py-4">
                <p className="text-base-content/70 mb-4">
                  {isFullDayEnrolled
                    ? "Ananda dapat mengikuti kembali program full day kapan saja di bulan berikutnya"
                    : "Ananda akan mengikuti full day mulai bulan depan. Konfirmasi."}
                </p>
              </div>

              <div className="modal-action">
                <button
                  className="btn"
                  onClick={() => {
                    const modal = document.getElementById(
                      "fullday_modal"
                    ) as HTMLDialogElement;
                    modal?.close();
                    setError(null);
                    setFullDaySuccess(null);
                  }}
                  disabled={isChangingFullDay}
                >
                  Keluar
                </button>
                <button
                  className={`btn ${
                    isFullDayEnrolled ? "btn-error" : "btn-primary"
                  } text-white`}
                  onClick={handleFullDayToggle}
                  disabled={isChangingFullDay}
                >
                  {isChangingFullDay && (
                    <span className="loading loading-spinner loading-sm"></span>
                  )}
                  {isFullDayEnrolled ? "Berhenti Full Day" : "Ya. Daftarkan"}
                </button>
              </div>
            </>
          )}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>keluar</button>
        </form>
      </dialog>

      {/* Bank Required Modal */}
      <dialog id="bank_required_modal" className="modal">
        <div className="modal-box w-full max-w-sm mx-2">
          <h3 className="font-bold text-lg text-center">
            Informasi rekening penerimaan dibutuhkan
          </h3>

          <div className="py-4">
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">🏦</div>
              <p className="text-sm text-base-content/50 mb-3">
                Untuk menarik tabungan, mohon isi rekening penerimaan terlebih
                dahulu.
              </p>
              <p className="text-sm text-base-content/50">
                Dana yang ditarik akan dikirimkan ke rekening tersebut melalui
                transfer.
              </p>
            </div>
          </div>

          <div className="modal-action">
            <button
              className="btn"
              onClick={() => {
                const modal = document.getElementById(
                  "bank_required_modal"
                ) as HTMLDialogElement;
                modal?.close();
              }}
            >
              Keluar
            </button>
            <button className="btn btn-primary" onClick={handleAddBankInfo}>
              Tambah rekening penerimaan
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>keluar</button>
        </form>
      </dialog>

      {/* Payment Confirmation Modal - Unified */}
      <dialog id="payment_confirm_modal" className="modal">
        <div className="modal-box w-full max-w-sm mx-2">
          {paymentSuccess ? (
            <>
              <div className="text-center py-8">
                <h3 className="font-bold text-lg text-success mb-4">
                  Konfirmasi pembayaran terkirim!
                </h3>
                <p className="text-base-content/70 mb-6">{paymentSuccess}</p>
                <button
                  className="btn btn-success text-white"
                  onClick={() => {
                    const modal = document.getElementById(
                      "payment_confirm_modal"
                    ) as HTMLDialogElement;
                    modal?.close();
                    setPaymentSuccess(null);
                    setError(null);
                    setPaymentFile(null);
                    setPaymentFilePreview(null);
                    setPaymentChoice("");
                  }}
                >
                  Selesai
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="font-bold text-lg text-center">
                Konfirmasi Pembayaran
              </h3>

              <div className="py-4">
                {/* Radio Choice */}
                <div className="mb-6">
                  <div className="text-3xl mb-4 text-center">📄</div>
                  <p className="text-base-content/70 mb-4 text-center">
                    Apakah Anda memiliki screenshot atau dokumen transfer?
                  </p>

                  <div className="flex justify-center gap-10">
                    <div className="form-control">
                      <label className="label cursor-pointer flex-col gap-2">
                        <input
                          type="radio"
                          name="payment-choice"
                          className="radio radio-primary"
                          checked={paymentChoice === "no_receipt"}
                          onChange={() => setPaymentChoice("no_receipt")}
                        />
                        <span className="label-text">Tidak</span>
                      </label>
                    </div>

                    <div className="form-control">
                      <label className="label cursor-pointer flex-col gap-2">
                        <input
                          type="radio"
                          name="payment-choice"
                          className="radio radio-primary"
                          checked={paymentChoice === "receipt"}
                          onChange={() => setPaymentChoice("receipt")}
                        />
                        <span className="label-text">Punya</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* File Upload Section - Show when "Ada" is selected */}
                {paymentChoice === "receipt" && (
                  <div className="space-y-4">
                    <div>
                      <label className="label">
                        <span className="label-text text-sm font-medium py-2">
                          Upload file screenshot atau dokumen transfer *
                        </span>
                      </label>
                      <input
                        type="file"
                        onChange={handleFileSelect}
                        className="file-input file-input-bordered w-full"
                        accept="image/*,.pdf"
                      />
                      <div className="label">
                        <span className="label-text-alt text-xs text-base-content/60 py-2">
                          Format: JPG, PNG, PDF (max 5MB)
                        </span>
                      </div>

                      {/* File preview for images */}
                      {paymentFile && (
                        <div className="mt-2">
                          <div className="bg-base-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs">
                                File: {paymentFile.name}
                              </span>
                            </div>
                            {paymentFilePreview ? (
                              <>
                                <Image
                                  src={paymentFilePreview}
                                  alt="Preview dokumen"
                                  width={300}
                                  height={300}
                                  className="max-w-full h-auto rounded object-contain"
                                  style={{ maxHeight: "100px" }}
                                />
                              </>
                            ) : paymentFile.type === "application/pdf" ? (
                              <div className="text-xs text-base-content/70">
                                📄 File PDF (preview tidak tersedia)
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment Form Section - Show when "Tidak Ada" is selected */}
                {paymentChoice === "no_receipt" && (
                  <div className="space-y-2">
                    <div>
                      <label className="label">
                        <span className="label-text text-sm font-medium py-1">
                          Tanggal pembayaran *
                        </span>
                      </label>
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="input input-bordered w-full"
                        max={new Date().toISOString().split("T")[0]}
                      />
                    </div>

                    <div>
                      <label className="label">
                        <span className="label-text text-sm font-medium py-1">
                          Jumlah pembayaran *
                        </span>
                      </label>
                      <input
                        type="text"
                        value={formatRupiah(paymentAmount)}
                        onChange={handleAmountChange}
                        className="input input-bordered w-full"
                        placeholder="contoh: 300000"
                      />
                    </div>

                    <div>
                      <label className="label">
                        <span className="label-text text-sm font-medium py-1">
                          Nama Bank / E-Wallet pengirim *
                        </span>
                      </label>
                      <input
                        type="text"
                        value={paymentFinEnt}
                        onChange={(e) => setPaymentFinEnt(e.target.value)}
                        className="input input-bordered w-full"
                        placeholder="contoh: BCA, BRI, Mandiri, GoPay"
                      />
                    </div>

                    <div>
                      <label className="label">
                        <span className="label-text text-sm font-medium py-1">
                          Atas nama / nomor rekening pengirim *
                        </span>
                      </label>
                      <input
                        type="text"
                        value={paymentFinNumName}
                        onChange={(e) => setPaymentFinNumName(e.target.value)}
                        className="input input-bordered w-full"
                        placeholder="contoh: 1234567890 atau Fulan"
                      />
                    </div>
                  </div>
                )}

                {/* Error display */}
                {error && (
                  <div className="alert alert-error mt-4">
                    <span className="text-sm">{error}</span>
                  </div>
                )}
              </div>

              <div className="modal-action">
                <button
                  className="btn"
                  onClick={() => {
                    const modal = document.getElementById(
                      "payment_confirm_modal"
                    ) as HTMLDialogElement;
                    modal?.close();
                    setError(null);
                    setPaymentSuccess(null);
                    setPaymentFile(null);
                    setPaymentFilePreview(null);
                    setPaymentChoice("");
                  }}
                  disabled={isConfirmingPayment}
                >
                  Keluar
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    if (paymentChoice === "receipt") {
                      handlePaymentWithFile();
                    } else if (paymentChoice === "no_receipt") {
                      handlePaymentWithForm();
                    }
                  }}
                  disabled={
                    isConfirmingPayment ||
                    paymentChoice === "" ||
                    (paymentChoice === "receipt" && !paymentFile) ||
                    (paymentChoice === "no_receipt" &&
                      (!paymentDate ||
                        !paymentAmount.trim() ||
                        !paymentFinEnt.trim() ||
                        !paymentFinNumName.trim()))
                  }
                >
                  {isConfirmingPayment && (
                    <span className="loading loading-spinner loading-sm"></span>
                  )}
                  Kirim konfirmasi
                </button>
              </div>
            </>
          )}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>keluar</button>
        </form>
      </dialog>

      {/* Withdraw Modal */}
      <dialog id="withdraw_modal" className="modal">
        <div className="modal-box w-full max-w-sm mx-2">
          {withdrawSuccess ? (
            <>
              <div className="text-center py-8">
                <h3 className="font-bold text-lg text-success mb-4">
                  Permintaan penarikan berhasil dikirim
                </h3>
                <p className="text-base-content/70 mb-6">{withdrawSuccess}</p>
                <button
                  className="btn btn-success text-white"
                  onClick={() => {
                    const modal = document.getElementById(
                      "withdraw_modal"
                    ) as HTMLDialogElement;
                    modal?.close();
                    setWithdrawSuccess(null);
                  }}
                >
                  Selesai
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="font-bold text-lg">Tarik Tabungan</h3>

              <div className="py-4">
                <div className="mb-4">
                  <p className="text-base-content/70 mb-2">
                    Saldo tersedia:{" "}
                    <span className="font-semibold text-success">
                      {stats && formatCurrency(stats.saving)}
                    </span>
                  </p>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-sm font-medium py-2">
                      Jumlah penarikan
                    </span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="contoh: 50000"
                    value={formatRupiah(withdrawAmount)}
                    onChange={handleWithdrawAmountChange}
                  />
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() =>
                      stats &&
                      setWithdrawAmount(Math.floor(stats.saving / 4).toString())
                    }
                    disabled={!stats || stats.saving <= 0}
                  >
                    25%
                  </button>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() =>
                      stats &&
                      setWithdrawAmount(Math.floor(stats.saving / 2).toString())
                    }
                    disabled={!stats || stats.saving <= 0}
                  >
                    50%
                  </button>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() =>
                      stats && setWithdrawAmount(stats.saving.toString())
                    }
                    disabled={!stats || stats.saving <= 0}
                  >
                    Semua
                  </button>
                </div>
              </div>

              <div className="modal-action">
                <button
                  className="btn"
                  onClick={() => {
                    const modal = document.getElementById(
                      "withdraw_modal"
                    ) as HTMLDialogElement;
                    modal?.close();
                    setWithdrawAmount("");
                  }}
                  disabled={isWithdrawing}
                >
                  Keluar
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleWithdraw}
                  disabled={isWithdrawing || !withdrawAmount}
                >
                  {isWithdrawing && (
                    <span className="loading loading-spinner loading-sm"></span>
                  )}
                  Tarik sekarang
                </button>
              </div>
            </>
          )}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>keluar</button>
        </form>
      </dialog>

      {/* Global Error Modal */}
      <dialog id="global_error_modal" className="modal">
        <div className="modal-box w-full max-w-sm mx-2">
          <div className="text-center py-8">
            <h3 className="text-md mb-4">Terjadi kesalahan</h3>
            <p className="text-md mb-4">
              <strong>{globalError}</strong>
            </p>
            <button
              className="btn btn-secondary"
              onClick={() => {
                const modal = document.getElementById(
                  "global_error_modal"
                ) as HTMLDialogElement;
                modal?.close();
                setGlobalError(null);
              }}
            >
              Mengerti
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>keluar</button>
        </form>
      </dialog>
    </div>
  );
}
