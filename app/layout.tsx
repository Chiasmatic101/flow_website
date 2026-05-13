import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Flow | Audio for Sleep and Study',
  description:
    'Flow uses adaptive audio to help students sleep better, study deeper, and build better daily focus rhythms.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}