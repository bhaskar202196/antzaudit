
// src/app/zoos/[zooId]/report/page.tsx
"use client";
import type { Enclosure, Zoo } from '@/lib/types';
import { use, useEffect, useState } from 'react';
import { useBreadcrumbs, type BreadcrumbItem } from '@/contexts/breadcrumb-context';
import { useZooData } from '@/contexts/zoo-data-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle, ListChecks, Building, Layers3, Fence } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface ZooReportPageProps {
  params: Promise<{ zooId: string }>;
}

const getEnclosureAuditStatus = (enclosure: Enclosure) => {
  const totalAnimals = enclosure.animals.length;
  const verifiedAnimals = enclosure.animals.filter(a => a.verified).length;
  const progress = totalAnimals > 0 ? (verifiedAnimals / totalAnimals) * 100 : 0;
  return { totalAnimals, verifiedAnimals, progress };
};

export default function ZooReportPage({ params: paramsPromise }: ZooReportPageProps) {
  const params = use(paramsPromise);
  const { zooId } = params;

  const { getZooById: getZooByIdFromContext, isLoading: isZooDataLoading } = useZooData();
  const [zoo, setZoo] = useState<Zoo | null | undefined>(null);
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    const currentZoo = getZooByIdFromContext(zooId);
    setZoo(currentZoo);

    if (currentZoo) {
      const breadcrumbsData: BreadcrumbItem[] = [
        { label: currentZoo.name, href: `/zoos/${zooId}/sites` },
        { label: "Audit Report", href: `/zoos/${zooId}/report` },
      ];
      setBreadcrumbs(breadcrumbsData);
    } else if (!isZooDataLoading) {
      setZoo(undefined);
      setBreadcrumbs([{ label: "Zoo Not Found", href: `/dashboard` }, { label: "Audit Report", href: `/dashboard` }]);
    }
  }, [zooId, getZooByIdFromContext, setBreadcrumbs, isZooDataLoading]);

  if (isZooDataLoading || zoo === null) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" /> {/* Back button skeleton */}
        <Skeleton className="h-12 w-3/4 mb-4" /> {/* Title skeleton */}
        {[1, 2].map(siteIdx => (
          <Card key={siteIdx}>
            <CardHeader>
              <Skeleton className="h-8 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1,2].map(sectionIdx => (
                <div key={sectionIdx}>
                  <Skeleton className="h-6 w-1/3 mb-2" />
                  <Skeleton className="h-24 w-full" /> {/* Table skeleton */}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (zoo === undefined) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-10">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold mb-2">Zoo Not Found</h1>
        <p className="text-muted-foreground mb-6">The zoo you are looking for does not exist or could not be loaded.</p>
        <Button asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-8">
      <Button asChild variant="outline">
        <Link href={`/zoos/${zooId}/sites`}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sites in {zoo.name}
        </Link>
      </Button>

      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-gray-800 flex items-center">
          <ListChecks className="mr-3 h-10 w-10 text-primary" />
          Audit Report for {zoo.name}
        </h1>
        <p className="text-xl text-muted-foreground mt-1">Summary of animal verification status by enclosure. Click on sites and sections to expand.</p>
      </header>

      {zoo.sites.length === 0 ? (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-muted-foreground">No Sites Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">This zoo has no sites configured to report on.</p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="w-full space-y-4">
          {zoo.sites.map(site => (
            <AccordionItem key={site.id} value={`site-${site.id}`} className="border rounded-lg shadow-md bg-card">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <h2 className="text-2xl font-semibold flex items-center text-primary">
                  <Building className="mr-3 h-6 w-6" />
                  Site: {site.name}
                </h2>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-2">
                {site.sections.length === 0 ? (
                  <p className="text-muted-foreground">This site has no sections.</p>
                ) : (
                  <Accordion type="multiple" className="w-full space-y-3">
                    {site.sections.map(section => (
                      <AccordionItem key={section.id} value={`section-${section.id}`} className="border rounded-md bg-background">
                        <AccordionTrigger className="px-4 py-3 hover:no-underline">
                          <h3 className="text-xl font-medium flex items-center text-foreground">
                            <Layers3 className="mr-2 h-5 w-5 text-secondary-foreground" />
                            Section: {section.name}
                          </h3>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 pt-1">
                          {section.enclosures.length === 0 ? (
                            <p className="text-sm text-muted-foreground pl-7">This section has no enclosures.</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-[40%]">Enclosure Name</TableHead>
                                    <TableHead className="text-center">Verified / Total</TableHead>
                                    <TableHead className="w-[30%] text-center">Verification Progress</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {section.enclosures.map(enclosure => {
                                    const { totalAnimals, verifiedAnimals, progress } = getEnclosureAuditStatus(enclosure);
                                    return (
                                      <TableRow key={enclosure.id}>
                                        <TableCell className="font-medium flex items-center">
                                          <Fence className="mr-2 h-4 w-4 text-muted-foreground" />
                                          {enclosure.name}
                                        </TableCell>
                                        <TableCell className="text-center">
                                          {verifiedAnimals} / {totalAnimals}
                                        </TableCell>
                                        <TableCell>
                                          <Progress value={progress} className="w-full h-3" aria-label={`${progress.toFixed(0)}% verified`} />
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
