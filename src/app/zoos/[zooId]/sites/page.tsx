// src/app/zoos/[zooId]/sites/page.tsx
"use client";
import type { Site, Zoo } from '@/lib/types';
import { getZooById } from '@/lib/data';
import SiteCard from '@/components/zoo/site-card';
import { use, useEffect, useState } from 'react'; // Added 'use'
import { useBreadcrumbs, type BreadcrumbItem } from '@/contexts/breadcrumb-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';

interface ZooSitesPageProps {
  params: Promise<{ zooId: string }>; // Updated type to Promise
}

export default function ZooSitesPage({ params: paramsPromise }: ZooSitesPageProps) {
  const params = use(paramsPromise); // Unwrap params using React.use()
  const { zooId } = params;

  const [zoo, setZoo] = useState<Zoo | null | undefined>(null); // null for loading, undefined for not found
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    const currentZoo = getZooById(zooId);
    setZoo(currentZoo);

    if (currentZoo) {
      const breadcrumbsData: BreadcrumbItem[] = [
        { label: currentZoo.name, href: `/zoos/${zooId}/sites` },
      ];
      setBreadcrumbs(breadcrumbsData);
    } else {
      setBreadcrumbs([{ label: "Zoo Not Found", href: `/dashboard` }]);
    }
  }, [zooId, setBreadcrumbs]);

  if (zoo === null) { // Loading state
    return (
      <div>
        <Skeleton className="h-10 w-1/2 mb-2" />
        <Skeleton className="h-8 w-1/3 mb-8" />
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

  if (zoo === undefined) { // Not found state
    return (
      <div className="flex flex-col items-center justify-center text-center py-10">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold mb-2">Zoo Not Found</h1>
        <p className="text-muted-foreground mb-6">The zoo you are looking for does not exist or you do not have permission to view it.</p>
        <Button asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <Button asChild variant="outline" className="mb-6">
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Zoos
        </Link>
      </Button>
      <h1 className="text-4xl font-bold mb-2 tracking-tight text-gray-800">{zoo.name}</h1>
      <p className="text-xl text-muted-foreground mb-8">Sites within this Zoo</p>
      
      {zoo.sites.length === 0 ? (
        <p className="text-lg text-muted-foreground">This zoo has no sites configured yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
          {zoo.sites.map(site => (
            <SiteCard key={site.id} site={site} zooId={zoo.id} />
          ))}
        </div>
      )}
    </div>
  );
}
