import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { BundleProvider } from '@/components/bundles/BundleContext'
import BundleTray from '@/components/bundles/BundleTray'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import AuthModal from '@/components/auth/AuthModal'
import { Analytics } from '@vercel/analytics/react'
import RegisterServiceWorker from '@/components/pwa/RegisterServiceWorker'

const inter = Inter({ subsets: ['latin'] })

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: 'Outfittr - Buy & Sell Unique Fashion',
  description: "Kenya's leading marketplace for secondhand fashion, vintage finds, and unique styles",
  keywords: ['thrift', 'secondhand', 'fashion', 'kenya', 'marketplace', 'vintage'],
  authors: [{ name: 'Outfittr' }],
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Outfittr',
  },
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
  themeColor: '#000000',
}

const themeScript = `(function(){try{var t=localStorage.getItem('outfittr-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        <ThemeProvider>
          <AuthProvider>
            <BundleProvider>
              {children}
              <BundleTray />
              <AuthModal />
            </BundleProvider>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
        <RegisterServiceWorker />
      </body>
    </html>
  )
}

