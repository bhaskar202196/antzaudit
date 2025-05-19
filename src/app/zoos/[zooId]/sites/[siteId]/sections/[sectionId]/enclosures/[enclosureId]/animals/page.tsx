
// src/app/zoos/[zooId]/sites/[siteId]/sections/[sectionId]/enclosures/[enclosureId]/animals/page.tsx
"use client";
import type { Animal, Enclosure, Section, Site, Zoo, User } from '@/lib/types'; 
import AnimalListItem from '@/components/zoo/animal-list-item';
import AnimalTable from '@/components/zoo/animal-table'; 
import { use, useEffect, useState, useCallback } from 'react';
import { useBreadcrumbs, type BreadcrumbItem } from '@/contexts/breadcrumb-context';
import { useZooData } from '@/contexts/zoo-data-context'; 
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle, Download, LayoutGrid, List, ChevronLeft, ChevronRight, Printer } from 'lucide-react'; 
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// Display type for this page, including grouping
interface DisplayAnimalInEnclosure extends Animal {
  animalCount: number;
  isGrouped: boolean;
  originalAnimalIds?: string[];
  // sectionName and enclosureName are fixed for this page, so not strictly needed on each animal object here
  // but AnimalListItem and AnimalTable might expect them if used generically
  sectionName?: string; 
  enclosureName?: string;
}

type ViewMode = 'card' | 'table';

