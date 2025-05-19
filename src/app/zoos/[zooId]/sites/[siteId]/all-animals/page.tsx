
// src/app/zoos/[zooId]/sites/[siteId]/all-animals/page.tsx
"use client";
import type { Animal, Site, Zoo, User } from '@/lib/types';
import AnimalListItem from '@/components/zoo/animal-list-item';
import AnimalTable from '@/components/zoo/animal-table';
import { use, useEffect, useState, useCallback, type ChangeEvent } from 'react';
import { useBreadcrumbs, type BreadcrumbItem } from '@/contexts/breadcrumb-context';
import { useZooData } from '@/contexts/zoo-data-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, AlertTriangle, Download, LayoutGrid, List, ChevronLeft, ChevronRight, Search, Printer } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// Enhanced animal data type for this page to include origin info and grouping
interface DisplayAnimal extends Animal {
  sectionId: string;
  sectionName: string;
  enclosureId: string;
  enclosureName: string;
  animalCount: number;
  isGrouped: boolean;
  originalAnimalIds?: string[]; // Store original IDs for potential future use if a group action is needed
}

type ViewMode = 'card' | 'table';

// Helper function to convert site animal data to CSV format
const convertSiteAnimalsToCSV = (animals: DisplayAnimal[], siteName: string, currentUser: User | null): string => {
  const headers = [
    'Section Name', 'Enclosure Name',
    'Animal ID (Primary)', 'Animal Name', 'Species', 'Common Name', 'Gender',
    'Animal Count',
    'Verified', 'Verified At', 'Who Verified',
    'MicroChip', 'RingNumber', 'IdentifierType', 'IdentifierValue',
    'BreedName', 'MorphName', 'Weight', 'Age',
    'AccessionDate', 'AccessionType', 'BirthDate', 'AddedOnAntz', 'CSV Row',
    'Night Cell Presence', 'Air Conditioning', 'Camera'
  ];

  const rows = animals.map(animal => [
    animal.sectionName, animal.enclosureName,
    animal.id, animal.name, animal.species, animal.commonName, animal.gender,
    animal.animalCount,
    animal.verified ? 'Yes' : 'No',
    animal.verified && animal.verifiedAt ? new Date(animal.verifiedAt).toLocaleString() : '',
    animal.verified && currentUser ? currentUser.email : '',
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

const groupAnimalsForDisplay = (animals: Animal[], siteData: Site): DisplayAnimal[] => {
  const animalsWithContext = animals.map(a => {
    let sectionName = "N/A", enclosureName = "N/A", sectionId = "N/A", enclosureId = "N/A";
    for (const sec of siteData.sections) {
      for (const enc of sec.enclosures) {
        if (enc.animals.some(animalInEnc => animalInEnc.id === a.id)) {
          sectionName = sec.name;
          enclosureName = enc.name;
          sectionId = sec.id;
          enclosureId = enc.id;
          break;
        }
      }
      if (sectionName !== "N/A") break;
    }
    return { ...a, sectionId, sectionName, enclosureId, enclosureName };
  });


  const result: DisplayAnimal[] = [];
  const identifiableAnimals = animalsWithContext.filter(a => a.identifierType && a.identifierValue);
  const nonIdentifiableAnimals = animalsWithContext.filter(a => !(a.identifierType && a.identifierValue));

  identifiableAnimals.forEach(animal => {
    result.push({ ...animal, animalCount: 1, isGrouped: false });
  });

  if (nonIdentifiableAnimals.length > 0) {
    const sortedNonIdentifiable = [...nonIdentifiableAnimals].sort((a, b) => {
      const keyA = `${a.species}|${a.commonName}|${a.gender}|${a.sectionName}|${a.enclosureName}`;
      const keyB = `${b.species}|${b.commonName}|${b.gender}|${b.sectionName}|${b.enclosureName}`;
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
        animal.gender === currentGroupAnimal.gender &&
        animal.sectionName === currentGroupAnimal.sectionName &&
        animal.enclosureName === currentGroupAnimal.enclosureName
      ) {
        count++;
        currentGroupOriginalIds.push(animal.id);
      } else {
        result.push({ ...currentGroupAnimal, animalCount: count, isGrouped: count > 1, originalAnimalIds: count > 1 ? [...currentGroupOriginalIds] : undefined });
        currentGroupAnimal = animal;
        count = 1;
        currentGroupOriginalIds.length = 0; // Clear array
        currentGroupOriginalIds.push(animal.id);
      }
    }
    result.push({ ...currentGroupAnimal, animalCount: count, isGrouped: count > 1, originalAnimalIds: count > 1 ? [...currentGroupOriginalIds] : undefined });
  }

  return result.sort((a, b) => {
    if (a.sectionName.localeCompare(b.sectionName) !== 0) {
      return a.sectionName.localeCompare(b.sectionName);
    }
    if (a.enclosureName.localeCompare(b.enclosureName) !== 0) {
      return a.enclosureName.localeCompare(b.enclosureName);
    }
    return a.name.localeCompare(b.name);
  });
};


export default function AllAnimalsPage({ params: paramsPromise }: { params: Promise<{ zooId: string, siteId: string}> }) {
  const params = use(paramsPromise);
  const { zooId, siteId } = params;

  const {
    getSiteById: getSiteByIdFromContext,
    getZooById: getZooByIdFromContext,
    updateAnimalVerification,
    updateAnimalBooleanFeature,
    isLoading: isZooDataLoading,
  } = useZooData();
  const { user } = useAuth();

  const [zoo, setZoo] = useState<Zoo | null | undefined>(null);
  const [site, setSite] = useState<Site | null | undefined>(null);
  const [processedAnimals, setProcessedAnimals] = useState<DisplayAnimal[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterText, setFilterText] = useState('');

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

        let allAnimalsFromSite: Animal[] = [];
        currentSite.sections.forEach(section => {
          section.enclosures.forEach(enclosure => {
            allAnimalsFromSite.push(...enclosure.animals);
          });
        });

        const grouped = groupAnimalsForDisplay(allAnimalsFromSite, currentSite);
        setProcessedAnimals(grouped);
        setCurrentPage(1);
        setFilterText('');

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
  }, [zooId, siteId, getZooByIdFromContext, getSiteByIdFromContext, setBreadcrumbs, isZooDataLoading]);

  const handleToggleVerify = useCallback((animalId: string) => {
    const animalData = processedAnimals.find(a => a.id === animalId);
    if (!animalData) return;

    const { sectionId: animalSectionId, enclosureId: animalEnclosureId } = animalData;
    const isNowVerified = !animalData.verified;
    const newVerifiedAt = isNowVerified ? new Date().toISOString() : undefined;

    updateAnimalVerification(zooId, siteId, animalSectionId, animalEnclosureId, animalId, isNowVerified, newVerifiedAt);

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

  }, [processedAnimals, zooId, siteId, updateAnimalVerification, toast]);

  const handleBooleanFeatureToggle = useCallback((animalId: string, featureName: 'nightCellPresence' | 'airConditioning' | 'camera', value: boolean) => {
    const animalData = processedAnimals.find(a => a.id === animalId);
     if (!animalData) return;

    const { sectionId: animalSectionId, enclosureId: animalEnclosureId } = animalData;
    updateAnimalBooleanFeature(zooId, siteId, animalSectionId, animalEnclosureId, animalId, featureName, value);

    setProcessedAnimals(prevAnimals =>
        prevAnimals.map(animal =>
          animal.id === animalId
            ? { ...animal, [featureName]: value }
            : animal
        )
      );
  }, [processedAnimals, zooId, siteId, updateAnimalBooleanFeature, toast]);


  const filteredSiteAnimals = processedAnimals.filter(animal => {
    const searchText = filterText.toLowerCase();
    if (!searchText) return true;
    return (
      animal.species?.toLowerCase().includes(searchText) ||
      animal.commonName?.toLowerCase().includes(searchText) ||
      animal.sectionName?.toLowerCase().includes(searchText) ||
      animal.enclosureName?.toLowerCase().includes(searchText) ||
      animal.name?.toLowerCase().includes(searchText)
    );
  });

  const handleExportCSV = useCallback(() => {
    if (!filteredSiteAnimals || filteredSiteAnimals.length === 0) {
      setTimeout(()=> {
      toast({ title: "No Data", description: "There are no animals matching the current filter to export.", variant: "destructive" });
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
      const csvData = convertSiteAnimalsToCSV(filteredSiteAnimals, site.name, user);
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
      toast({ title: "Export Successful", description: `Filtered animal data for site ${site.name} has been downloaded.` });
      },0);
    } catch (error) {
      console.error("Failed to export site animals CSV:", error);
       setTimeout(()=> {
      toast({ title: "Export Failed", description: "Could not generate CSV file. Please try again.", variant: "destructive" });
       },0);
    }
  }, [filteredSiteAnimals, site, toast, user]);

  const totalPages = Math.ceil(filteredSiteAnimals.length / itemsPerPage);
  const paginatedSiteAnimals = filteredSiteAnimals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleFilterChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFilterText(event.target.value);
    setCurrentPage(1);
  };

  const handlePrint = () => {
    window.print();
  };


  if (isZooDataLoading || zoo === null || (zoo && site === null) ) {
    return (
      <div>
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-10 w-3/4 mb-2" />
        <Skeleton className="h-8 w-1/2 mb-2" />
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
          {processedAnimals.length > 0 && (
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" /> Export Filtered to CSV
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

      <h1 className="text-4xl font-bold mb-2 tracking-tight text-gray-800">All Animals in {site.name}</h1>
      <p className="text-xl text-muted-foreground mb-4">
        Total Groups/Animals: {processedAnimals.length} | Displaying: {filteredSiteAnimals.length} after filter
      </p>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Filter by Animal Name, Species, Common Name, Section, or Enclosure..."
          value={filterText}
          onChange={handleFilterChange}
          className="pl-10 w-full"
        />
      </div>

      {processedAnimals.length === 0 ? (
        <p className="text-lg text-muted-foreground">This site has no animals listed for verification.</p>
      ) : filteredSiteAnimals.length === 0 ? (
        <p className="text-lg text-muted-foreground">No animals match your current filter criteria.</p>
      ) : viewMode === 'card' ? (
        <div className="space-y-4">
          {paginatedSiteAnimals.map(animal => (
            <AnimalListItem
              key={animal.id + (animal.isGrouped ? '-grouped' : '')} // Ensure key is unique for grouped items
              animal={animal}
              onToggleVerify={handleToggleVerify}
              onToggleFeature={handleBooleanFeatureToggle}
              sectionName={animal.sectionName}
              enclosureName={animal.enclosureName}
            />
          ))}
        </div>
      ) : (
        <AnimalTable
            animals={paginatedSiteAnimals}
            onToggleVerify={handleToggleVerify}
            onToggleFeature={handleBooleanFeatureToggle}
        />
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor={`all-animals-items-per-page-select-${siteId}`} className="text-sm text-muted-foreground whitespace-nowrap">Items per page:</Label>
            <Select
              value={String(itemsPerPage)}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
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
