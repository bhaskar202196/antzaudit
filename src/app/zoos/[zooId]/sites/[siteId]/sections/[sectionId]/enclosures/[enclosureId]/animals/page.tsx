
// src/app/zoos/[zooId]/sites/[siteId]/sections/[sectionId]/enclosures/[enclosureId]/animals/page.tsx
"use client";
import type { Animal, Enclosure, Section, Site, Zoo, User } from '@/lib/types'; // Added Section, User
import AnimalListItem from '@/components/zoo/animal-list-item';
import AnimalTable from '@/components/zoo/animal-table'; // Import the new table component
import { use, useEffect, useState, useCallback } from 'react';
import { useBreadcrumbs, type BreadcrumbItem } from '@/contexts/breadcrumb-context';
import { useZooData } from '@/contexts/zoo-data-context'; 
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle, Download, LayoutGrid, List } from 'lucide-react'; // Added LayoutGrid and List icons
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth'; // Import useAuth

interface AnimalVerificationPageProps {
  params: Promise<{ zooId: string; siteId: string; sectionId: string; enclosureId: string }>; // Added sectionId
}

type ViewMode = 'card' | 'table';

// Helper function to convert animal data to CSV format
const convertAnimalsToCSV = (animals: Animal[], enclosureName: string, currentUser: User | null): string => {
  const headers = ['ID', 'Name', 'Species', 'Common Name', 'Gender', 
                   'Verified', 'Verified At', 'Who Verified', // Added 'Who Verified'
                   'MicroChip', 'RingNumber', 'IdentifierType', 'IdentifierValue', 
                   'BreedName', 'MorphName', 'Weight', 'Age', 
                   'AccessionDate', 'AccessionType', 'BirthDate', 'AddedOnAntz', 'CSV Row'];
  const rows = animals.map(animal => [
    animal.id, animal.name, animal.species, animal.commonName, animal.gender,
    animal.verified ? 'Yes' : 'No',
    animal.verified && animal.verifiedAt ? new Date(animal.verifiedAt).toLocaleString() : '',
    animal.verified && currentUser ? currentUser.email : '', // Populate 'Who Verified'
    animal.microChip, animal.ringNumber, animal.identifierType, animal.identifierValue,
    animal.breedName, animal.morphName, animal.weight, animal.age,
    animal.accessionDate, animal.accessionType, animal.birthDate, animal.addedOnAntz, animal.csvRowNumber
  ]);

  const escapeField = (field: string | number | boolean | undefined | null) => {
    if (field === null || field === undefined) return '';
    const stringField = String(field);
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
  const params = use(paramsPromise);
  const { zooId, siteId, sectionId, enclosureId } = params; // Added sectionId

  const { 
    getEnclosureById: getEnclosureByIdFromContext, 
    getSectionById: getSectionByIdFromContext, // Added getSectionById
    getSiteById: getSiteByIdFromContext,
    getZooById: getZooByIdFromContext,
    updateAnimalVerification, 
    isLoading: isZooDataLoading 
  } = useZooData();
  const { user } = useAuth(); // Get current user

  const [zoo, setZoo] = useState<Zoo | null | undefined>(null);
  const [site, setSite] = useState<Site | null | undefined>(null);
  const [section, setSection] = useState<Section | null | undefined>(null); // Added section state
  const [enclosure, setEnclosure] = useState<Enclosure | null | undefined>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('card'); // State for view mode
  
  const { setBreadcrumbs } = useBreadcrumbs();
  const { toast } = useToast();

  useEffect(() => {
    const currentZoo = getZooByIdFromContext(zooId);
    setZoo(currentZoo);
    if (currentZoo) {
      const currentSite = getSiteByIdFromContext(zooId, siteId);
      setSite(currentSite);
      if (currentSite) {
        const currentSection = getSectionByIdFromContext(zooId, siteId, sectionId); // Fetch section
        setSection(currentSection);
        if (currentSection) {
          const currentEnclosure = getEnclosureByIdFromContext(zooId, siteId, sectionId, enclosureId); // Use sectionId
          setEnclosure(currentEnclosure);
          if (currentEnclosure) {
            const breadcrumbsData: BreadcrumbItem[] = [
              { label: currentZoo.name, href: `/zoos/${zooId}/sites` },
              { label: currentSite.name, href: `/zoos/${zooId}/sites/${siteId}/sections` },
              { label: currentSection.name, href: `/zoos/${zooId}/sites/${siteId}/sections/${sectionId}/enclosures` },
              { label: currentEnclosure.name, href: `/zoos/${zooId}/sites/${siteId}/sections/${sectionId}/enclosures/${enclosureId}/animals` },
            ];
            setBreadcrumbs(breadcrumbsData);
          } else if (!isZooDataLoading) {
            setEnclosure(undefined);
            setBreadcrumbs([ 
              { label: currentZoo.name, href: `/zoos/${zooId}/sites` },
              { label: currentSite.name, href: `/zoos/${zooId}/sites/${siteId}/sections` },
              { label: currentSection.name, href: `/zoos/${zooId}/sites/${siteId}/sections/${sectionId}/enclosures` },
              { label: "Enclosure Not Found", href: `/zoos/${zooId}/sites/${siteId}/sections/${sectionId}/enclosures` }
            ]);
          }
        } else if (!isZooDataLoading) {
            setSection(undefined);
            setBreadcrumbs([ 
                { label: currentZoo.name, href: `/zoos/${zooId}/sites` },
                { label: currentSite.name, href: `/zoos/${zooId}/sites/${siteId}/sections` },
                { label: "Section Not Found", href: `/zoos/${zooId}/sites/${siteId}/sections` }
            ]);
        }
      } else if (!isZooDataLoading) {
        setSite(undefined);
        setBreadcrumbs([
          { label: currentZoo.name, href: `/zoos/${zooId}/sites` },
          { label: "Site Not Found", href: `/zoos/${zooId}/sites` }
        ]);
      }
    } else if(!isZooDataLoading) {
      setZoo(undefined);
      setBreadcrumbs([{label: "Zoo Not Found", href: "/dashboard"}]);
    }
  }, [zooId, siteId, sectionId, enclosureId, getZooByIdFromContext, getSiteByIdFromContext, getSectionByIdFromContext, getEnclosureByIdFromContext, setBreadcrumbs, isZooDataLoading]);

  const handleToggleVerify = useCallback((animalId: string) => {
    if (!enclosure) return;
    
    const animalToUpdate = enclosure.animals.find(a => a.id === animalId);
    if (!animalToUpdate) return;

    const isNowVerified = !animalToUpdate.verified;
    const newVerifiedAt = isNowVerified ? new Date().toISOString() : undefined;
    
    updateAnimalVerification(zooId, siteId, sectionId, enclosureId, animalId, isNowVerified, newVerifiedAt);

    setTimeout(() => {
        const currentAnimal = getEnclosureByIdFromContext(zooId, siteId, sectionId, enclosureId)?.animals.find(a => a.id === animalId);
        if (currentAnimal) {
            let toastTitle = `Animal ${currentAnimal.verified ? 'Verified' : 'Unverified'}`;
            let toastDescription = `${currentAnimal.name} (${currentAnimal.species}) status updated.`;
            if (currentAnimal.verified && currentAnimal.verifiedAt) {
                toastDescription = `${currentAnimal.name} (${currentAnimal.species}) verified on ${new Date(currentAnimal.verifiedAt).toLocaleString()}.`;
            }
            toast({
                title: toastTitle,
                description: toastDescription,
                variant: currentAnimal.verified ? 'default' : 'default', 
                className: currentAnimal.verified ? 'bg-accent text-accent-foreground border-accent' : 'bg-secondary text-secondary-foreground'
            });
        }
    }, 0);

  }, [enclosure, zooId, siteId, sectionId, enclosureId, updateAnimalVerification, toast, getEnclosureByIdFromContext]);

  const handleExportCSV = useCallback(() => {
    if (!enclosure || !enclosure.animals || enclosure.animals.length === 0) {
      setTimeout(() => {
        toast({ title: "No Data", description: "There are no animals to export.", variant: "destructive" });
      },0);
      return;
    }
    try {
      const csvData = convertAnimalsToCSV(enclosure.animals, enclosure.name, user); // Pass user to CSV function
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
      },0);
    } catch (error) {
      console.error("Failed to export CSV:", error);
      setTimeout(() => {
        toast({ title: "Export Failed", description: "Could not generate CSV file. Please try again.", variant: "destructive" });
      },0);
    }
  }, [enclosure, toast, user]); // Add user to dependencies
  
  if (isZooDataLoading || zoo === null || (zoo && site === null) || (zoo && site && section === null) || (zoo && site && section && enclosure === null) ) { 
    return (
      <div>
        <Skeleton className="h-10 w-64 mb-6" /> {/* Back button skeleton */}
        <Skeleton className="h-10 w-3/4 mb-2" /> {/* Title skeleton */}
        <Skeleton className="h-8 w-1/2 mb-2" /> {/* Subtitle skeleton */}
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

  if (zoo === undefined || site === undefined || section === undefined || enclosure === undefined) { 
     return (
      <div className="flex flex-col items-center justify-center text-center py-10">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold mb-2">Content Not Found</h1>
        <p className="text-muted-foreground mb-6">The requested zoo, site, section, or enclosure could not be found.</p>
        <Button asChild>
          <Link href={section ? `/zoos/${zooId}/sites/${siteId}/sections/${sectionId}/enclosures` : (site ? `/zoos/${zooId}/sites/${siteId}/sections` : (zoo ? `/zoos/${zooId}/sites` : "/dashboard"))}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Link>
        </Button>
      </div>
    );
  }

  const animals = enclosure.animals; 

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <Button asChild variant="outline">
          <Link href={`/zoos/${zooId}/sites/${siteId}/sections/${sectionId}/enclosures`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Enclosures in {section.name}
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {animals.length > 0 && (
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" /> Export to CSV
            </Button>
          )}
           <Button 
            variant={viewMode === 'card' ? 'secondary' : 'outline'} 
            onClick={() => setViewMode('card')}
            size="icon"
            aria-label="Card View"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === 'table' ? 'secondary' : 'outline'} 
            onClick={() => setViewMode('table')}
            size="icon"
            aria-label="Table View"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <h1 className="text-4xl font-bold mb-2 tracking-tight text-gray-800">{enclosure.name}</h1>
      <p className="text-xl text-muted-foreground mb-8">Animals for Verification (in {section.name})</p>
      
      {animals.length === 0 ? (
        <p className="text-lg text-muted-foreground">This enclosure has no animals listed for verification.</p>
      ) : viewMode === 'card' ? (
        <div className="space-y-4">
          {animals.map(animal => (
            <AnimalListItem key={animal.id} animal={animal} onToggleVerify={handleToggleVerify} />
          ))}
        </div>
      ) : (
        <AnimalTable animals={animals} onToggleVerify={handleToggleVerify} />
      )}
    </div>
  );
}
