import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kindy Student - Miftahussalam',
  description: 'Student portal for Miftahussalam Islamic Kindy - View your contributions and manage your account',
}

export default function KindyStudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
