
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
  Fence, // For Enclosure
  Moon, ThermometerSnowflake, Video, Users // For Animal Count
} from 'lucide-react'; 
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Updated Animal type for display, expecting animalCount and isGrouped
interface DisplayAnimal extends Animal {
  animalCount: number;
  isGrouped: boolean;
  // sectionName and enclosureName are passed as props if available
}

interface AnimalListItemProps {
  animal: DisplayAnimal;
  onToggleVerify: (animalId: string) => void;
  onToggleFeature: (animalId: string, featureName: 'nightCellPresence' | 'airConditioning' | 'camera', value: boolean) => void;
  sectionName?: string;
  enclosureName?: string;
}

const DetailItem: React.FC<{ icon: React.ElementType, label: string, value?: string | number | null, fullWidth?: boolean, className?: string, isHighlighted?: boolean }> = ({ icon: Icon, label, value, fullWidth = false, className = '', isHighlighted = false }) => {
  if (value === null || value === undefined) return null;
  const displayValue = String(value).trim();
  if (displayValue === '') return null;

  return (
    <div className={`flex items-center text-xs text-muted-foreground ${fullWidth ? 'md:col-span-2' : ''} ${className}`}>
      <Icon className="mr-2 h-3.5 w-3.5 flex-shrink-0" />
      <span className={`font-medium ${isHighlighted ? 'text-foreground' : ''}`}>{label}:</span>&nbsp;
      <span className={`truncate ${isHighlighted ? 'font-semibold text-foreground' : ''}`} title={displayValue}>{displayValue}</span>
    </div>
  );
};

