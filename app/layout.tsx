import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { BundleProvider } from '@/components/bundles/BundleContext'
import BundleTray from '@/components/bundles/BundleTray'
import { AuthProvider } from '@/contexts/AuthContext'
import AuthModal from '@/components/auth/AuthModal'
import { Analytics } from '@vercel/analytics/react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Outfittr - Buy & Sell Unique Fashion',
  description: "Kenya's leading marketplace for secondhand fashion, vintage finds, and unique styles",
  keywords: ['thrift', 'secondhand', 'fashion', 'kenya', 'marketplace', 'vintage'],
  authors: [{ name: 'Outfittr' }],
  openGraph: {
    title: 'Outfittr - Buy & Sell Unique Fashion',
    description: "Kenya's leading marketplace for secondhand fashion",
    type: 'website',
    locale: 'en_KE',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com',
    siteName: 'Outfittr',
    images: [
      {
        url: '/og-image.jpg', // Create this image (1200x630px)
        width: 1200,
        height: 630,
        alt: 'Outfittr - Buy & Sell Unique Fashion',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Outfittr - Buy & Sell Unique Fashion',
    description: "Kenya's leading marketplace for secondhand fashion",
    images: ['/og-image.jpg'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <BundleProvider>
            {children}
            <BundleTray />
            <AuthModal />
          </BundleProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}

