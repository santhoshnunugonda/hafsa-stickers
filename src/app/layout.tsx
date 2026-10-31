import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Hafsa Stickers 🐒',
  description: 'Your personal sticker collection — copy & use in WhatsApp instantly!',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'Hafsa Stickers 🐒',
    description: 'Your personal sticker collection — copy & use in WhatsApp instantly!',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 2500,
            style: {
              background: '#fff',
              color: '#333',
              border: '1px solid #f9a8d4',
              borderRadius: '12px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 500,
              boxShadow: '0 4px 20px rgba(236,72,153,0.2)',
            },
            success: {
              iconTheme: { primary: '#ec4899', secondary: '#fff' },
            },
          }}
        />
      </body>
    </html>
  )
}
