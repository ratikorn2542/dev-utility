import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dev Utility',
  description: 'เครื่องมือสำหรับ Developer ที่ใช้บ่อย',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  )
}
