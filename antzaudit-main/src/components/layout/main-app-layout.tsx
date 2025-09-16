// src/components/layout/main-app-layout.tsx
"use client";
import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import AppBar from './app-bar';
import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Skeleton } from "@/components/ui/skeleton";

export function MainAppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, loading, logout } // Removed router from here as it's used in useAuth
    = useAuth(); 
  const router = useRouter(); // Get router here for redirection logic if needed outside useAuth

  const publicPaths = ['/login'];
  const isPublicPage = publicPaths.includes(pathname);

  useEffect(() => {
    if (!loading && !user && !isPublicPage) {
      // This is a fallback, middleware should primarily handle this.
      // However, client-side check ensures consistency if middleware fails or for edge cases.
      router.replace('/login');
    }
  }, [loading, user, isPublicPage, router, pathname]);


  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Skeleton className="h-16 w-full" />
        <div className="flex-1 container mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-8 w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isPublicPage) {
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }
  
  // Ensure user is loaded and present for protected pages
  if (!user) {
     // This case should ideally be handled by redirection from useEffect or middleware.
     // Return a loading or minimal state to prevent flashing content.
    return (
      <div className="flex h-screen items-center justify-center">
         <p>Redirecting to login...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppBar />
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
      <Toaster />
    </div>
  );
}
