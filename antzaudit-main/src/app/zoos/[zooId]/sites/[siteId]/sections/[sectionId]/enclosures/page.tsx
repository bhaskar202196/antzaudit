
// src/app/zoos/[zooId]/sites/[siteId]/sections/[sectionId]/enclosures/page.tsx
"use client";
import type { Section, Site, Zoo } from '@/lib/types'; // Enclosure is part of Section
import EnclosureCard from '@/components/zoo/enclosure-card';
import { use, useEffect, useState } from 'react'; 
import { useBreadcrumbs, type BreadcrumbItem } from '@/contexts/breadcrumb-context';
import { useZooData } from '@/contexts/zoo-data-context'; 
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';

interface EnclosureListPageProps {
  params: Promise<{ zooId: string; siteId: string; sectionId: string }>; 
}

export default function EnclosureListPage({ params: paramsPromise }: EnclosureListPageProps) {
  const params = use(paramsPromise); 
  const { zooId, siteId, sectionId } = params;

  const { 
    getSectionById: getSectionByIdFromContext, 
    getSiteById: getSiteByIdFromContext, 
    getZooById: getZooByIdFromContext, 
    isLoading: isZooDataLoading 
  } = useZooData();
  
  const [zoo, setZoo] = useState<Zoo | null | undefined>(null);
  const [site, setSite] = useState<Site | null | undefined>(null);
  const [section, setSection] = useState<Section | null | undefined>(null);
  
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    const currentZoo = getZooByIdFromContext(zooId);
    setZoo(currentZoo);

    if (currentZoo) {
      const currentSite = getSiteByIdFromContext(zooId, siteId);
      setSite(currentSite);
      
      if (currentSite) {
        const currentSection = getSectionByIdFromContext(zooId, siteId, sectionId);
        setSection(currentSection);
        
        if (currentSection) {
          const breadcrumbsData: BreadcrumbItem[] = [
            { label: currentZoo.name, href: `/zoos/${zooId}/sites` },
            { label: currentSite.name, href: `/zoos/${zooId}/sites/${siteId}/sections` },
            { label: currentSection.name, href: `/zoos/${zooId}/sites/${siteId}/sections/${sectionId}/enclosures` },
          ];
          setBreadcrumbs(breadcrumbsData);
        } else if (!isZooDataLoading) {
          setSection(undefined); // Section not found
          setBreadcrumbs([
            { label: currentZoo.name, href: `/zoos/${zooId}/sites` },
            { label: currentSite.name, href: `/zoos/${zooId}/sites/${siteId}/sections` },
            { label: "Section Not Found", href: `/zoos/${zooId}/sites/${siteId}/sections` }
          ]);
        }
      } else if (!isZooDataLoading) {
        setSite(undefined); // Site Not found
        setBreadcrumbs([
          { label: currentZoo.name, href: `/zoos/${zooId}/sites` },
          { label: "Site Not Found", href: `/zoos/${zooId}/sites` }
        ]);
      }
    } else if (!isZooDataLoading) {
        setZoo(undefined); // Zoo Not found
        setBreadcrumbs([{label: "Zoo Not Found", href: "/dashboard"}]);
    }
  }, [zooId, siteId, sectionId, getSectionByIdFromContext, getSiteByIdFromContext, getZooByIdFromContext, setBreadcrumbs, isZooDataLoading]);

  if (isZooDataLoading || zoo === null || (zoo && site === null) || (zoo && site && section === null)) { 
     return (
      <div>
        <Skeleton className="h-10 w-48 mb-6" /> {/* Back button skeleton to sections */}
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

  if (zoo === undefined || site === undefined || section === undefined) { 
    return (
      <div className="flex flex-col items-center justify-center text-center py-10">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold mb-2">Content Not Found</h1>
        <p className="text-muted-foreground mb-6">The zoo, site, or section you are looking for does not exist.</p>
        <Button asChild>
          <Link href={site ? `/zoos/${zooId}/sites/${siteId}/sections` : (zoo ? `/zoos/${zooId}/sites` : "/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <Button asChild variant="outline" className="mb-6">
        <Link href={`/zoos/${zooId}/sites/${siteId}/sections`}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sections in {site.name}
        </Link>
      </Button>
      <h1 className="text-4xl font-bold mb-2 tracking-tight text-gray-800">{section.name}</h1>
      <p className="text-xl text-muted-foreground mb-8">Enclosures in this Section</p>

      {section.enclosures.length === 0 ? (
        <p className="text-lg text-muted-foreground">This section has no enclosures configured yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
          {section.enclosures.map(enclosure => (
            <EnclosureCard key={enclosure.id} enclosure={enclosure} zooId={zooId} siteId={siteId} sectionId={sectionId} />
          ))}
        </div>
      )}
    </div>
  );
}
