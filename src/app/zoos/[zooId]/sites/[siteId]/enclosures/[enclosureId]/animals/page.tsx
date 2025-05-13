// src/app/zoos/[zooId]/sites/[siteId]/enclosures/[enclosureId]/animals/page.tsx
"use client";
import type { Animal, Enclosure, Site, Zoo } from '@/lib/types';
import { getZooById, getSiteById, getEnclosureById } from '@/lib/data';
import AnimalListItem from '@/components/zoo/animal-list-item';
import { use, useEffect, useState, useCallback } from 'react'; // Added 'use'
import { useBreadcrumbs, type BreadcrumbItem } from '@/contexts/breadcrumb-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle, Download } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';

interface AnimalVerificationPageProps {
  params: Promise<{ zooId: string; siteId: string; enclosureId: string }>; // Updated type to Promise
}

// Helper function to convert animal data to CSV format
const convertAnimalsToCSV = (animals: Animal[], enclosureName: string): string => {
  const headers = ['ID', 'Name', 'Species', 'Verified', 'Verified At'];
  const rows = animals.map(animal => [
    animal.id,
    animal.name,
    animal.species,
    animal.verified ? 'Yes' : 'No',
    animal.verified && animal.verifiedAt ? new Date(animal.verifiedAt).toLocaleString() : ''
  ]);

  // Escaping fields that might contain commas or quotes
  const escapeField = (field: string | number | boolean | undefined) => {
    if (field === null || field === undefined) return '';
    const stringField = String(field);
    // Replace " with "" and wrap in " if it contains , or " or newline
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  };

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(escapeField).join(','))
  ].join('\n');
  
  return csvContent;
};


export default function AnimalVerificationPage({ params: paramsPromise }: AnimalVerificationPageProps) {
  const params = use(paramsPromise); // Unwrap params using React.use()
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
          setAnimals(currentEnclosure.animals.map(a => ({...a}))); 
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
          const isNowVerified = !animal.verified;
          const updatedAnimal = { 
            ...animal, 
            verified: isNowVerified,
            verifiedAt: isNowVerified ? new Date().toISOString() : undefined
          };
          
          setTimeout(() => {
            let toastTitle = `Animal ${updatedAnimal.verified ? 'Verified' : 'Unverified'}`;
            let toastDescription = `${updatedAnimal.name} (${updatedAnimal.species}) status updated.`;
            if (updatedAnimal.verified && updatedAnimal.verifiedAt) {
              toastDescription = `${updatedAnimal.name} (${updatedAnimal.species}) verified on ${new Date(updatedAnimal.verifiedAt).toLocaleString()}.`;
            }

            toast({
              title: toastTitle,
              description: toastDescription,
              variant: updatedAnimal.verified ? 'default' : 'default', 
              className: updatedAnimal.verified ? 'bg-accent text-accent-foreground border-accent' : 'bg-secondary text-secondary-foreground'
            });
          }, 0);
          return updatedAnimal;
        }
        return animal;
      })
    );
  }, [toast]);

  const handleExportCSV = useCallback(() => {
    if (!enclosure || animals.length === 0) {
      setTimeout(() => {
        toast({ title: "No Data", description: "There are no animals to export.", variant: "destructive" });
      }, 0);
      return;
    }
    try {
      const csvData = convertAnimalsToCSV(animals, enclosure.name);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${enclosure.name.replace(/\s+/g, '_')}_animals_export.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setTimeout(() => {
        toast({ title: "Export Successful", description: `Animal data for ${enclosure.name} has been downloaded.` });
      }, 0);
    } catch (error) {
      console.error("Failed to export CSV:", error);
      setTimeout(() => {
        toast({ title: "Export Failed", description: "Could not generate CSV file. Please try again.", variant: "destructive" });
      }, 0);
    }
  }, [animals, enclosure, toast]);
  
  if (zoo === null || site === null || enclosure === null) { 
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

  if (zoo === undefined || site === undefined || enclosure === undefined) { 
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <Button asChild variant="outline">
          <Link href={`/zoos/${zooId}/sites/${siteId}/enclosures`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Enclosures in {site.name}
          </Link>
        </Button>
        {animals.length > 0 && (
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export to CSV
          </Button>
        )}
      </div>

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
