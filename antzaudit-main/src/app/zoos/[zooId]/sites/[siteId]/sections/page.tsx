// src/app/zoos/[zooId]/sites/[siteId]/sections/page.tsx
"use client";
import type { Site, Zoo, Section } from '@/lib/types'; 
import SectionCard from '@/components/zoo/section-card';
import { use, useEffect, useState } from 'react'; 
import { useBreadcrumbs, type BreadcrumbItem } from '@/contexts/breadcrumb-context';
import { useZooData } from '@/contexts/zoo-data-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';

interface SectionListPageProps {
  params: Promise<{ zooId: string; siteId: string }>; 
}

export default function SectionListPage({ params: paramsPromise }: SectionListPageProps) {
  const params = use(paramsPromise); 
  const { zooId, siteId } = params;

  const { getSiteById: getSiteByIdFromContext, getZooById: getZooByIdFromContext, isLoading: isZooDataLoading } = useZooData();
  const [zoo, setZoo] = useState<Zoo | null | undefined>(null);
  const [site, setSite] = useState<Site | null | undefined>(null);
  
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    const currentZoo = getZooByIdFromContext(zooId);
    setZoo(currentZoo);

    if (currentZoo) {
      const currentSite = getSiteByIdFromContext(zooId, siteId);
      setSite(currentSite);
      
      if (currentSite) {
        const breadcrumbsData: BreadcrumbItem[] = [
          { label: currentZoo.name, href: `/zoos/${zooId}/sites` },
          { label: currentSite.name, href: `/zoos/${zooId}/sites/${siteId}/sections` },
        ];
        setBreadcrumbs(breadcrumbsData);
      } else if (!isZooDataLoading) {
        setSite(undefined); 
        setBreadcrumbs([
          { label: currentZoo.name, href: `/zoos/${zooId}/sites` },
          { label: "Site Not Found", href: `/zoos/${zooId}/sites` }
        ]);
      }
    } else if (!isZooDataLoading) {
        setZoo(undefined); 
        setBreadcrumbs([{label: "Zoo Not Found", href: "/dashboard"}]);
    }
  }, [zooId, siteId, getSiteByIdFromContext, getZooByIdFromContext, setBreadcrumbs, isZooDataLoading]);

  if (isZooDataLoading || zoo === null || (zoo && site === null)) {
     return (
      <div>
        <Skeleton className="h-10 w-36 mb-6" /> {/* Back button */}
        <Skeleton className="h-10 w-1/2 mb-2" /> {/* Title */}
        <Skeleton className="h-8 w-1/3 mb-2" /> {/* Subtitle */}
        <Skeleton className="h-6 w-1/4 mb-8" /> {/* Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="flex flex-col">
              <Skeleton className="h-48 w-full" />
              <CardHeader><Skeleton className="h-7 w-3/4 mb-2" /><Skeleton className="h-5 w-1/2" /></CardHeader>
              <CardContent><Skeleton className="h-4 w-full mb-1" /><Skeleton className="h-4 w-5/6" /></CardContent>
              <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (zoo === undefined || site === undefined) { 
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
      <p className="text-xl text-muted-foreground mb-8">Sections within this Site</p>

      {site.sections.length === 0 ? (
        <p className="text-lg text-muted-foreground">This site has no sections configured yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
          {site.sections.map(section => (
            <SectionCard key={section.id} section={section} zooId={zooId} siteId={siteId} />
          ))}
        </div>
      )}
    </div>
  );
}
