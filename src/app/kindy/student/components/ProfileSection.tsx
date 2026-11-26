"use client";

import { useEffect, useState } from "react";
import { KindyStudent, FacilityInfo } from "@/lib/types";
import {
  addressOf,
  formatAge,
  formatCalendarDate,
  formatCurrency,
  formatPhone,
} from "@/lib/utils";
import kindyStudentApi, { ApiError, orgApi } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Loader2,
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

/**
 * A label / value row with a bottom divider. The last row of its group drops
 * the divider by itself (`last:`), so a group of optional rows never has to
 * work out which of them ends up last.
 *
 * `wrap` is for a value with no spaces to break at (an email address): it
 * drops under the label when the two don't fit side by side, and only breaks
 * inside the value when even a full line is too narrow for it.
 */
function Row({
  label,
  value,
  mono = false,
  wrap = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  wrap?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-b-0 ${
        wrap ? "flex-wrap gap-y-0.5" : ""
      }`}
    >
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span
        className={`text-sm font-medium text-right ${mono ? "font-mono" : ""} ${
          wrap ? "ml-auto min-w-0 break-words" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * One entry inside the Fasilitas card. The icon tile + bold title is what
 * separates each facility from the next, so several of them don't read as one
 * continuous list of rows.
 */
function FacilityItem({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-start gap-3">
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
      </div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

/** `flush` drops the bottom margin, for a label sharing its line with a button. */
const MicroLabel = ({
  children,
  flush = false,
}: {
  children: React.ReactNode;
  flush?: boolean;
}) => (
  <p
    className={`${
      flush ? "" : "mb-1 "
    }text-xs font-semibold uppercase tracking-[0.04em] text-muted-foreground`}
  >
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
  const [modal, setModal] = useState<null | "bank">(null);
  const [finEnt, setFinEnt] = useState(profile.finEnt || "");
  const [finNum, setFinNum] = useState(profile.finNum || "");
  const [finName, setFinName] = useState(profile.finName || "");
  const [error, setError] = useState<string | null>(null);
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [showWifiPass, setShowWifiPass] = useState(false);
  const [wifiCopied, setWifiCopied] = useState(false);

  const { data: facility, isLoading: isLoadingFacility } = useApi<FacilityInfo>(
    () => orgApi.getFacility(),
  );

  const wifi = facility?.wifi?.ssid ? facility.wifi : null;
  const showFacilities = !isLoadingFacility && !!wifi;

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

  const hasBankInfo = !!(profile.finEnt && profile.finNum && profile.finName);
  const age = profile.birthDate ? formatAge(profile.birthDate) : null;

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

  const closeModal = () => {
    setModal(null);
    setError(null);
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

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Data Santri — what stays true of the child. The class and academic
            year change every year and already sit in the top bar under the
            name, so they are not repeated here. */}
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
            {profile.birthDate && (
              <>
                <Row
                  label="Tanggal Lahir"
                  value={formatCalendarDate(profile.birthDate)}
                />
                {age && <Row label="Umur" value={age} />}
              </>
            )}
          </CardContent>
        </Card>

        {/* Wali Santri — the guardian, then the account that savings withdrawals
            and refunds are paid to. Name and email come from the admission
            form, so a student without one shows only the phone (the WhatsApp
            number the portal link is sent to). The account group is always
            there, because the withdraw flow sends parents here to fill it. */}
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle>Wali Santri</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-3">
            {(profile.guardianName || profile.phone || profile.email) && (
              <div>
                {profile.guardianName && (
                  <Row label="Nama" value={profile.guardianName} />
                )}
                {profile.phone && (
                  <Row
                    label="Nomor Telepon"
                    value={formatPhone(profile.phone)}
                    mono
                    wrap
                  />
                )}
                {profile.email && (
                  <Row label="Email" value={profile.email} wrap />
                )}
              </div>
            )}
            <div>
              <div className="flex items-center justify-between gap-3">
                <MicroLabel flush>Rekening penerimaan</MicroLabel>
                <Button size="sm" variant="outline" onClick={openBankModal}>
                  {hasBankInfo ? "Ubah" : "Tambah"}
                </Button>
              </div>
              <p className="mb-2 mt-1.5 text-xs leading-relaxed text-muted-foreground">
                Digunakan untuk penarikan tabungan atau refund. Verifikasi
                selalu dilakukan sebelum transfer.
              </p>
              {hasBankInfo ? (
                <>
                  <Row label="Bank / E-Wallet" value={profile.finEnt} />
                  <Row label="Nomor" value={profile.finNum} mono />
                  <Row label="Atas Nama" value={profile.finName} />
                </>
              ) : (
                <p className="py-4 text-center text-[13px] text-muted-foreground">
                  Belum ada rekening penerimaan.
                </p>
              )}
            </div>
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
            </CardContent>
          </Card>
        )}

      </div>

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
