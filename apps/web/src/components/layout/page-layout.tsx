import { ReactNode } from 'react';
import { Navbar } from './navbar';
import { Footer } from './footer';
import { CategoryNav } from './category-nav';
import { TopBar } from './top-bar';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
  showNavbar?: boolean;
  showFooter?: boolean;
  showCategoryNav?: boolean;
}

export function PageLayout({
  children,
  className = '',
  showNavbar = true,
  showFooter = true,
  showCategoryNav = true,
}: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {showNavbar && (
        <>
          <TopBar />
          <Navbar />
          {showCategoryNav && <CategoryNav />}
        </>
      )}
      <main className={`flex-1 ${className}`}>{children}</main>
      {showFooter && <Footer />}
    </div>
  );
}
