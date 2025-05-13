// src/app/zoos/[zooId]/sites/[siteId]/enclosures/page.tsx
"use client";
import type { Enclosure, Site, Zoo } from '@/lib/types';
import { getZooById, getSiteById } from '@/lib/data';
import EnclosureCard from '@/components/zoo/enclosure-card';
import { useEffect, useState } from 'react';
import { useBreadcrumbs, type BreadcrumbItem } from '@/contexts/breadcrumb-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';

interface EnclosureListPageProps {
  params: { zooId: string; siteId: string };
}

export default function EnclosureListPage({ params }: EnclosureListPageProps) {
  const { zooId, siteId } = params;
  const [zoo, setZoo] = useState<Zoo | null | undefined>(null);
  const [site, setSite] = useState<Site | null | undefined>(null);
  
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    const currentZoo = getZooById(zooId);
    setZoo(currentZoo);
    if (currentZoo) {
      const currentSite = getSiteById(currentZoo, siteId);
      setSite(currentSite);
      
      if (currentSite) {
        const breadcrumbsData: BreadcrumbItem[] = [
          { label: currentZoo.name, href: `/zoos/${zooId}/sites` },
          { label: currentSite.name, href: `/zoos/${zooId}/sites/${siteId}/enclosures` },
        ];
        setBreadcrumbs(breadcrumbsData);
      } else {
         setBreadcrumbs([
          { label: currentZoo.name, href: `/zoos/${zooId}/sites` },
          { label: "Site Not Found", href: `/zoos/${zooId}/sites` }
        ]);
      }
    } else {
      setBreadcrumbs([{label: "Zoo Not Found", href: "/dashboard"}]);
    }
  }, [zooId, siteId, setBreadcrumbs]);

  if (zoo === null || site === null) { // Loading state
     return (
      <div>
        <Skeleton className="h-10 w-1/2 mb-2" />
        <Skeleton className="h-8 w-1/3 mb-2" />
        <Skeleton className="h-6 w-1/4 mb-8" />
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
              </CardFooter>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (zoo === undefined || site === undefined) { // Not found state
    return (
      <div className="flex flex-col items-center justify-center text-center py-10">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold mb-2">Content Not Found</h1>
        <p className="text-muted-foreground mb-6">The zoo or site you are looking for does not exist.</p>
        <Button asChild>
          <Link href={zoo ? `/zoos/${zoo.id}/sites` : "/dashboard"}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <Button asChild variant="outline" className="mb-6">
        <Link href={`/zoos/${zooId}/sites`}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sites in {zoo.name}
        </Link>
      </Button>
      <h1 className="text-4xl font-bold mb-2 tracking-tight text-gray-800">{site.name}</h1>
      <p className="text-xl text-muted-foreground mb-8">Enclosures in this Site</p>

      {site.enclosures.length === 0 ? (
        <p className="text-lg text-muted-foreground">This site has no enclosures configured yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
          {site.enclosures.map(enclosure => (
            <EnclosureCard key={enclosure.id} enclosure={enclosure} zooId={zooId} siteId={siteId} />
          ))}
        </div>
      )}
    </div>
  );
}
