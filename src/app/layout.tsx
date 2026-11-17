import type { Metadata } from 'next'
import { Newsreader, Inter, JetBrains_Mono } from 'next/font/google'
import { AccountStart } from '@/components/account/AccountStart'
import { BRAND } from '@/lib/brand'
import './globals.css'
import 'katex/dist/katex.min.css'

const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: `${BRAND}: Class 11 and 12 chemistry in Animations and Simulations`,
  description:
    'A free, visual-first site for Class 11 and 12 chemistry. It follows the NCERT syllabus Section by Section, with Animations to scroll through and Simulations to run.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${newsreader.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <AccountStart />
        {children}
      </body>
    </html>
  )
}
