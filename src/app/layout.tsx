import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { Bricolage_Grotesque } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/Providers"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: "InterviewIQ — AI Interview Coach",
  description: "Practice interviews with real-time AI feedback on your answers, delivery, and body language.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geist.variable} ${bricolage.variable} font-[family-name:var(--font-geist)] h-full bg-[#09090b] text-gray-100 antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