export default function AnimalListItem({ animal, onToggleVerify, onToggleFeature, sectionName, enclosureName }: AnimalListItemProps) {
  const verificationDate = animal.verified && animal.verifiedAt 
    ? new Date(animal.verifiedAt).toLocaleString() 
    : null;

  const handleFeatureToggle = (featureName: 'nightCellPresence' | 'airConditioning' | 'camera', value: boolean) => {
    if (animal.isGrouped) return; // Prevent action on grouped animals
    onToggleFeature(animal.id, featureName, value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return undefined;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; 
      return date.toLocaleDateString();
    } catch (e) {
      return dateString; 
    }
  }

  return (
    <Card className={`flex flex-col shadow-md hover:shadow-lg transition-shadow duration-300 ${animal.isGrouped ? 'bg-blue-50 border-blue-200' : ''}`}>
      <div className="flex flex-col sm:flex-row items-start p-4 gap-4">
        {animal.imageUrl && (
           <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-lg overflow-hidden flex-shrink-0 self-center sm:self-start">
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
          <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 self-center sm:self-start">
            <PawPrint className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        
        <div className="flex-grow text-center sm:text-left w-full">
          <CardHeader className="p-0 mb-2">
            <CardTitle className="text-xl font-semibold flex items-center justify-center sm:justify-start">
              <PawPrint className="mr-2 h-5 w-5 text-primary hidden sm:inline" />
              {animal.name}
              {animal.isGrouped && (
                <Badge variant="secondary" className="ml-2 flex items-center">
                  <Users className="mr-1 h-3.5 w-3.5" /> Count: {animal.animalCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground space-y-0.5 mt-1">
              <div className="flex items-center justify-center sm:justify-start">
                <Tag className="mr-1 h-3.5 w-3.5 flex-shrink-0 text-primary" /> 
                <span className="font-semibold text-foreground">Species:</span>&nbsp;
                <span className="font-bold text-foreground">{animal.species}</span>
                {animal.commonName && <span className="font-bold text-foreground">&nbsp;({animal.commonName})</span>}
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
            {animal.verified && verificationDate && !animal.isGrouped && (
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center justify-center sm:justify-start">
                <Clock className="mr-1 h-3 w-3" /> Verified on: {verificationDate}
              </p>
            )}
          </CardHeader>
          
          <CardContent className="p-0 mt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5 text-sm mb-3">
              {sectionName && <DetailItem icon={Layers} label="Section" value={sectionName} isHighlighted />}
              {enclosureName && <DetailItem icon={Fence} label="Enclosure" value={enclosureName} isHighlighted />}
              <DetailItem icon={Milestone} label="Gender" value={animal.gender} />
              
              {animal.identifierType && animal.identifierValue && (
                <DetailItem icon={BadgeHelp} label={animal.identifierType} value={animal.identifierValue} fullWidth isHighlighted />
              )}
            </div>

            <div className={`space-y-3 my-3 border-t border-b py-3 ${animal.isGrouped ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <div className="flex items-center justify-between">
                <Label htmlFor={`nightCell-${animal.id}`} className="flex items-center text-sm font-medium">
                  <Moon className="mr-2 h-4 w-4 text-muted-foreground" /> Night Cell
                </Label>
                <Switch
                  id={`nightCell-${animal.id}`}
                  checked={!!animal.nightCellPresence}
                  onCheckedChange={(value) => handleFeatureToggle('nightCellPresence', value)}
                  aria-label="Night Cell Presence"
                  disabled={animal.isGrouped}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor={`ac-${animal.id}`} className="flex items-center text-sm font-medium">
                  <ThermometerSnowflake className="mr-2 h-4 w-4 text-muted-foreground" /> Air Conditioning
                </Label>
                <Switch
                  id={`ac-${animal.id}`}
                  checked={!!animal.airConditioning}
                  onCheckedChange={(value) => handleFeatureToggle('airConditioning', value)}
                  aria-label="Air Conditioning Presence"
                  disabled={animal.isGrouped}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor={`camera-${animal.id}`} className="flex items-center text-sm font-medium">
                  <Video className="mr-2 h-4 w-4 text-muted-foreground" /> Camera
                </Label>
                <Switch
                  id={`camera-${animal.id}`}
                  checked={!!animal.camera}
                  onCheckedChange={(value) => handleFeatureToggle('camera', value)}
                  aria-label="Camera Presence"
                  disabled={animal.isGrouped}
                />
              </div>
            </div>

            <Accordion type="single" collapsible className="w-full mt-3">
              <AccordionItem value="additional-details">
                <AccordionTrigger className="text-xs hover:no-underline py-2 px-1 -ml-1 flex justify-start">
                  <div className="flex items-center text-muted-foreground">
                    <Info className="mr-2 h-4 w-4" /> 
                    <span>Additional Details (Breed, Age, Dates, etc.)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-0 text-xs space-y-1.5 pl-2">
                  {animal.breedName && (
                    <DetailItem icon={Dna} label="Breed" value={animal.breedName} />
                  )}
                  {animal.morphName && (
                    <DetailItem icon={VenetianMask} label="Morph" value={animal.morphName} />
                  )}
                  <DetailItem icon={Info} label="Age" value={animal.age} />
                  <DetailItem icon={WeightIcon} label="Weight" value={animal.weight} />
                  <DetailItem icon={PackagePlus} label="Accession Type" value={animal.accessionType} />
                  <DetailItem icon={CalendarDays} label="Accession Date" value={formatDate(animal.accessionDate)} />
                  <DetailItem icon={CalendarDays} label="Birth Date" value={formatDate(animal.birthDate)} />
                  <DetailItem icon={CalendarDays} label="Added on Antz" value={formatDate(animal.addedOnAntz)} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </div>

        <div className="flex flex-col items-center sm:items-end gap-2 mt-2 sm:mt-0 flex-shrink-0 self-center sm:self-start">
          {!animal.isGrouped && (animal.verified ? (
            <Badge variant="default" className="bg-accent text-accent-foreground select-none">
              <CheckCircle size={16} className="mr-1" /> Verified
            </Badge>
          ) : (
            <Badge variant="secondary" className="select-none">
              <CircleOff size={16} className="mr-1" /> Not Verified
            </Badge>
          ))}
          {animal.isGrouped && (
            <Badge variant="outline" className="select-none border-blue-500 text-blue-700">
              Grouped
            </Badge>
          )}
          <Button
            onClick={() => onToggleVerify(animal.id)}
            variant={animal.verified ? "outline" : "default"}
            className={`w-full sm:w-auto ${!animal.verified ? 'bg-accent text-accent-foreground hover:bg-accent/90 focus-visible:ring-accent' : 'border-accent text-accent hover:bg-accent/10 focus-visible:ring-accent'}`}
            size="sm"
            disabled={animal.isGrouped}
            title={animal.isGrouped ? "Verification disabled for grouped animals" : (animal.verified ? "Unverify Animal" : "Verify Animal")}
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