// Helper function to convert animal data to CSV format
const convertAnimalsToCSV = (animals: DisplayAnimalInEnclosure[], enclosureName: string, currentUser: User | null): string => {
  const headers = ['ID (Primary)', 'Name', 'Species', 'Common Name', 'Gender', 
                   'Animal Count', // Added
                   'Verified', 'Verified At', 'Who Verified', 
                   'MicroChip', 'RingNumber', 'IdentifierType', 'IdentifierValue', 
                   'BreedName', 'MorphName', 'Weight', 'Age', 
                   'AccessionDate', 'AccessionType', 'BirthDate', 'AddedOnAntz', 'CSV Row',
                   'Night Cell Presence', 'Air Conditioning', 'Camera'
                  ];
  const rows = animals.map(animal => [
    animal.id, animal.name, animal.species, animal.commonName, animal.gender,
    animal.animalCount, // Added
    animal.verified ? 'Yes' : 'No',
    animal.verified && animal.verifiedAt ? new Date(animal.verifiedAt).toLocaleString() : '',
    animal.verified && currentUser && !animal.isGrouped ? currentUser.email : '', // Populate 'Who Verified'
    animal.microChip, animal.ringNumber, animal.identifierType, animal.identifierValue,
    animal.breedName, animal.morphName, animal.weight, animal.age,
    animal.accessionDate, animal.accessionType, animal.birthDate, animal.addedOnAntz, animal.csvRowNumber,
    animal.nightCellPresence ? 'Yes' : 'No', 
    animal.airConditioning ? 'Yes' : 'No',  
    animal.camera ? 'Yes' : 'No'
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

const groupEnclosureAnimalsForDisplay = (
  animals: Animal[], 
  sectionNameVal: string, 
  enclosureNameVal: string
): DisplayAnimalInEnclosure[] => {
  if (!animals.length) return [];

  const result: DisplayAnimalInEnclosure[] = [];
  const identifiableAnimals = animals.filter(a => a.identifierType && a.identifierValue);
  const nonIdentifiableAnimals = animals.filter(a => !(a.identifierType && a.identifierValue));

  identifiableAnimals.forEach(animal => {
    result.push({ ...animal, sectionName: sectionNameVal, enclosureName: enclosureNameVal, animalCount: 1, isGrouped: false });
  });

  if (nonIdentifiableAnimals.length > 0) {
    const sortedNonIdentifiable = [...nonIdentifiableAnimals].sort((a, b) => {
      const keyA = `${a.species}|${a.commonName}|${a.gender}`;
      const keyB = `${b.species}|${b.commonName}|${b.gender}`;
      return keyA.localeCompare(keyB);
    });

    let currentGroupAnimal = sortedNonIdentifiable[0];
    let count = 1;
    const currentGroupOriginalIds = [currentGroupAnimal.id];

    for (let i = 1; i < sortedNonIdentifiable.length; i++) {
      const animal = sortedNonIdentifiable[i];
      if (
        animal.species === currentGroupAnimal.species &&
        animal.commonName === currentGroupAnimal.commonName &&
        animal.gender === currentGroupAnimal.gender
      ) {
        count++;
        currentGroupOriginalIds.push(animal.id);
      } else {
        result.push({ ...currentGroupAnimal, sectionName: sectionNameVal, enclosureName: enclosureNameVal, animalCount: count, isGrouped: count > 1, originalAnimalIds: count > 1 ? [...currentGroupOriginalIds] : undefined });
        currentGroupAnimal = animal;
        count = 1;
        currentGroupOriginalIds.length = 0;
        currentGroupOriginalIds.push(animal.id);
      }
    }
    result.push({ ...currentGroupAnimal, sectionName: sectionNameVal, enclosureName: enclosureNameVal, animalCount: count, isGrouped: count > 1, originalAnimalIds: count > 1 ? [...currentGroupOriginalIds] : undefined });
  }
  
  return result.sort((a,b) => a.name.localeCompare(b.name));
};


export default function AnimalVerificationPage({ params: paramsPromise }: AnimalVerificationPageProps) {
  const params = use(paramsPromise);
  const { zooId, siteId, sectionId, enclosureId } = params; 

  const { 
    getEnclosureById: getEnclosureByIdFromContext, 
    getSectionById: getSectionByIdFromContext, 
    getSiteById: getSiteByIdFromContext,
    getZooById: getZooByIdFromContext,
    updateAnimalVerification, 
    updateAnimalBooleanFeature,
    isLoading: isZooDataLoading 
  } = useZooData();
  const { user } = useAuth(); 

  const [zoo, setZoo] = useState<Zoo | null | undefined>(null);
  const [site, setSite] = useState<Site | null | undefined>(null);
  const [section, setSection] = useState<Section | null | undefined>(null); 
  const [enclosure, setEnclosure] = useState<Enclosure | null | undefined>(null);
  const [processedAnimals, setProcessedAnimals] = useState<DisplayAnimalInEnclosure[]>([]);
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
        const currentSection = getSectionByIdFromContext(zooId, siteId, sectionId); 
        setSection(currentSection);
        if (currentSection) {
          const currentEnclosure = getEnclosureByIdFromContext(zooId, siteId, sectionId, enclosureId); 
          setEnclosure(currentEnclosure);
          if (currentEnclosure) {
            const breadcrumbsData: BreadcrumbItem[] = [
              { label: currentZoo.name, href: `/zoos/${zooId}/sites` },
              { label: currentSite.name, href: `/zoos/${zooId}/sites/${siteId}/sections` },
              { label: currentSection.name, href: `/zoos/${zooId}/sites/${siteId}/sections/${sectionId}/enclosures` },
              { label: currentEnclosure.name, href: `/zoos/${zooId}/sites/${siteId}/sections/${sectionId}/enclosures/${enclosureId}/animals` },
            ];
            setBreadcrumbs(breadcrumbsData);
            
            const grouped = groupEnclosureAnimalsForDisplay(currentEnclosure.animals, currentSection.name, currentEnclosure.name);
            setProcessedAnimals(grouped);
            setCurrentPage(1); 
          } else if (!isZooDataLoading) {
            setEnclosure(undefined);
            setProcessedAnimals([]);
            setBreadcrumbs([ 
              { label: currentZoo.name, href: `/zoos/${zooId}/sites` },
              { label: currentSite.name, href: `/zoos/${zooId}/sites/${siteId}/sections` },
              { label: currentSection.name, href: `/zoos/${zooId}/sites/${siteId}/sections/${sectionId}/enclosures` },
              { label: "Enclosure Not Found", href: `/zoos/${zooId}/sites/${siteId}/sections/${sectionId}/enclosures` }
            ]);
          }
        } else if (!isZooDataLoading) {
            setSection(undefined);
            setProcessedAnimals([]);
            setBreadcrumbs([ 
                { label: currentZoo.name, href: `/zoos/${zooId}/sites` },
                { label: currentSite.name, href: `/zoos/${zooId}/sites/${siteId}/sections` },
                { label: "Section Not Found", href: `/zoos/${zooId}/sites/${siteId}/sections` }
            ]);
        }
      } else if (!isZooDataLoading) {
        setSite(undefined);
        setProcessedAnimals([]);
        setBreadcrumbs([
          { label: currentZoo.name, href: `/zoos/${zooId}/sites` },
          { label: "Site Not Found", href: `/zoos/${zooId}/sites` }
        ]);
      }
    } else if(!isZooDataLoading) {
      setZoo(undefined);
      setProcessedAnimals([]);
      setBreadcrumbs([{label: "Zoo Not Found", href: "/dashboard"}]);
    }
  }, [zooId, siteId, sectionId, enclosureId, getZooByIdFromContext, getSiteByIdFromContext, getSectionByIdFromContext, getEnclosureByIdFromContext, setBreadcrumbs, isZooDataLoading]);

  const handleToggleVerify = useCallback((animalId: string) => {
    const animalData = processedAnimals.find(a => a.id === animalId);
    if (!animalData || animalData.isGrouped) {
      if (animalData?.isGrouped) {
        toast({ title: "Action Disabled", description: "Verification actions are disabled for grouped animals.", variant: "default", className:"bg-secondary text-secondary-foreground" });
      }
      return;
    }
    
    const isNowVerified = !animalData.verified;
    const newVerifiedAt = isNowVerified ? new Date().toISOString() : undefined;
    
    updateAnimalVerification(zooId, siteId, sectionId, enclosureId, animalId, isNowVerified, newVerifiedAt);
    
    setProcessedAnimals(prevAnimals => 
        prevAnimals.map(animal => 
          animal.id === animalId 
            ? { ...animal, verified: isNowVerified, verifiedAt: newVerifiedAt } 
            : animal
        )
      );

    setTimeout(() => {
        let toastTitle = `Animal ${isNowVerified ? 'Verified' : 'Unverified'}`;
        let toastDescription = `${animalData.name} (${animalData.species}) status updated.`;
        if (isNowVerified && newVerifiedAt) {
            toastDescription = `${animalData.name} (${animalData.species}) verified on ${new Date(newVerifiedAt).toLocaleString()}.`;
        }
        toast({
            title: toastTitle,
            description: toastDescription,
            variant: isNowVerified ? 'default' : 'default', 
            className: isNowVerified ? 'bg-accent text-accent-foreground border-accent' : 'bg-secondary text-secondary-foreground'
        });
    }, 0);

  }, [processedAnimals, zooId, siteId, sectionId, enclosureId, updateAnimalVerification, toast]);

  const handleBooleanFeatureToggle = useCallback((animalId: string, featureName: 'nightCellPresence' | 'airConditioning' | 'camera', value: boolean) => {
    const animalData = processedAnimals.find(a => a.id === animalId);
    if (!animalData || animalData.isGrouped) {
      if (animalData?.isGrouped) {
        toast({ title: "Action Disabled", description: `Toggling ${featureName} is disabled for grouped animals.`, variant: "default", className:"bg-secondary text-secondary-foreground" });
      }
      return;
    }
    updateAnimalBooleanFeature(zooId, siteId, sectionId, enclosureId, animalId, featureName, value);
     setProcessedAnimals(prevAnimals => 
        prevAnimals.map(animal => 
          animal.id === animalId 
            ? { ...animal, [featureName]: value } 
            : animal
        )
      );
  }, [processedAnimals, zooId, siteId, sectionId, enclosureId, updateAnimalBooleanFeature, toast]);


  const handleExportCSV = useCallback(() => {
    if (!enclosure || !processedAnimals || processedAnimals.length === 0) {
      setTimeout(() => {
        toast({ title: "No Data", description: "There are no animals to export.", variant: "destructive" });
      },0);
      return;
    }
    try {
      const csvData = convertAnimalsToCSV(processedAnimals, enclosure.name, user); 
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
  }, [enclosure, processedAnimals, toast, user]); 

  const handlePrint = () => {
    window.print();
  };
  
  if (isZooDataLoading || zoo === null || (zoo && site === null) || (zoo && site && section === null) || (zoo && site && section && enclosure === null) ) { 
    return (
      <div>
        <Skeleton className="h-10 w-64 mb-6" /> 
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

  const totalPages = Math.ceil(processedAnimals.length / itemsPerPage);
  const paginatedAnimals = processedAnimals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <Button asChild variant="outline">
          <Link href={`/zoos/${zooId}/sites/${siteId}/sections/${sectionId}/enclosures`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Enclosures in {section.name}
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {processedAnimals.length > 0 && (
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" /> Export to CSV
            </Button>
          )}
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
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
      <p className="text-xl text-muted-foreground mb-8">Animals for Verification (in {section.name}) - Total Groups/Animals: {processedAnimals.length}</p>
      
      {processedAnimals.length === 0 ? (
        <p className="text-lg text-muted-foreground">This enclosure has no animals listed for verification.</p>
      ) : viewMode === 'card' ? (
        <div className="space-y-4">
          {paginatedAnimals.map(animal => (
            <AnimalListItem 
              key={animal.id + (animal.isGrouped ? '-grouped' : '')} 
              animal={animal} 
              onToggleVerify={handleToggleVerify}
              onToggleFeature={handleBooleanFeatureToggle}
              sectionName={section.name} // Pass section/enclosure name for context in card
              enclosureName={enclosure.name}
            />
          ))}
        </div>
      ) : (
        <AnimalTable 
          animals={paginatedAnimals.map(a => ({...a, sectionName: section.name, enclosureName: enclosure.name }))} 
          onToggleVerify={handleToggleVerify} 
          onToggleFeature={handleBooleanFeatureToggle}
        />
      )}

      {totalPages > 1 && (
         <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor={`enclosure-items-per-page-select-${enclosureId}`} className="text-sm text-muted-foreground whitespace-nowrap">Items per page:</Label>
            <Select
              value={String(itemsPerPage)}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1); 
              }}
            >
              <SelectTrigger id={`enclosure-items-per-page-select-${enclosureId}`} className="w-[80px] h-9">
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
