// src/app/dashboard/page.tsx
"use client";
import type { Zoo } from '@/lib/types';
import ZooCard from '@/components/zoo/zoo-card';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react'; // Removed useState as zoos come from context
import { useBreadcrumbs } from '@/contexts/breadcrumb-context';
import { useZooData } from '@/contexts/zoo-data-context'; // Import useZooData
import CsvUpload from '@/components/csv/csv-upload'; // Import CsvUpload
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';


export default function DashboardPage() {
  const { user } = useAuth();
  const { zoos, isLoading: isZooDataLoading } = useZooData(); // Get zoos and loading state from context
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([]); 
  }, [setBreadcrumbs]);

  const loading = isZooDataLoading || !user; // Consider auth loading as well if it exists

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8 tracking-tight">Your Zoos</h1>
        <CsvUpload /> {/* Show CSV upload even when loading initial data */}
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
    return <p>Please log in to view your zoos. Redirecting...</p>;
  }

  // Filter zoos for the current user from the context's zoos array
  const userZoos = zoos.filter(zoo => zoo.userId === user.id);

  return (
    <div className="animate-fadeIn">
      <h1 className="text-4xl font-bold mb-6 tracking-tight text-gray-800">Your Zoos</h1>
      <CsvUpload />
      {userZoos.length === 0 ? (
        <p className="text-lg text-muted-foreground mt-6">You are not associated with any zoos yet, or no data has been loaded. Try uploading a CSV.</p>
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
