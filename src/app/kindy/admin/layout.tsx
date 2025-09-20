import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kindy Admin - Miftahussalam',
  description: 'Admin portal for Miftahussalam Islamic Kindy - Manage student WhatsApp tasks and administrative operations',
}

export default function KindyAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}