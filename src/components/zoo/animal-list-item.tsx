// src/components/zoo/animal-list-item.tsx
"use client";
import type { Animal } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PawPrint, CheckCircle, CircleOff, Tag } from 'lucide-react'; // Using PawPrint for animal icon
import { Badge } from '@/components/ui/badge';

interface AnimalListItemProps {
  animal: Animal;
  onToggleVerify: (animalId: string) => void;
}

export default function AnimalListItem({ animal, onToggleVerify }: AnimalListItemProps) {
  return (
    <Card className="flex flex-col sm:flex-row items-center p-4 gap-4 shadow-md hover:shadow-lg transition-shadow duration-300">
      {animal.imageUrl && (
         <div className="relative h-24 w-24 sm:h-20 sm:w-20 rounded-lg overflow-hidden flex-shrink-0">
          <Image 
            src={animal.imageUrl} 
            alt={`Image of ${animal.name}`} 
            layout="fill" 
            objectFit="cover"
            data-ai-hint={`${animal.species} animal`}
          />
        </div>
      )}
      {!animal.imageUrl && (
        <div className="h-24 w-24 sm:h-20 sm:w-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <PawPrint className="h-10 w-10 text-muted-foreground" />
        </div>
      )}
      
      <div className="flex-grow text-center sm:text-left">
        <CardTitle className="text-xl font-semibold flex items-center justify-center sm:justify-start">
          <PawPrint className="mr-2 h-5 w-5 text-primary hidden sm:inline" />
          {animal.name}
        </CardTitle>
        <CardDescription className="flex items-center justify-center sm:justify-start text-sm text-muted-foreground">
          <Tag className="mr-1 h-3 w-3" /> Species: {animal.species}
        </CardDescription>
      </div>

      <div className="flex flex-col items-center sm:items-end gap-2 mt-2 sm:mt-0">
        {animal.verified ? (
          <Badge variant="default" className="bg-accent text-accent-foreground select-none">
            <CheckCircle size={16} className="mr-1" /> Verified
          </Badge>
        ) : (
          <Badge variant="secondary" className="select-none">
            <CircleOff size={16} className="mr-1" /> Not Verified
          </Badge>
        )}
        <Button
          onClick={() => onToggleVerify(animal.id)}
          variant={animal.verified ? "outline" : "default"}
          className={`w-full sm:w-auto ${!animal.verified ? 'bg-accent text-accent-foreground hover:bg-accent/90 focus-visible:ring-accent' : 'border-accent text-accent hover:bg-accent/10 focus-visible:ring-accent'}`}
        >
          {animal.verified ? (
            <><CheckCircle size={18} className="mr-2" /> Unverify</>
          ) : (
            <><CircleOff size={18} className="mr-2" /> Verify</>
          )}
        </Button>
      </div>
    </Card>
  );
}
