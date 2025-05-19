
// src/components/zoo/animal-table.tsx
"use client";
import type { Animal } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, CircleOff, PawPrint, Fingerprint, Disc3, Layers, Fence, Milestone, PackagePlus, Dna, BadgeHelp, Moon, ThermometerSnowflake, Video } from 'lucide-react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useZooData } from '@/contexts/zoo-data-context';
import { useParams } from 'next/navigation';

// Animal type that might include section and enclosure names
interface AnimalWithContext extends Animal {
  sectionName?: string;
  enclosureName?: string;
  // Make sure these are included from the context or props if needed elsewhere on the page
  sectionId?: string;
  enclosureId?: string;
}

interface AnimalTableProps {
  animals: AnimalWithContext[];
  onToggleVerify: (animalId: string) => void;
}

export default function AnimalTable({ animals, onToggleVerify }: AnimalTableProps) {
  const showSectionEnclosureColumns = animals.length > 0 && (animals[0].sectionName !== undefined || animals[0].enclosureName !== undefined);
  
  const params = useParams<{ zooId: string; siteId: string; sectionId?: string; enclosureId?: string }>();
  const { updateAnimalBooleanFeature } = useZooData();

  const handleFeatureToggle = (animal: AnimalWithContext, featureName: 'nightCellPresence' | 'airConditioning' | 'camera', value: boolean) => {
    // Determine sectionId and enclosureId: prefer from animal object (for all-animals page), fallback to params (for enclosure-specific page)
    const currentSectionId = animal.sectionId || params.sectionId;
    const currentEnclosureId = animal.enclosureId || params.enclosureId;

    if (params.zooId && params.siteId && currentSectionId && currentEnclosureId) {
      updateAnimalBooleanFeature(params.zooId, params.siteId, currentSectionId, currentEnclosureId, animal.id, featureName, value);
    } else {
      console.error("Missing parameters for feature toggle in table. Animal data:", animal, "URL Params:", params);
    }
  };


  return (
    <Card className="overflow-hidden shadow-md">
        <Table>
        <TableHeader>
            <TableRow>
            <TableHead className="w-[60px] hidden md:table-cell px-2">Image</TableHead>
            <TableHead className="px-2 min-w-[120px]">Name</TableHead>
            <TableHead className="px-2 min-w-[200px] font-bold">Species (Common Name)</TableHead>
            
            {/* Moved Forward Columns */}
            <TableHead className="hidden lg:table-cell px-2 text-center min-w-[90px]">Night Cell</TableHead>
            <TableHead className="hidden lg:table-cell px-2 text-center min-w-[90px]">AC</TableHead>
            <TableHead className="hidden lg:table-cell px-2 text-center min-w-[90px]">Camera</TableHead>
            <TableHead className="px-2 min-w-[100px]">Status</TableHead>
            <TableHead className="text-right px-2 min-w-[100px]">Actions</TableHead>

            {/* Contextual Columns */}
            {showSectionEnclosureColumns ? <TableHead className="hidden lg:table-cell px-2 min-w-[100px]">Section</TableHead> : null}
            {showSectionEnclosureColumns ? <TableHead className="hidden lg:table-cell px-2 min-w-[100px]">Enclosure</TableHead> : null}
            
            {/* Other Detail Columns */}
            <TableHead className="hidden xl:table-cell px-2 min-w-[150px]">Verified At</TableHead>
            <TableHead className="hidden md:table-cell px-2 min-w-[80px]">Gender</TableHead>
            <TableHead className="hidden xl:table-cell px-2 min-w-[120px]">Micro Chip</TableHead>
            <TableHead className="hidden xl:table-cell px-2 min-w-[100px]">Ring No.</TableHead>
            <TableHead className="hidden xl:table-cell px-2 min-w-[120px]">ID Type</TableHead>
            <TableHead className="hidden xl:table-cell px-2 min-w-[120px]">ID Value</TableHead>
            <TableHead className="hidden xl:table-cell px-2 min-w-[100px]">Breed</TableHead>
            <TableHead className="hidden xl:table-cell px-2 min-w-[120px]">Accession Type</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {animals.map((animal) => (
            <TableRow key={animal.id}>
                <TableCell className="hidden md:table-cell px-2">
                {animal.imageUrl ? (
                    <Image
                    src={animal.imageUrl}
                    alt={animal.name}
                    width={40}
                    height={40}
                    className="rounded-md object-cover"
                    data-ai-hint={`${animal.species} animal`}
                    />
                ) : (
                    <div className="w-[40px] h-[40px] bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                    <PawPrint size={20} />
                    </div>
                )}
                </TableCell>
                <TableCell className="font-medium px-2">{animal.name}</TableCell>
                <TableCell className="px-2">
                  <span className="font-bold text-foreground">{animal.species}</span>{animal.commonName ? ` (${animal.commonName})` : ''}
                </TableCell>

                {/* Moved Forward Columns Data */}
                <TableCell className="hidden lg:table-cell px-2 text-center">
                    <Switch
                        checked={!!animal.nightCellPresence}
                        onCheckedChange={(value) => handleFeatureToggle(animal, 'nightCellPresence', value)}
                        aria-label="Night Cell Presence"
                        className="mx-auto"
                    />
                </TableCell>
                <TableCell className="hidden lg:table-cell px-2 text-center">
                    <Switch
                        checked={!!animal.airConditioning}
                        onCheckedChange={(value) => handleFeatureToggle(animal, 'airConditioning', value)}
                        aria-label="Air Conditioning"
                        className="mx-auto"
                    />
                </TableCell>
                <TableCell className="hidden lg:table-cell px-2 text-center">
                    <Switch
                        checked={!!animal.camera}
                        onCheckedChange={(value) => handleFeatureToggle(animal, 'camera', value)}
                        aria-label="Camera"
                        className="mx-auto"
                    />
                </TableCell>
                <TableCell className="px-2">
                {animal.verified ? (
                    <Badge variant="default" className="bg-accent text-accent-foreground whitespace-nowrap">
                    <CheckCircle size={14} className="mr-1" /> Verified
                    </Badge>
                ) : (
                    <Badge variant="secondary" className="whitespace-nowrap">
                    <CircleOff size={14} className="mr-1" /> Not Verified
                    </Badge>
                )}
                </TableCell>
                <TableCell className="text-right px-2">
                <Button
                    onClick={() => onToggleVerify(animal.id)}
                    variant={animal.verified ? "outline" : "default"}
                    size="sm"
                    className={`whitespace-nowrap ${!animal.verified ? 'bg-accent text-accent-foreground hover:bg-accent/90 focus-visible:ring-accent' : 'border-accent text-accent hover:bg-accent/10 focus-visible:ring-accent'}`}
                >
                    {animal.verified ? (
                        <><CircleOff size={16} className="mr-1 sm:mr-2" /> <span className="hidden sm:inline">Unverify</span></>
                        ) : (
                        <><CheckCircle size={16} className="mr-1 sm:mr-2" /> <span className="hidden sm:inline">Verify</span></>
                    )}
                </Button>
                </TableCell>
                
                {/* Contextual Columns Data */}
                {showSectionEnclosureColumns ? (
                  <TableCell className="hidden lg:table-cell px-2">
                    {animal.sectionName ? <span className="flex items-center"><Layers size={14} className="mr-1 text-muted-foreground"/> {animal.sectionName}</span> : '-'}
                  </TableCell>
                ) : null}
                {showSectionEnclosureColumns ? (
                  <TableCell className="hidden lg:table-cell px-2">
                     {animal.enclosureName ? <span className="flex items-center"><Fence size={14} className="mr-1 text-muted-foreground"/> {animal.enclosureName}</span> : '-'}
                  </TableCell>
                ) : null}

                {/* Other Detail Columns Data */}
                <TableCell className="hidden xl:table-cell px-2">
                {animal.verified && animal.verifiedAt
                    ? new Date(animal.verifiedAt).toLocaleString()
                    : '-'}
                </TableCell>
                <TableCell className="hidden md:table-cell px-2">
                    {animal.gender ? (
                        <span className="flex items-center"><Milestone size={14} className="mr-1 text-muted-foreground"/> {animal.gender}</span>
                    ) : '-'}
                </TableCell>
                <TableCell className="hidden xl:table-cell px-2">
                    {animal.microChip ? (
                        <span className="flex items-center"><Fingerprint size={14} className="mr-1 text-muted-foreground"/> {animal.microChip}</span>
                    ) : '-'}
                </TableCell>
                <TableCell className="hidden xl:table-cell px-2">
                    {animal.ringNumber ? (
                        <span className="flex items-center"><Disc3 size={14} className="mr-1 text-muted-foreground"/> {animal.ringNumber}</span>
                    ) : '-'}
                </TableCell>
                <TableCell className="hidden xl:table-cell px-2">
                    {animal.identifierType ? (
                        <span className="flex items-center"><BadgeHelp size={14} className="mr-1 text-muted-foreground"/> {animal.identifierType}</span>
                    ) : '-'}
                </TableCell>
                 <TableCell className="hidden xl:table-cell px-2">
                    {animal.identifierValue || '-'}
                </TableCell>
                <TableCell className="hidden xl:table-cell px-2">
                    {animal.breedName ? (
                        <span className="flex items-center"><Dna size={14} className="mr-1 text-muted-foreground"/> {animal.breedName}</span>
                    ) : '-'}
                </TableCell>
                <TableCell className="hidden xl:table-cell px-2">
                    {animal.accessionType ? (
                        <span className="flex items-center"><PackagePlus size={14} className="mr-1 text-muted-foreground"/> {animal.accessionType}</span>
                    ) : '-'}
                </TableCell>
            </TableRow>
            ))}
        </TableBody>
        </Table>
    </Card>
  );
}

