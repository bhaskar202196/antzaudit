// src/components/layout/app-bar.tsx
"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { LogOut, ChevronRight, Home } from 'lucide-react';
import { useBreadcrumbs } from '@/contexts/breadcrumb-context';
import { usePathname } from 'next/navigation';

export default function AppBar() {
  const { user, logout } = useAuth();
  const { breadcrumbs } = useBreadcrumbs();
  const pathname = usePathname();

  const isDashboard = pathname === '/dashboard';

  return (
    <header className="bg-primary text-primary-foreground shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="text-xl font-bold hover:opacity-80 transition-opacity flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-accent"><path d="m15.97 12.5-1.69 2.71a2.07 2.07 0 0 0 3.44 1.5L20.3 14Z"/><path d="m8.03 12.5 1.69 2.71a2.07 2.07 0 0 1-3.44 1.5L3.7 14Z"/><path d="M11.28 5.42D11.63 5 12 5h.03c.34 0 .68.42.97.83l3.16 4.17a2.08 2.08 0 0 1-.01 2.63l-1.69 2.71a2.08 2.08 0 0 1-3.44-1.5V5.42Z"/><path d="M12.72 5.42D12.37 5 12 5h-.03c-.34 0-.68.42-.97.83L8.77 10a2.08 2.08 0 0 0 .01 2.63l1.69 2.71a2.08 2.08 0 0 0 3.44-1.5V5.42Z"/></svg>
            Ants Zoo Audit
          </Link>
          {!isDashboard && breadcrumbs.length > 0 && (
            <nav aria-label="breadcrumb" className="hidden sm:block">
              <ol className="flex items-center space-x-1 text-sm">
                <li>
                  <Link href="/dashboard" className="hover:underline opacity-80 hover:opacity-100">
                    <Home size={16} className="inline-block mr-1" />
                    Dashboard
                  </Link>
                </li>
                {breadcrumbs.map((crumb, index) => (
                  <li key={index} className="flex items-center">
                    <ChevronRight size={16} className="mx-1 opacity-70" />
                    {index === breadcrumbs.length - 1 ? (
                      <span className="font-semibold text-primary-foreground">{crumb.label}</span>
                    ) : (
                      <Link href={crumb.href} className="hover:underline opacity-80 hover:opacity-100">
                        {crumb.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}
        </div>
        {user && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={logout} 
            className="hover:bg-primary/80 focus-visible:ring-offset-primary focus-visible:ring-primary-foreground text-primary-foreground"
            aria-label="Logout"
          >
            <LogOut size={18} className="mr-0 sm:mr-2" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        )}
      </div>
    </header>
  );
}
