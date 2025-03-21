import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Non-Towered Airport Safety System',
  description: 'Real-time safety monitoring for non-towered airports',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
          <header className="bg-blue-600 dark:bg-blue-800 text-white shadow-md">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
              <h1 className="text-xl font-bold">Non-Towered Airport Safety System</h1>
              <nav className="flex space-x-4">
                <a href="/" className="hover:underline">Dashboard</a>
                <a href="/airports" className="hover:underline">Airports</a>
                <a href="/advisories" className="hover:underline">Advisories</a>
                <a href="/settings" className="hover:underline">Settings</a>
              </nav>
            </div>
          </header>
          <main className="container mx-auto px-4 py-6">
            {children}
          </main>
          <footer className="bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 py-4">
            <div className="container mx-auto px-4 text-center">
              <p>&copy; {new Date().getFullYear()} Non-Towered Airport Safety System</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
} 