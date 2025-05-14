
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
import { CheckCircle, CircleOff } from 'lucide-react';
import Image from 'next/image';

interface AnimalTableProps {
  animals: Animal[];
  onToggleVerify: (animalId: string) => void;
}

export default function AnimalTable({ animals, onToggleVerify }: AnimalTableProps) {
  return (
    <Card className="overflow-hidden shadow-md">
        <Table>
        <TableHeader>
            <TableRow>
            <TableHead className="w-[80px] hidden md:table-cell">Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Species</TableHead>
            <TableHead className="hidden sm:table-cell">Common Name</TableHead>
            <TableHead className="hidden lg:table-cell">Gender</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Verified At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {animals.map((animal) => (
            <TableRow key={animal.id}>
                <TableCell className="hidden md:table-cell">
                {animal.imageUrl ? (
                    <Image
                    src={animal.imageUrl}
                    alt={animal.name}
                    width={50}
                    height={50}
                    className="rounded-md object-cover"
                    data-ai-hint={`${animal.species} animal`}
                    />
                ) : (
                    <div className="w-[50px] h-[50px] bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                    <PawPrint size={24} />
                    </div>
                )}
                </TableCell>
                <TableCell className="font-medium">{animal.name}</TableCell>
                <TableCell>{animal.species}</TableCell>
                <TableCell className="hidden sm:table-cell">{animal.commonName || '-'}</TableCell>
                <TableCell className="hidden lg:table-cell">{animal.gender || '-'}</TableCell>
                <TableCell>
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
                <TableCell className="hidden md:table-cell">
                {animal.verified && animal.verifiedAt
                    ? new Date(animal.verifiedAt).toLocaleString()
                    : '-'}
                </TableCell>
                <TableCell className="text-right">
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

// Need to import PawPrint and Card if they are used in the final version.
// For now, assuming basic table structure as described.
import { PawPrint } from 'lucide-react'; // Added PawPrint as it was used in the thought process for placeholder
import { Card } from '@/components/ui/card'; // Added Card for wrapping the table

