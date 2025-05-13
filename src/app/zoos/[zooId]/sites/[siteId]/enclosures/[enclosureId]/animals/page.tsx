// src/app/zoos/[zooId]/sites/[siteId]/enclosures/[enclosureId]/animals/page.tsx
"use client";
import type { Animal, Enclosure, Site, Zoo } from '@/lib/types';
import { getZooById, getSiteById, getEnclosureById } from '@/lib/data';
import AnimalListItem from '@/components/zoo/animal-list-item';
import { useEffect, useState, useCallback } from 'react';
import { useBreadcrumbs, type BreadcrumbItem } from '@/contexts/breadcrumb-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';

interface AnimalVerificationPageProps {
  params: { zooId: string; siteId: string; enclosureId: string };
}

export default function AnimalVerificationPage({ params }: AnimalVerificationPageProps) {
  const { zooId, siteId, enclosureId } = params;
  const [zoo, setZoo] = useState<Zoo | null | undefined>(null);
  const [site, setSite] = useState<Site | null | undefined>(null);
  const [enclosure, setEnclosure] = useState<Enclosure | null | undefined>(null);
  const [animals, setAnimals] = useState<Animal[]>([]);

  const { setBreadcrumbs } = useBreadcrumbs();
  const { toast } = useToast();

  useEffect(() => {
    const currentZoo = getZooById(zooId);
    setZoo(currentZoo);
    if (currentZoo) {
      const currentSite = getSiteById(currentZoo, siteId);
      setSite(currentSite);
      if (currentSite) {
        const currentEnclosure = getEnclosureById(currentSite, enclosureId);
        setEnclosure(currentEnclosure);
        if (currentEnclosure) {
          setAnimals(currentEnclosure.animals.map(a => ({...a}))); // Create a mutable copy for local state updates
          const breadcrumbsData: BreadcrumbItem[] = [
            { label: currentZoo.name, href: `/zoos/${zooId}/sites` },
            { label: currentSite.name, href: `/zoos/${zooId}/sites/${siteId}/enclosures` },
            { label: currentEnclosure.name, href: `/zoos/${zooId}/sites/${siteId}/enclosures/${enclosureId}/animals` },
          ];
          setBreadcrumbs(breadcrumbsData);
        } else {
          setBreadcrumbs([
            { label: currentZoo.name, href: `/zoos/${zooId}/sites` },
            { label: currentSite.name, href: `/zoos/${zooId}/sites/${siteId}/enclosures` },
            { label: "Enclosure Not Found", href: `/zoos/${zooId}/sites/${siteId}/enclosures` }
          ]);
        }
      } else {
         setBreadcrumbs([
          { label: currentZoo.name, href: `/zoos/${zooId}/sites` },
          { label: "Site Not Found", href: `/zoos/${zooId}/sites` }
        ]);
      }
    } else {
      setBreadcrumbs([{label: "Zoo Not Found", href: "/dashboard"}]);
    }
  }, [zooId, siteId, enclosureId, setBreadcrumbs]);

  const handleToggleVerify = useCallback((animalId: string) => {
    setAnimals(prevAnimals =>
      prevAnimals.map(animal => {
        if (animal.id === animalId) {
          const updatedAnimal = { ...animal, verified: !animal.verified };
          toast({
            title: `Animal ${updatedAnimal.verified ? 'Verified' : 'Unverified'}`,
            description: `${updatedAnimal.name} (${updatedAnimal.species}) status updated.`,
            variant: updatedAnimal.verified ? 'default' : 'default', // 'default' for green using accent, or custom variant
            className: updatedAnimal.verified ? 'bg-accent text-accent-foreground border-accent' : 'bg-secondary text-secondary-foreground'
          });
          return updatedAnimal;
        }
        return animal;
      })
    );
    // In a real app, you would also persist this change to the backend.
  }, [toast]);
  
  if (zoo === null || site === null || enclosure === null) { // Loading state
    return (
      <div>
        <Skeleton className="h-10 w-3/4 mb-2" />
        <Skeleton className="h-8 w-1/2 mb-2" />
        <Skeleton className="h-6 w-1/3 mb-2" />
        <Skeleton className="h-6 w-1/4 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (zoo === undefined || site === undefined || enclosure === undefined) { // Not found state
     return (
      <div className="flex flex-col items-center justify-center text-center py-10">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold mb-2">Content Not Found</h1>
        <p className="text-muted-foreground mb-6">The requested zoo, site, or enclosure could not be found.</p>
        <Button asChild>
          <Link href={site ? `/zoos/${zooId}/sites/${siteId}/enclosures` : (zoo ? `/zoos/${zooId}/sites` : "/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <Button asChild variant="outline" className="mb-6">
        <Link href={`/zoos/${zooId}/sites/${siteId}/enclosures`}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Enclosures in {site.name}
        </Link>
      </Button>
      <h1 className="text-4xl font-bold mb-2 tracking-tight text-gray-800">{enclosure.name}</h1>
      <p className="text-xl text-muted-foreground mb-8">Animals for Verification</p>
      
      {animals.length === 0 ? (
        <p className="text-lg text-muted-foreground">This enclosure has no animals listed for verification.</p>
      ) : (
        <div className="space-y-4">
          {animals.map(animal => (
            <AnimalListItem key={animal.id} animal={animal} onToggleVerify={handleToggleVerify} />
          ))}
        </div>
      )}
    </div>
  );
}
