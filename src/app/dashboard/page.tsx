// src/app/dashboard/page.tsx
"use client";
import type { Zoo } from '@/lib/types';
import { getZoosByUserId } from '@/lib/data';
import ZooCard from '@/components/zoo/zoo-card';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import { useBreadcrumbs } from '@/contexts/breadcrumb-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';

export default function DashboardPage() {
  const { user } = useAuth();
  const [zoos, setZoos] = useState<Zoo[]>([]);
  const [loading, setLoading] = useState(true);
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([]); // No breadcrumbs on dashboard itself, or [{ label: 'Dashboard', href: '/dashboard' }]
  }, [setBreadcrumbs]);

  useEffect(() => {
    if (user) {
      const userZoos = getZoosByUserId(user.id);
      setZoos(userZoos);
      setLoading(false);
    } else {
      // If no user, set loading to false to prevent infinite loading state
      // Auth checks and middleware should handle redirection
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8 tracking-tight">Your Zoos</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="flex flex-col">
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-7 w-3/4 mb-2" />
                <Skeleton className="h-5 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  if (!user) {
    // This should ideally not be reached due to auth checks and middleware
    // but can be shown briefly if there's a delay in redirection or if auth state is invalid.
    return <p>Please log in to view your zoos. Redirecting...</p>;
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="text-4xl font-bold mb-8 tracking-tight text-gray-800">Your Zoos</h1>
      {zoos.length === 0 ? (
        <p className="text-lg text-muted-foreground">You are not associated with any zoos yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
          {zoos.map(zoo => (
            <ZooCard key={zoo.id} zoo={zoo} />
          ))}
        </div>
      )}
    </div>
  );
}
