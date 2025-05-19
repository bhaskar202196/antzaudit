
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
import { CheckCircle, CircleOff, PawPrint, Fingerprint, Disc3, Layers, Fence, Milestone, PackagePlus, Dna, BadgeHelp } from 'lucide-react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';

// Animal type that might include section and enclosure names
interface AnimalWithContext extends Animal {
  sectionName?: string;
  enclosureName?: string;
}

interface AnimalTableProps {
  animals: AnimalWithContext[];
  onToggleVerify: (animalId: string) => void;
}

export default function AnimalTable({ animals, onToggleVerify }: AnimalTableProps) {
  const showSectionEnclosureColumns = animals.length > 0 && (animals[0].sectionName !== undefined || animals[0].enclosureName !== undefined);

  return (
    <Card className="overflow-hidden shadow-md">
        <Table>
        <TableHeader>
            <TableRow>
            <TableHead className="w-[60px] hidden md:table-cell px-2">Image</TableHead>
            <TableHead className="px-2 min-w-[120px]">Name</TableHead>
            <TableHead className="px-2 min-w-[200px] font-bold">Species (Common Name)</TableHead>
            {showSectionEnclosureColumns ? <TableHead className="hidden lg:table-cell px-2 min-w-[100px]">Section</TableHead> : null}
            {showSectionEnclosureColumns ? <TableHead className="hidden lg:table-cell px-2 min-w-[100px]">Enclosure</TableHead> : null}
            <TableHead className="hidden md:table-cell px-2 min-w-[80px]">Gender</TableHead>
            <TableHead className="hidden xl:table-cell px-2 min-w-[120px]">Micro Chip</TableHead>
            <TableHead className="hidden xl:table-cell px-2 min-w-[100px]">Ring No.</TableHead>
            <TableHead className="hidden xl:table-cell px-2 min-w-[120px]">Identifier Type</TableHead>
            <TableHead className="hidden xl:table-cell px-2 min-w-[120px]">Identifier Value</TableHead>
            <TableHead className="px-2 min-w-[100px]">Status</TableHead>
            <TableHead className="hidden xl:table-cell px-2 min-w-[150px]">Verified At</TableHead>
            <TableHead className="text-right px-2 min-w-[100px]">Actions</TableHead>
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
                <TableCell className="px-2 font-semibold text-foreground">
                  {animal.species}{animal.commonName ? ` (${animal.commonName})` : ''}
                </TableCell>
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
                <TableCell className="hidden xl:table-cell px-2">
                {animal.verified && animal.verifiedAt
                    ? new Date(animal.verifiedAt).toLocaleString()
                    : '-'}
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
            </TableRow>
            ))}
        </TableBody>
        </Table>
    </Card>
  );
}
