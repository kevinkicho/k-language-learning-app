import type { Metadata } from 'next'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

export const metadata: Metadata = {
  title: 'LingoQuiz - AI-Powered Language Learning',
  description: 'Learn languages with interactive quizzes, translations, and audio pronunciation',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    apple: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-light">
        <main className="min-vh-100">
          {children}
        </main>
      </body>
    </html>
  )
} 