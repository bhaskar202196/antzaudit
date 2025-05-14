// src/app/dashboard/page.tsx
"use client";
import type { Zoo } from '@/lib/types';
import ZooCard from '@/components/zoo/zoo-card';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react'; 
import { useBreadcrumbs } from '@/contexts/breadcrumb-context';
import { useZooData } from '@/contexts/zoo-data-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const { zoos, isLoading: isZooDataLoading } = useZooData();
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([]); 
  }, [setBreadcrumbs]);

  const pageLoading = isZooDataLoading || !user;

  if (pageLoading) { 
    return (
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Your Zoos</h1>
          <Skeleton className="h-10 w-36" /> {/* Create Zoo Button Skeleton */}
        </div>
        
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
    return <p>Please log in to view your zoos. Redirecting...</p>;
  }

  const userZoos = zoos.filter(zoo => zoo.userId === user.id);

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-4xl font-bold tracking-tight text-gray-800">Your Zoos</h1>
        <Button asChild size="lg">
          <Link href="/zoos/create">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Zoo
          </Link>
        </Button>
      </div>
      
      {userZoos.length === 0 ? (
        <p className="text-lg text-muted-foreground mt-6">You have no zoos yet. Click "Create New Zoo" to get started.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8 mt-6">
          {userZoos.map(zoo => (
            <ZooCard key={zoo.id} zoo={zoo} />
          ))}
        </div>
      )}
    </div>
  );
}
