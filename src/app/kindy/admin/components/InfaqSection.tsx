"use client";

import { kindyAdminApi } from "@/lib/api";
import GroupedListSection, { GroupedListItem } from "@/components/GroupedListSection";

interface StudentInfaq {
  id: string;
  name: string;
  class: string | null;
  totalInfaq: number;
  contributionCount: number;
  lastContribution: string | null;
  no: number;
}

const mapItem = (s: StudentInfaq): GroupedListItem => ({
  id: s.id,
  name: s.name,
  class: s.class,
  total: s.totalInfaq,
  count: s.contributionCount,
  last: s.lastContribution,
  no: s.no,
});

export default function InfaqSection() {
  return (
    <GroupedListSection<StudentInfaq>
      title="Infaq Siswa"
      subtitle="Riwayat infaq dan donasi semua siswa"
      fetcher={() => kindyAdminApi.getAllInfaq()}
      mapItem={mapItem}
      fallbackMessage="Gagal memuat data infaq"
      labels={{
        totalStat: "Total Infaq",
        activeStat: "Kontributor",
        amountSort: "Jumlah",
        lastSort: "Infaq Terakhir",
        balanceRow: "Total:",
        countRow: "Kontribusi:",
        emptyItem: "Belum berinfaq",
        noData: "Tidak ada data infaq",
      }}
    />
  );
}
