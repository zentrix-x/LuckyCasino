import type React from "react"
import type { Metadata } from "next"
import { Space_Grotesk, DM_Sans } from "next/font/google"
import { AuthProvider } from "@/hooks/use-auth"
import { GameEngineProvider } from "@/hooks/use-game-engine"
import { AdminProvider } from "@/hooks/use-admin"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/lib/theme-provider"
import { initializeQueueProcessors } from '@/lib/queue-processors'
import "./globals.css"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
})

// Initialize background processors for high scalability
if (typeof window === 'undefined') {
  // Server-side initialization
  initializeQueueProcessors()
}

export const metadata: Metadata = {
  title: "Lucky Casino - Play 7Up 7Down, Spin & Win, Lottery",
  description: "Experience the thrill of casino games with real-time results",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${dmSans.variable} antialiased`}>
      <body>
        <ThemeProvider defaultTheme="dark" storageKey="casino-theme">
          <AuthProvider>
            <GameEngineProvider>
              <AdminProvider>
                {children}
                <Toaster />
              </AdminProvider>
            </GameEngineProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
