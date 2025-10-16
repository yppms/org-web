import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Student Portal - Miftahussalam Islamic Kindy',
  description: "Access student records: invoices, payment confirmation, savings, infaqs, announcements, and many more"
}

export default function KindyStudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
