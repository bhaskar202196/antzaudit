
// src/app/zoos/[zooId]/sites/[siteId]/all-animals/page.tsx
"use client";
import type { Animal, Site, Zoo, User } from '@/lib/types';
import AnimalListItem from '@/components/zoo/animal-list-item';
import AnimalTable from '@/components/zoo/animal-table';
import { use, useEffect, useState, useCallback } from 'react';
import { useBreadcrumbs, type BreadcrumbItem } from '@/contexts/breadcrumb-context';
import { useZooData } from '@/contexts/zoo-data-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle, Download, LayoutGrid, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface AllAnimalsPageProps {
  params: Promise<{ zooId: string; siteId: string }>;
}

// Enhanced animal data type for this page to include origin info
interface SiteAnimalViewData extends Animal {
  sectionId: string;
  sectionName: string;
  enclosureId: string;
  enclosureName: string;
}

type ViewMode = 'card' | 'table';

// Helper function to convert site animal data to CSV format
const convertSiteAnimalsToCSV = (animals: SiteAnimalViewData[], siteName: string, currentUser: User | null): string => {
  const headers = [
    'Section Name', 'Enclosure Name', 
    'Animal ID', 'Animal Name', 'Species', 'Common Name', 'Gender', 
    'Verified', 'Verified At', 'Who Verified',
    'MicroChip', 'RingNumber', 'IdentifierType', 'IdentifierValue', 
    'BreedName', 'MorphName', 'Weight', 'Age', 
    'AccessionDate', 'AccessionType', 'BirthDate', 'AddedOnAntz', 'CSV Row'
  ];
  
  const rows = animals.map(animal => [
    animal.sectionName, animal.enclosureName,
    animal.id, animal.name, animal.species, animal.commonName, animal.gender,
    animal.verified ? 'Yes' : 'No',
    animal.verified && animal.verifiedAt ? new Date(animal.verifiedAt).toLocaleString() : '',
    animal.verified && currentUser ? currentUser.email : '',
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


export default function AllAnimalsPage({ params: paramsPromise }: AllAnimalsPageProps) {
  const params = use(paramsPromise);
  const { zooId, siteId } = params;

  const { 
    getSiteById: getSiteByIdFromContext,
    getZooById: getZooByIdFromContext,
    updateAnimalVerification, 
    isLoading: isZooDataLoading,
    getEnclosureById // To get fresh animal data after update
  } = useZooData();
  const { user } = useAuth();

  const [zoo, setZoo] = useState<Zoo | null | undefined>(null);
  const [site, setSite] = useState<Site | null | undefined>(null);
  const [allSiteAnimals, setAllSiteAnimals] = useState<SiteAnimalViewData[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const { setBreadcrumbs } = useBreadcrumbs();
  const { toast } = useToast();

  useEffect(() => {
    const currentZoo = getZooByIdFromContext(zooId);
    setZoo(currentZoo);
    if (currentZoo) {
      const currentSite = getSiteByIdFromContext(zooId, siteId);
      setSite(currentSite);
      if (currentSite) {
        const breadcrumbsData: BreadcrumbItem[] = [
          { label: currentZoo.name, href: `/zoos/${zooId}/sites` },
          { label: currentSite.name, href: `/zoos/${zooId}/sites/${siteId}/all-animals` },
          { label: "All Animals", href: `/zoos/${zooId}/sites/${siteId}/all-animals` },
        ];
        setBreadcrumbs(breadcrumbsData);

        // Collect all animals from this site
        const animals: SiteAnimalViewData[] = [];
        currentSite.sections.forEach(section => {
          section.enclosures.forEach(enclosure => {
            enclosure.animals.forEach(animal => {
              animals.push({
                ...animal,
                sectionId: section.id,
                sectionName: section.name,
                enclosureId: enclosure.id,
                enclosureName: enclosure.name,
              });
            });
          });
        });
        setAllSiteAnimals(animals);
        setCurrentPage(1); // Reset page when site data changes/loads

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
  }, [zooId, siteId, getZooByIdFromContext, getSiteByIdFromContext, setBreadcrumbs, isZooDataLoading]);

  const handleToggleVerify = useCallback((animalId: string) => {
    const animalData = allSiteAnimals.find(a => a.id === animalId);
    if (!animalData) {
      console.error("Animal data not found for toggling verification:", animalId);
      toast({ title: "Error", description: "Could not find animal data to update.", variant: "destructive"});
      return;
    }

    const { sectionId: animalSectionId, enclosureId: animalEnclosureId } = animalData;
    const isNowVerified = !animalData.verified;
    const newVerifiedAt = isNowVerified ? new Date().toISOString() : undefined;
    
    updateAnimalVerification(zooId, siteId, animalSectionId, animalEnclosureId, animalId, isNowVerified, newVerifiedAt);

    // Optimistically update local state or refetch for consistency
     setAllSiteAnimals(prevAnimals => 
        prevAnimals.map(animal => 
          animal.id === animalId 
            ? { ...animal, verified: isNowVerified, verifiedAt: newVerifiedAt } 
            : animal
        )
      );

    setTimeout(() => {
        const currentAnimalFromEnclosure = getEnclosureById(zooId, siteId, animalSectionId, animalEnclosureId)?.animals.find(a => a.id === animalId);
        if (currentAnimalFromEnclosure) {
            let toastTitle = `Animal ${currentAnimalFromEnclosure.verified ? 'Verified' : 'Unverified'}`;
            let toastDescription = `${currentAnimalFromEnclosure.name} (${currentAnimalFromEnclosure.species}) status updated.`;
            if (currentAnimalFromEnclosure.verified && currentAnimalFromEnclosure.verifiedAt) {
                toastDescription = `${currentAnimalFromEnclosure.name} (${currentAnimalFromEnclosure.species}) verified on ${new Date(currentAnimalFromEnclosure.verifiedAt).toLocaleString()}.`;
            }
             toast({
                title: toastTitle,
                description: toastDescription,
                variant: currentAnimalFromEnclosure.verified ? 'default' : 'default', 
                className: currentAnimalFromEnclosure.verified ? 'bg-accent text-accent-foreground border-accent' : 'bg-secondary text-secondary-foreground'
            });
        } else {
            // Fallback toast if direct refetch is not immediately available
             toast({
                title: `Animal ${isNowVerified ? 'Verified' : 'Unverified'}`,
                description: `${animalData.name} status updated.`,
                variant: isNowVerified ? 'default' : 'default',
                className: isNowVerified ? 'bg-accent text-accent-foreground border-accent' : 'bg-secondary text-secondary-foreground'
            });
        }
    }, 0);

  }, [allSiteAnimals, zooId, siteId, updateAnimalVerification, toast, getEnclosureById]);

  const handleExportCSV = useCallback(() => {
    if (!allSiteAnimals || allSiteAnimals.length === 0) {
      setTimeout(()=> {
      toast({ title: "No Data", description: "There are no animals in this site to export.", variant: "destructive" });
      },0);
      return;
    }
    if (!site) {
       setTimeout(()=> {
      toast({ title: "Error", description: "Site data not available for export.", variant: "destructive" });
       },0);
      return;
    }
    try {
      const csvData = convertSiteAnimalsToCSV(allSiteAnimals, site.name, user);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${site.name.replace(/\s+/g, '_')}_all_animals_export.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setTimeout(()=> {
      toast({ title: "Export Successful", description: `All animal data for site ${site.name} has been downloaded.` });
      },0);
    } catch (error) {
      console.error("Failed to export site animals CSV:", error);
       setTimeout(()=> {
      toast({ title: "Export Failed", description: "Could not generate CSV file. Please try again.", variant: "destructive" });
       },0);
    }
  }, [allSiteAnimals, site, toast, user]);
  
  // Pagination logic
  const totalPages = Math.ceil(allSiteAnimals.length / itemsPerPage);
  const paginatedSiteAnimals = allSiteAnimals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isZooDataLoading || zoo === null || (zoo && site === null) ) { 
    return (
      <div>
        <Skeleton className="h-10 w-64 mb-6" /> {/* Back button skeleton */}
        <Skeleton className="h-10 w-3/4 mb-2" /> {/* Title skeleton */}
        <Skeleton className="h-8 w-1/2 mb-2" /> {/* Subtitle skeleton */}
        <Skeleton className="h-6 w-1/3 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
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
        <p className="text-muted-foreground mb-6">The requested zoo or site could not be found.</p>
        <Button asChild>
          <Link href={zoo ? `/zoos/${zooId}/sites` : "/dashboard"}>
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
          <Link href={`/zoos/${zooId}/sites`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sites in {zoo.name}
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {allSiteAnimals.length > 0 && (
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" /> Export All to CSV
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

      <h1 className="text-4xl font-bold mb-2 tracking-tight text-gray-800">All Animals in {site.name}</h1>
      <p className="text-xl text-muted-foreground mb-8">Total: {allSiteAnimals.length} animal(s) for verification</p>
      
      {allSiteAnimals.length === 0 ? (
        <p className="text-lg text-muted-foreground">This site has no animals listed for verification across its sections and enclosures.</p>
      ) : viewMode === 'card' ? (
        <div className="space-y-4">
          {paginatedSiteAnimals.map(animal => (
            <AnimalListItem key={animal.id} animal={animal} onToggleVerify={handleToggleVerify} />
          ))}
        </div>
      ) : (
        <AnimalTable animals={paginatedSiteAnimals} onToggleVerify={handleToggleVerify} />
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor={`all-animals-items-per-page-select-${siteId}`} className="text-sm text-muted-foreground whitespace-nowrap">Items per page:</Label>
            <Select
              value={String(itemsPerPage)}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1); // Reset to first page
              }}
            >
              <SelectTrigger id={`all-animals-items-per-page-select-${siteId}`} className="w-[80px] h-9">
                <SelectValue placeholder={String(itemsPerPage)} />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map(size => (
                  <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

