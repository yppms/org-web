"use client";

import { kindyAdminApi } from "@/lib/api";
import GroupedListSection, { GroupedListItem } from "@/components/GroupedListSection";

interface StudentSaving {
  id: string;
  name: string;
  class: string | null;
  totalSaving: number;
  transactionCount: number;
  lastTransaction: string | null;
  no: number;
}

const mapItem = (s: StudentSaving): GroupedListItem => ({
  id: s.id,
  name: s.name,
  class: s.class,
  total: s.totalSaving,
  count: s.transactionCount,
  last: s.lastTransaction,
  no: s.no,
});

export default function SavingSection() {
  return (
    <GroupedListSection<StudentSaving>
      title="Tabungan Siswa"
      subtitle="Saldo tabungan dan riwayat transaksi semua siswa"
      fetcher={() => kindyAdminApi.getAllSavings()}
      mapItem={mapItem}
      fallbackMessage="Gagal memuat data tabungan"
      labels={{
        totalStat: "Total Tabungan",
        activeStat: "Penabung Aktif",
        amountSort: "Jumlah",
        lastSort: "Transaksi Terakhir",
        balanceRow: "Saldo:",
        countRow: "Transaksi:",
        emptyItem: "Belum menabung",
        noData: "Tidak ada data tabungan",
      }}
    />
  );
}
