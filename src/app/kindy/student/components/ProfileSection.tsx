"use client";

import { useEffect, useState } from "react";
import { KindyStudent, InsuranceInfo, FacilityInfo } from "@/lib/types";
import { addressOf, capitalizeWords, formatCurrency } from "@/lib/utils";
import kindyStudentApi, { ApiError, orgApi } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Input,
  Label,
  Separator,
  ErrorAlert,
  Modal,
} from "@/components/ui";
import StudentAvatar from "./StudentAvatar";

interface ProfileSectionProps {
  profile: KindyStudent;
  onUpdate: (profile: KindyStudent) => void;
  onBankInfoAdded?: () => void;
  onError?: (error: unknown) => void;
  /** Incrementing signal from the parent to open the bank dialog (withdraw flow). */
  openBankSignal?: number;
  /** Opens the profile photo in the fullscreen media viewer. */
  onAvatarClick?: () => void;
}

/** A label / value row with a bottom divider (last row can drop it). */
function Row({
  label,
  value,
  mono = false,
  last = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 py-2.5 ${
        last ? "" : "border-b border-border"
      }`}
    >
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span
        className={`text-sm font-medium text-right ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * One entry inside the Fasilitas card. The icon tile + bold title is what
 * separates each facility from the next, so WiFi and Asuransi don't read as
 * one continuous list of rows.
 */
function FacilityItem({
  icon: Icon,
  title,
  subtitle,
  badge,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{title}</p>
            {subtitle && (
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

const MicroLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.04em] text-muted-foreground">
    {children}
  </p>
);

export default function ProfileSection({
  profile,
  onUpdate,
  onBankInfoAdded,
  onError,
  openBankSignal = 0,
  onAvatarClick,
}: ProfileSectionProps) {
  const [modal, setModal] = useState<null | "fullday" | "bank">(null);
  const [finEnt, setFinEnt] = useState(profile.finEnt || "");
  const [finNum, setFinNum] = useState(profile.finNum || "");
  const [finName, setFinName] = useState(profile.finName || "");
  const [error, setError] = useState<string | null>(null);
  const [isChangingFullDay, setIsChangingFullDay] = useState(false);
  const [fullDaySuccess, setFullDaySuccess] = useState<string | null>(null);
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [showWifiPass, setShowWifiPass] = useState(false);
  const [wifiCopied, setWifiCopied] = useState(false);

  const { data: insuranceInfo, isLoading: isLoadingInsurance } =
    useApi<InsuranceInfo>(() => kindyStudentApi.getInsurance());

  const { data: facility, isLoading: isLoadingFacility } = useApi<FacilityInfo>(
    () => orgApi.getFacility(),
  );

  const wifi = facility?.wifi?.ssid ? facility.wifi : null;
  const hasInsurance = !isLoadingInsurance && !!insuranceInfo?.num;
  const showFacilities = !isLoadingFacility && (!!wifi || hasInsurance);

  const copyWifiPass = async () => {
    if (!wifi) return;
    try {
      await navigator.clipboard.writeText(wifi.pass);
      setWifiCopied(true);
      setTimeout(() => setWifiCopied(false), 2000);
    } catch {
      // Clipboard unavailable (insecure origin / denied) — the password is
      // still readable on screen via the reveal toggle.
    }
  };

  const isFullDayEnrolled =
    profile.KindyStudentRecurringFee?.some((fee) =>
      fee.KindyRecurringFee.name.toLowerCase().includes("full day"),
    ) || false;

  const hasBankInfo = !!(profile.finEnt && profile.finNum && profile.finName);
  const enrollment = profile.KindyEnrollment[0];

  const openBankModal = () => {
    setFinEnt(profile.finEnt || "");
    setFinNum(profile.finNum || "");
    setFinName(profile.finName || "");
    setError(null);
    setModal("bank");
  };

  // External trigger (from the withdraw flow) to open the bank dialog.
  useEffect(() => {
    if (openBankSignal > 0) openBankModal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openBankSignal]);

  const openFullDayModal = () => {
    setError(null);
    setFullDaySuccess(null);
    setModal("fullday");
  };

  const closeModal = () => {
    setModal(null);
    setError(null);
    setFullDaySuccess(null);
  };

  const handleBankSave = async () => {
    if (!finEnt.trim() || !finNum.trim() || !finName.trim()) {
      setError("Semua informasi rekening dibutuhkan");
      return;
    }
    setIsSavingBank(true);
    setError(null);
    try {
      await kindyStudentApi.setFinancialInfo(
        finEnt.trim(),
        finNum.trim(),
        finName.trim(),
      );
      onUpdate({
        ...profile,
        finEnt: finEnt.trim(),
        finNum: finNum.trim(),
        finName: finName.trim(),
      });
      setModal(null);
      onBankInfoAdded?.();
    } catch (err) {
      if (onError) onError(err);
      else
        setError(
          err instanceof ApiError
            ? err.message
            : "Gagal memperbarui rekening penerimaan",
        );
    } finally {
      setIsSavingBank(false);
    }
  };

  const handleFullDayToggle = async () => {
    setIsChangingFullDay(true);
    setError(null);
    setFullDaySuccess(null);
    try {
      const wasEnrolled = isFullDayEnrolled;
      await kindyStudentApi.changeFullDay(!isFullDayEnrolled);
      const profileResponse = await kindyStudentApi.getProfile();
      onUpdate(profileResponse.data);
      setFullDaySuccess(
        wasEnrolled
          ? "Ananda dapat mendaftar kembali kapan saja bulan berikutnya."
          : "Ananda dapat mengikuti Full Day mulai bulan depan.",
      );
    } catch (err) {
      if (onError) onError(err);
      else
        setError(
          err instanceof ApiError
            ? err.message
            : "Gagal memperbarui program full day",
        );
    } finally {
      setIsChangingFullDay(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Data Santri */}
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle>Data Santri</CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="flex justify-center border-b border-border pb-4 pt-1">
              <StudentAvatar
                name={profile.name}
                url={profile.photoUrl}
                size={96}
                ring
                badge={profile.nickname ? addressOf(profile) : null}
                onClick={onAvatarClick}
                className="text-2xl"
              />
            </div>
            <Row label="Nama" value={profile.name} />
            {profile.nisn && <Row label="NISN" value={profile.nisn} mono />}
            {enrollment && (
              <Row
                label="Kelompok"
                value={capitalizeWords(enrollment.KindyGroup.name)}
              />
            )}
            <Row
              label="Tahun Ajaran"
              value={enrollment ? enrollment.KindyGroup.kindyYearName : "—"}
              last
            />
          </CardContent>
        </Card>

        {/* Program Full Day */}
        <Card>
          <CardHeader className="flex-row items-center justify-between border-b border-border">
            <CardTitle>Program Full Day</CardTitle>
            <Button
              size="sm"
              variant={isFullDayEnrolled ? "destructive" : "default"}
              onClick={openFullDayModal}
              className="shrink-0"
            >
              {isFullDayEnrolled ? "Berhenti" : "Daftar"}
            </Button>
          </CardHeader>
          <CardContent className="pt-3">
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              {isFullDayEnrolled
                ? "Ananda mengikuti program full day."
                : "Ananda belum mengikuti program full day. Pendaftaran berlaku mulai bulan depan."}
            </p>
          </CardContent>
        </Card>

        {/* Skema Biaya */}
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle>Skema Biaya</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-3">
            <div>
              <MicroLabel>Biaya satu kali</MicroLabel>
              {profile.KindyStudentOneTimeFee?.map((fee) => (
                <div
                  key={fee.id}
                  className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-b-0"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="text-sm">{fee.KindyOneTimeFee.name}</span>
                    <Badge variant="secondary" className="shrink-0 font-mono">
                      {fee.KindyOneTimeFee.kindyYearName}
                    </Badge>
                  </div>
                  <span
                    className="shrink-0 font-mono text-[13px] font-semibold"
                    suppressHydrationWarning
                  >
                    {formatCurrency(fee.amount)}
                  </span>
                </div>
              ))}
            </div>
            <div>
              <MicroLabel>Biaya bulanan</MicroLabel>
              {profile.KindyStudentRecurringFee?.map((fee) => (
                <div
                  key={fee.id}
                  className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-b-0"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="text-sm">
                      {fee.KindyRecurringFee.name}
                    </span>
                    <Badge variant="secondary" className="shrink-0 font-mono">
                      {fee.KindyRecurringFee.kindyYearName}
                    </Badge>
                  </div>
                  <span
                    className="shrink-0 font-mono text-[13px] font-semibold"
                    suppressHydrationWarning
                  >
                    {formatCurrency(fee.amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Fasilitas */}
        {showFacilities && (
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle>Fasilitas</CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              {wifi && (
                <FacilityItem
                  icon={Wifi}
                  title="Akses Internet"
                  subtitle="Untuk wali santri selama berada di lingkungan sekolah."
                >
                  <Row label="Jaringan" value={wifi.ssid} mono />
                  <Row
                    label="Kata Sandi"
                    last
                    value={
                      <span className="inline-flex items-center gap-1">
                        <span className="font-mono">
                          {showWifiPass ? wifi.pass : "••••••••"}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          aria-label={
                            showWifiPass
                              ? "Sembunyikan kata sandi"
                              : "Tampilkan kata sandi"
                          }
                          onClick={() => setShowWifiPass((v) => !v)}
                        >
                          {showWifiPass ? <EyeOff /> : <Eye />}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          aria-label="Salin kata sandi"
                          onClick={copyWifiPass}
                        >
                          {wifiCopied ? (
                            <Check className="text-primary" />
                          ) : (
                            <Copy />
                          )}
                        </Button>
                      </span>
                    }
                  />
                </FacilityItem>
              )}

              {wifi && hasInsurance && <Separator className="my-4" />}

              {hasInsurance && insuranceInfo && (
                <FacilityItem
                  icon={ShieldCheck}
                  title="Asuransi"
                  subtitle={insuranceInfo.type}
                  badge={<Badge variant="info">Aktif</Badge>}
                >
                  <Row label="Penyedia" value={insuranceInfo.ent} />
                  <Row label="Tertanggung" value={insuranceInfo.beneficiary} />
                  <Row label="Polis" value={insuranceInfo.num} mono last />
                  {insuranceInfo.benefit?.length > 0 && (
                    <div className="pt-3">
                      <MicroLabel>Manfaat</MicroLabel>
                      <div className="flex flex-col gap-1.5">
                        {insuranceInfo.benefit.map((b, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full bg-primary" />
                            <span className="text-[13px] leading-relaxed text-muted-foreground">
                              {b}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </FacilityItem>
              )}
            </CardContent>
          </Card>
        )}

        {/* Rekening Penerimaan */}
        <Card>
          <CardHeader className="flex-row items-center justify-between border-b border-border">
            <CardTitle>Rekening Penerimaan</CardTitle>
            <Button size="sm" variant="outline" onClick={openBankModal}>
              {hasBankInfo ? "Ubah" : "Tambah"}
            </Button>
          </CardHeader>
          <CardContent className="pt-3">
            <p className="mb-2 text-xs leading-relaxed text-muted-foreground">
              Digunakan untuk penarikan tabungan atau refund. Verifikasi selalu
              dilakukan sebelum transfer.
            </p>
            {hasBankInfo ? (
              <>
                <Row label="Bank / E-Wallet" value={profile.finEnt} />
                <Row label="Nomor" value={profile.finNum} mono />
                <Row label="Atas Nama" value={profile.finName} last />
              </>
            ) : (
              <p className="py-4 text-center text-[13px] text-muted-foreground">
                Belum ada rekening penerimaan.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full Day dialog */}
      <Modal
        open={modal === "fullday"}
        onClose={closeModal}
        dismissable={!isChangingFullDay}
        title={
          fullDaySuccess
            ? undefined
            : isFullDayEnrolled
              ? "Berhenti Full Day"
              : "Daftar Full Day"
        }
        actions={
          fullDaySuccess ? (
            <Button size="sm" onClick={closeModal}>
              Selesai
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={closeModal}
                disabled={isChangingFullDay}
              >
                Batal
              </Button>
              <Button
                size="sm"
                variant={isFullDayEnrolled ? "destructive" : "default"}
                onClick={handleFullDayToggle}
                disabled={isChangingFullDay}
              >
                {isChangingFullDay && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {isFullDayEnrolled ? "Ya, berhenti" : "Ya, daftarkan"}
              </Button>
            </>
          )
        }
      >
        {fullDaySuccess ? (
          <div className="py-2 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-lg font-bold text-primary">
              ✓
            </div>
            <h3 className="mb-2 text-base font-semibold">
              Kepesertaan diperbarui
            </h3>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              {fullDaySuccess}
            </p>
          </div>
        ) : (
          <>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              {isFullDayEnrolled
                ? "Ananda dapat mengikuti kembali program full day kapan saja di bulan berikutnya."
                : "Ananda akan mengikuti program full day mulai bulan depan. Biaya bulanan akan bertambah."}
            </p>
            {error && (
              <div className="mt-3">
                <ErrorAlert message={error} />
              </div>
            )}
          </>
        )}
      </Modal>

      {/* Bank dialog */}
      <Modal
        open={modal === "bank"}
        onClose={closeModal}
        dismissable={!isSavingBank}
        title={
          hasBankInfo
            ? "Ubah Rekening Penerimaan"
            : "Tambah Rekening Penerimaan"
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={closeModal}
              disabled={isSavingBank}
            >
              Batal
            </Button>
            <Button size="sm" onClick={handleBankSave} disabled={isSavingBank}>
              {isSavingBank && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </>
        }
      >
        <p className="mb-3 text-[13px] text-muted-foreground">
          Dana penarikan dan refund dikirim ke rekening ini.
        </p>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Bank / E-Wallet</Label>
            <Input
              value={finEnt}
              onChange={(e) => setFinEnt(e.target.value)}
              placeholder="BCA, BRI, Shopee, GoPay"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Nomor</Label>
            <Input
              value={finNum}
              onChange={(e) => setFinNum(e.target.value)}
              placeholder="123456 / 08123456"
              className="font-mono"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Atas Nama</Label>
            <Input
              value={finName}
              onChange={(e) => setFinName(e.target.value)}
              placeholder="Nama sesuai rekening"
            />
          </div>
          {error && <ErrorAlert message={error} />}
        </div>
      </Modal>
    </>
  );
}
