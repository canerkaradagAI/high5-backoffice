
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '../components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'High5 Backoffice - Premium Mağazacılık Yönetim Sistemi',
  description: 'High5 premium mağazacılık backoffice uygulaması - Müşteri, görev ve kullanıcı yönetimi',
  keywords: 'high5, backoffice, mağazacılık, yönetim, premium',
  authors: [{ name: 'High5 Tech Team' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
