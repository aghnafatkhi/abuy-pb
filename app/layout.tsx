import type {Metadata} from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Photobooth Abuy',
  description: 'Aplikasi photobooth online dengan mode solo dan multiplayer 2 orang.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="id" className={`${jakarta.variable} ${mono.variable}`}>
      <body className="font-sans antialiased text-neutral-900 bg-neutral-95" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

