
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '../components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OLKA Backoffice - Premium Mağaza Yönetim Sistemi',
  description: 'OLKA premium mağaza backoffice uygulaması - Müşteri, görev ve kullanıcı yönetimi',
  keywords: 'olka, backoffice, mağaza, yönetim, premium',
  authors: [{ name: 'OLKA Tech Team' }],
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
