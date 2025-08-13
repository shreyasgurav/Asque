import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
  showHeader?: boolean;
}

export default function Layout({ children, showFooter = true, showHeader = true }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-x-hidden">
      {showHeader && <Header />}
      <main className={showHeader ? 'pt-16' : ''}>
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
} 