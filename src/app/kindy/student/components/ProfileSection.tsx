"use client";

import { useState, useEffect } from "react";
import { KindyStudent, InsuranceInfo } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import kindyStudentApi, { ApiError } from "@/lib/api";
import Image from "next/image";

interface ProfileSectionProps {
  profile: KindyStudent;
  onUpdate: (profile: KindyStudent) => void;
  onBankInfoAdded?: () => void; // Optional callback when bank info is successfully added
  onError?: (error: any) => void; // Optional global error handler
}

export default function ProfileSection({
  profile,
  onUpdate,
  onBankInfoAdded,
  onError,
}: ProfileSectionProps) {
  const [finEnt, setFinEnt] = useState(profile.finEnt || "");
  const [finNum, setFinNum] = useState(profile.finNum || "");
  const [finName, setFinName] = useState(profile.finName || "");
  const [error, setError] = useState<string | null>(null);
  const [isChangingFullDay, setIsChangingFullDay] = useState(false);
  const [fullDaySuccess, setFullDaySuccess] = useState<string | null>(null);
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [pendingBankData, setPendingBankData] = useState<{
    finEnt: string;
    finNum: string;
    finName: string;
  } | null>(null);
  const [bankSuccess, setBankSuccess] = useState<string | null>(null);
  const [insuranceInfo, setInsuranceInfo] = useState<InsuranceInfo | null>(
    null
  );
  const [isLoadingInsurance, setIsLoadingInsurance] = useState(true);

  const locale = profile.lang;

  // Check if user is enrolled in full day program
  const isFullDayEnrolled =
    profile.KindyStudentRecurringFee?.some((fee) =>
      fee.KindyRecurringFee.name.toLowerCase().includes("full day")
    ) || false;

  // Check if bank information exists
  const hasBankInfo = profile.finEnt && profile.finNum && profile.finName;

  const openBankModal = () => {
    // Reset form with current values
    setFinEnt(profile.finEnt || "");
    setFinNum(profile.finNum || "");
    setFinName(profile.finName || "");
    setError(null);
    setBankSuccess(null);

    const modal = document.getElementById("bank_modal") as HTMLDialogElement;
    modal?.showModal();
  };

  const handleBankSave = async () => {
    if (!finEnt.trim() || !finNum.trim() || !finName.trim()) {
      setError("Semua informasi bank dibutuhkan");
      return;
    }

    // Store pending data and show confirmation
    setPendingBankData({
      finEnt: finEnt.trim(),
      finNum: finNum.trim(),
      finName: finName.trim(),
    });

    // Close bank modal and open confirmation
    const bankModal = document.getElementById(
      "bank_modal"
    ) as HTMLDialogElement;
    bankModal?.close();

    const confirmModal = document.getElementById(
      "bank_confirm_modal"
    ) as HTMLDialogElement;
    confirmModal?.showModal();
  };

  const handleBankConfirm = async () => {
    if (!pendingBankData) return;

    setIsSavingBank(true);
    setError(null);
    setBankSuccess(null);

    try {
      await kindyStudentApi.setFinancialInfo(
        pendingBankData.finEnt,
        pendingBankData.finNum,
        pendingBankData.finName
      );

      // Update profile locally
      const updatedProfile = {
        ...profile,
        finEnt: pendingBankData.finEnt,
        finNum: pendingBankData.finNum,
        finName: pendingBankData.finName,
      };
      onUpdate(updatedProfile);

      // Set success state and clear pending data
      setBankSuccess(
        hasBankInfo
          ? "Informasi rekening penerimaan berhasil diperbarui!"
          : "Informasi rekening penerimaan berhasil ditambahkan!"
      );
      setPendingBankData(null);

      // Call the optional callback to notify parent that bank info was added
      onBankInfoAdded?.();
    } catch (err) {
      if (onError) {
        onError(err);
      } else {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Gagal memperbarui informasi rekening penerimaan!");
        }
      }
    } finally {
      setIsSavingBank(false);
    }
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
      onUpdate(profileResponse.data);

      // Show success message
      const action = wasEnrolled ? "keluar dari" : "mengikuti";
      setFullDaySuccess(`Berhasil ${action} program full day!`);
    } catch (err) {
      if (onError) {
        onError(err);
      } else {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Gagal memperbarui program full day");
        }
      }
    } finally {
      setIsChangingFullDay(false);
    }
  };

  const openFullDayModal = () => {
    setError(null);
    setFullDaySuccess(null);
    const modal = document.getElementById(
      "fullday_profile_modal"
    ) as HTMLDialogElement;
    modal?.showModal();
  };

  // Fetch insurance information
  useEffect(() => {
    const fetchInsuranceInfo = async () => {
      try {
        setIsLoadingInsurance(true);
        const response = await kindyStudentApi.getInsurance();
        setInsuranceInfo(response.data);
      } catch (err) {
        console.error("Failed to fetch insurance info:", err);
        // Insurance info is not critical, so we don't show global error
      } finally {
        setIsLoadingInsurance(false);
      }
    };

    fetchInsuranceInfo();
  }, []);

  return (
    <>
      <div className="space-y-6">
        {/* Student Info Card */}
        <div className="card bg-white shadow-md border border-primary/20">
          <div className="card-body p-0">
            {/* Header Section */}
            <div className="bg-primary/5 border-b border-primary/15 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/15 rounded-full flex items-center justify-center">
                    <span className="text-lg">🎓</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-base-content">
                      {profile.name}
                    </h2>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="px-4 py-3">
              {profile.KindyEnrollment[0] ? (
                <div className="space-y-2">
                  {/* NISN */}
                  {profile.nisn && (
                    <div className="flex items-center gap-3 p-3 bg-base-50 rounded-lg border border-primary/8">
                      <div className="w-6 h-6 bg-primary/10 rounded-md flex items-center justify-center">
                        <span className="text-sm">🆔</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-base-content/60">
                          NISN
                        </p>
                        <p className="text-sm font-bold text-primary">
                          {profile.nisn}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Gender */}
                  {profile.gender && (
                    <div className="flex items-center gap-3 p-3 bg-base-50 rounded-lg border border-primary/8">
                      <div className="w-6 h-6 bg-primary/10 rounded-md flex items-center justify-center">
                        <span className="text-sm">
                          {profile.gender === "MALE" ? "👦" : "👧"}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-base-content/60">
                          Jenis Kelamin
                        </p>
                        <p className="text-sm font-bold text-primary">
                          {profile.gender === "MALE" ? "LAKI LAKI" : "PEREMPUAN"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Class Information */}
                  <div className="flex items-center gap-3 p-3 bg-base-50 rounded-lg border border-primary/8">
                    <div className="w-6 h-6 bg-primary/10 rounded-md flex items-center justify-center">
                      <span className="text-sm">📚</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-base-content/60">
                        Kelompok
                      </p>
                      <p className="text-sm font-bold text-primary">
                        {profile.KindyEnrollment[0].KindyGroup.name.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {/* Academic Year */}
                  <div className="flex items-center gap-3 p-3 bg-base-50 rounded-lg border border-primary/8">
                    <div className="w-6 h-6 bg-primary/10 rounded-md flex items-center justify-center">
                      <span className="text-sm">📅</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-base-content/60">
                        Tahun Ajaran
                      </p>
                      <p className="text-sm font-bold text-primary">
                        {profile.KindyEnrollment[0].KindyGroup.kindyYearName}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-2xl mb-2 opacity-50">📝</div>
                  <p className="text-base-content/70 text-xs">
                    Informasi pendaftaran tidak tersedia
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Insurance Information Card - Only show if insurance number exists */}
        {(!isLoadingInsurance && insuranceInfo && insuranceInfo.num) && (
        <div className="card bg-gradient-to-br bg-base-100 from-blue-500/5 to-blue-600/10 shadow-sm border border-blue-500/20">
          <div className="card-body p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base-content flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Asuransi
              </h3>
              <div className="text-2xl">🛡️</div>
            </div>

            {insuranceInfo && (
              <div className="space-y-4">
                {/* Insurance Provider */}
                <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-30 h-30 flex items-center">
                      <Image
                        src={insuranceInfo.image}
                        alt={insuranceInfo.ent}
                        width={70}
                        height={70}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-base-content text-sm">
                        {insuranceInfo.ent}
                      </p>
                      <p className="font-medium text-base-content text-sm">
                        {insuranceInfo.type}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Policy Information */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 px-3 bg-base-200/30 rounded">
                    <span className="text-sm font-medium text-base-content">
                      Tertanggung:
                    </span>
                    <span className="text-sm">
                      {insuranceInfo.beneficiary}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-base-200/30 rounded">
                    <span className="text-sm font-medium text-base-content">
                      No. Polis:
                    </span>
                    <span className="text-sm text-base-content">
                      {insuranceInfo.num}
                    </span>
                  </div>
                </div>

                {/* Benefits */}
                <div>
                  <p className="font-medium text-base-content mb-2 text-sm">
                    Manfaat:
                  </p>
                  <div className="space-y-2">
                    {insuranceInfo.benefit.map((benefit, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 p-2 rounded text-xs"
                      >
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <span className="text-base-content/80 leading-relaxed">
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Full Day Program */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-base-content mb-1">
                  Program Full Day
                </h3>
                <p className="text-sm text-base-content/60 leading-relaxed">
                  {isFullDayEnrolled
                    ? "Ananda mengikuti program full day"
                    : "Ananda belum mengikuti program full day. Daftar untuk mengikuti program full day bulan depan."}
                </p>
              </div>
              <button
                onClick={openFullDayModal}
                className={`btn btn-sm ${
                  isFullDayEnrolled
                    ? "btn-error text-white"
                    : "btn-primary text-white"
                }`}
              >
                {isFullDayEnrolled ? "Berhenti" : "Daftar"}
              </button>
            </div>
          </div>
        </div>

        {/* Payment Scheme */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-0">
            <div className="border-b border-base-300 px-6 py-4">
              <h3 className="font-semibold text-base-content">
                Skema Biaya
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {/* One Time Fee */}
              <div>
                <h4 className="font-medium text-base-content mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-warning rounded-full"></div>
                  Biaya 1x
                </h4>
                <div className="space-y-2">
                  {profile.KindyStudentOneTimeFee?.map((fee, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-2 px-3 bg-base-200/50 rounded-lg"
                    >
                      <span className="text-sm font-medium text-base-content">
                        {fee.KindyOneTimeFee.name}
                      </span>
                      <span
                        className="text-sm font-bold text-base-content"
                        suppressHydrationWarning
                      >
                        {formatCurrency(fee.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recurring Fee */}
              <div>
                <h4 className="font-medium text-base-content mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-info rounded-full"></div>
                  Biaya berulang
                </h4>
                <div className="space-y-2">
                  {profile.KindyStudentRecurringFee?.map((fee, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-2 px-3 bg-base-200/50 rounded-lg"
                    >
                      <span className="text-sm font-medium text-base-content">
                        {fee.KindyRecurringFee.name}
                      </span>
                      <span
                        className="text-sm font-bold text-base-content"
                        suppressHydrationWarning
                      >
                        {formatCurrency(fee.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bank Information */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-0">
            <div className="border-b border-base-300 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base-content">
                  Rekening Penerimaan
                </h3>
                <button
                  className={`btn btn-sm text-white ${
                    hasBankInfo ? "btn-primary" : "btn-success"
                  }`}
                  onClick={openBankModal}
                >
                  {hasBankInfo ? "Ubah" : "Tambah"}
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-xs text-base-content/60 mb-4 leading-relaxed">
                Rekening penerimaan digunakan untuk penarikan tabungan
                atau refund. Kami akan selalu melakukan verifikasi sebelum
                melakukan transfer. Anda dapat mengubah rekening kapan saja.
              </p>

              {hasBankInfo ? (
                <div className=" border-2 rounded-lg">
                  <div className="flex justify-between items-center py-2 px-3 bg-base-200/50 border-b-2">
                    <span className="text-sm font-medium text-base-content">
                      Bank / E-Wallet:
                    </span>
                    <span className="text-sm text-base-content">
                      {profile.finEnt}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-base-200/50 border-b-2">
                    <span className="text-sm font-medium text-base-content">
                      Nomor:
                    </span>
                    <span className="text-sm text-base-content">
                      {profile.finNum}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-base-200/50 rounded-lg">
                    <span className="text-sm font-medium text-base-content">
                      Atas Nama:
                    </span>
                    <span className="text-sm text-base-content">
                      {profile.finName}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🏦</div>
                  <p className="text-base-content/70 mb-2">
                    Tidak ada informasi rekening penerimaan
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full Day Confirmation Modal */}
      <dialog id="fullday_profile_modal" className="modal">
        <div className="modal-box w-full max-w-sm mx-2">
          {fullDaySuccess ? (
            <>
              <div className="text-center py-8">
                <h3 className="font-bold text-lg text-success mb-4">
                  Kepesertaan program diperbarui!
                </h3>
                <p className="text-base-content/70 mb-6">{fullDaySuccess}</p>
                <button
                  className="btn btn-success text-white"
                  onClick={() => {
                    const modal = document.getElementById(
                      "fullday_profile_modal"
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
                        "fullday_profile_modal"
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
                    ? "Ananda dapat mengikuti kembali program full day kapan saja di bulan-bulan berikutnya"
                    : "Ananda akan mengikuti full day mulai bulan depan. Konfirmasi."}
                </p>
              </div>

              <div className="modal-action">
                <button
                  className="btn"
                  onClick={() => {
                    const modal = document.getElementById(
                      "fullday_profile_modal"
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
                  {isFullDayEnrolled ? "Berhenti Full Day" : "Daftar Full Day"}
                </button>
              </div>
            </>
          )}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>keluar</button>
        </form>
      </dialog>

      {/* Bank Information Modal */}
      <dialog id="bank_modal" className="modal">
        <div className="modal-box w-full max-w-sm mx-2">
          <h3 className="font-bold text-lg">
            {hasBankInfo
              ? "Ubah Rekening Penerimaan"
              : "Tambah Rekening Penerimaan"}
          </h3>

          <div className="py-4">
            {error && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text text-sm font-medium py-2">
                    Bank / E-Wallet
                  </span>
                </label>
                <input
                  type="text"
                  value={finEnt}
                  onChange={(e) => setFinEnt(e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="BCA, BRI, Shopee, Gopay"
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text text-sm font-medium py-2">
                    Nomor
                  </span>
                </label>
                <input
                  type="text"
                  value={finNum}
                  onChange={(e) => setFinNum(e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="123456 / 08123456"
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text text-sm font-medium py-2">
                    Atas Nama
                  </span>
                </label>
                <input
                  type="text"
                  value={finName}
                  onChange={(e) => setFinName(e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="Nama sesuai rekening"
                />
              </div>
            </div>
          </div>

          <div className="modal-action">
            <button
              className="btn"
              onClick={() => {
                const modal = document.getElementById(
                  "bank_modal"
                ) as HTMLDialogElement;
                modal?.close();
                setError(null);
              }}
            >
              Cancel
            </button>
            <button
              className={`btn text-white ${
                hasBankInfo ? "btn-primary" : "btn-success"
              }`}
              onClick={handleBankSave}
            >
              {hasBankInfo ? "Ubah rekening" : "Tambah rekening"}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>keluar</button>
        </form>
      </dialog>

      {/* Bank Information Confirmation Modal */}
      <dialog id="bank_confirm_modal" className="modal">
        <div className="modal-box w-full max-w-sm mx-2">
          {bankSuccess ? (
            <>
              <div className="text-center py-8">
                <h3 className="font-bold text-lg text-success mb-4">Sukses!</h3>
                <p className="text-base-content/70 mb-6">{bankSuccess}</p>
                <div className="flex gap-2 justify-center">
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      const modal = document.getElementById(
                        "bank_confirm_modal"
                      ) as HTMLDialogElement;
                      modal?.close();
                      setBankSuccess(null);
                    }}
                  >
                    Lanjut
                  </button>
                </div>
              </div>
            </>
          ) : error ? (
            <>
              <div className="text-center py-8">
                <h3 className="font-bold text-lg text-error mb-4">Failed!</h3>
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
                    className="btn btn-primary"
                    onClick={() => {
                      const modal = document.getElementById(
                        "bank_confirm_modal"
                      ) as HTMLDialogElement;
                      modal?.close();
                      setPendingBankData(null);
                      setError(null);
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
                {hasBankInfo
                  ? "Ubah rekening penerimaan"
                  : "Tambah rekening penerimaan"}
              </h3>

              <div className="py-4">
                <p className="text-base-content/70 mb-4">
                  {hasBankInfo
                    ? "Konfirmasi pengubahan rekening penerimaan."
                    : "Konfirmasi penambahan rekening penerimaan."}
                </p>

                {pendingBankData && (
                  <div className="space-y-3 mb-4 p-3 bg-base-200/50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-base-content">
                        Bank / E-Wallet:
                      </span>
                      <span className="text-sm text-base-content">
                        {pendingBankData.finEnt}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-base-content">
                        Nomor:
                      </span>
                      <span className="text-sm text-base-content">
                        {pendingBankData.finNum}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-base-content">
                        Atas Nama:
                      </span>
                      <span className="text-sm text-base-content">
                        {pendingBankData.finName}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-action">
                <button
                  className="btn"
                  onClick={() => {
                    const modal = document.getElementById(
                      "bank_confirm_modal"
                    ) as HTMLDialogElement;
                    modal?.close();
                    setPendingBankData(null);
                    setError(null);
                  }}
                  disabled={isSavingBank}
                >
                  Keluar
                </button>
                <button
                  className={`btn text-white ${
                    hasBankInfo ? "btn-primary" : "btn-success"
                  } text-white`}
                  onClick={handleBankConfirm}
                  disabled={isSavingBank}
                >
                  {isSavingBank && (
                    <span className="loading loading-spinner loading-sm"></span>
                  )}
                  {hasBankInfo ? "Ubah Rekening" : "Tambah Rekening"}
                </button>
              </div>
            </>
          )}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>keluar</button>
        </form>
      </dialog>
    </>
  );
}
