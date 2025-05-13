import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter for a modern look
import './globals.css';
import { AuthProvider } from '@/hooks/use-auth';
import { BreadcrumbProvider } from '@/contexts/breadcrumb-context';
import { MainAppLayout } from '@/components/layout/main-app-layout';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Ants Zoo Audit System',
  description: 'Efficiently audit and verify animals in your zoo.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <BreadcrumbProvider>
            <MainAppLayout>{children}</MainAppLayout>
          </BreadcrumbProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
