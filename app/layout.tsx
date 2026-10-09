import './globals.css'
import type { Metadata } from 'next'
import AcquisitionCapture from '@/components/AcquisitionCapture'
import PublicJoinEntry from '@/components/PublicJoinEntry'

export const metadata: Metadata = {
  title: 'Flux | Audio for Sleep and Study',
  description:
    'Explore Flux personalized audio for sleep and study. Join Mina Tests: community experiments into sleep, sound and cognition.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body><AcquisitionCapture />{children}<PublicJoinEntry /></body>
    </html>
  )
}
