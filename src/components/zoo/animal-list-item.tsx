
// src/components/zoo/animal-list-item.tsx
"use client";
import type { Animal } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  PawPrint, CheckCircle, CircleOff, Tag, Clock, Disc3, Fingerprint, Milestone, 
  Scale, CalendarDays, BadgeHelp, PackagePlus, Info, WeightIcon, VenetianMask, Dna,
  Layers, // For Section
  Fence // For Enclosure
} from 'lucide-react'; 
import { Badge } from '@/components/ui/badge';

interface AnimalListItemProps {
  animal: Animal;
  onToggleVerify: (animalId: string) => void;
  sectionName?: string;   // New optional prop
  enclosureName?: string; // New optional prop
}

const DetailItem: React.FC<{ icon: React.ElementType, label: string, value?: string | number | null, fullWidth?: boolean }> = ({ icon: Icon, label, value, fullWidth = false }) => {
  if (value === null || value === undefined) return null;
  const displayValue = String(value).trim();
  if (displayValue === '') return null;

  return (
    <div className={`flex items-center text-xs text-muted-foreground ${fullWidth ? 'md:col-span-2' : ''}`}>
      <Icon className="mr-2 h-3.5 w-3.5 flex-shrink-0" />
      <span className="font-medium">{label}:</span>&nbsp;
      <span className="truncate" title={displayValue}>{displayValue}</span>
    </div>
  );
};

export default function AnimalListItem({ animal, onToggleVerify, sectionName, enclosureName }: AnimalListItemProps) {
  const verificationDate = animal.verified && animal.verifiedAt 
    ? new Date(animal.verifiedAt).toLocaleString() 
    : null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return undefined;
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return dateString; 
    }
  }

  return (
    <Card className="flex flex-col shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="flex flex-col sm:flex-row items-center p-4 gap-4">
        {animal.imageUrl && (
           <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-lg overflow-hidden flex-shrink-0">
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
          <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <PawPrint className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        
        <div className="flex-grow text-center sm:text-left w-full">
          <CardHeader className="p-0 mb-2">
            <CardTitle className="text-xl font-semibold flex items-center justify-center sm:justify-start">
              <PawPrint className="mr-2 h-5 w-5 text-primary hidden sm:inline" />
              {animal.name}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground space-y-0.5 mt-1">
              <div className="flex items-center justify-center sm:justify-start">
                <Tag className="mr-1 h-3.5 w-3.5 flex-shrink-0" /> 
                <span className="font-semibold">Species:</span>&nbsp;{animal.species} {animal.commonName && `(${animal.commonName})`}
              </div>
              {animal.microChip && (
                <div className="flex items-center justify-center sm:justify-start">
                  <Fingerprint className="mr-1 h-3.5 w-3.5 flex-shrink-0" />
                  <span className="font-semibold">Microchip:</span>&nbsp;{animal.microChip}
                </div>
              )}
              {animal.ringNumber && (
                <div className="flex items-center justify-center sm:justify-start">
                  <Disc3 className="mr-1 h-3.5 w-3.5 flex-shrink-0" />
                  <span className="font-semibold">Ring No.:</span>&nbsp;{animal.ringNumber}
                </div>
              )}
            </CardDescription>
            {animal.verified && verificationDate && (
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center justify-center sm:justify-start">
                <Clock className="mr-1 h-3 w-3" /> Verified on: {verificationDate}
              </p>
            )}
          </CardHeader>
          
          <CardContent className="p-0 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm mt-3">
            {sectionName && <DetailItem icon={Layers} label="Section" value={sectionName} />}
            {enclosureName && <DetailItem icon={Fence} label="Enclosure" value={enclosureName} />}
            <DetailItem icon={Milestone} label="Gender" value={animal.gender} />
            
            {animal.identifierType && animal.identifierValue && (
              <DetailItem icon={BadgeHelp} label={animal.identifierType} value={animal.identifierValue} fullWidth />
            )}
            
            {animal.breedName && (
              <DetailItem icon={Dna} label="Breed" value={animal.breedName} />
            )}
            
            {animal.morphName && (
              <DetailItem icon={VenetianMask} label="Morph" value={animal.morphName} />
            )}

            <DetailItem icon={WeightIcon} label="Weight" value={animal.weight} />
            <DetailItem icon={Info} label="Age" value={animal.age} />
            <DetailItem icon={CalendarDays} label="Accession Date" value={formatDate(animal.accessionDate)} />
            <DetailItem icon={PackagePlus} label="Accession Type" value={animal.accessionType} />
            <DetailItem icon={CalendarDays} label="Birth Date" value={formatDate(animal.birthDate)} />
            <DetailItem icon={CalendarDays} label="Added on Antz" value={formatDate(animal.addedOnAntz)} />
          </CardContent>
        </div>

        <div className="flex flex-col items-center sm:items-end gap-2 mt-2 sm:mt-0 flex-shrink-0">
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
            size="sm"
          >
            {animal.verified ? (
              <><CircleOff size={16} className="mr-2" /> Unverify</>
            ) : (
              <><CheckCircle size={16} className="mr-2" /> Verify</>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
