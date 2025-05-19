// src/components/zoo/site-card.tsx
import type { Site } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Warehouse, Eye, PawPrint } from 'lucide-react';

interface SiteCardProps {
  site: Site;
  zooId: string;
}

export default function SiteCard({ site, zooId }: SiteCardProps) {
  const totalAnimalsInSite = site.sections.reduce((acc, section) => 
    acc + section.enclosures.reduce((sAcc, enclosure) => sAcc + enclosure.animals.length, 0), 
  0);

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      {site.imageUrl && (
        <div className="relative h-48 w-full">
          <Image 
            src={site.imageUrl} 
            alt={`Image of ${site.name}`} 
            layout="fill" 
            objectFit="cover"
            data-ai-hint="zoo area"
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <Warehouse className="mr-3 h-7 w-7 text-primary" />
          {site.name}
        </CardTitle>
        <CardDescription className="flex items-center">
          <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
          {site.location}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        <p className="text-sm text-muted-foreground">
          This site has {site.sections.length} section(s) to explore.
        </p>
        <p className="text-sm text-muted-foreground">
          Contains a total of {totalAnimalsInSite} animal(s) across all sections and enclosures.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-2">
        <Button asChild className="w-full sm:flex-1" variant="outline">
          <Link href={`/zoos/${zooId}/sites/${site.id}/sections`}>
            <Eye className="mr-2 h-5 w-5" />
            View Sections
          </Link>
        </Button>
        <Button asChild className="w-full sm:flex-1">
          <Link href={`/zoos/${zooId}/sites/${site.id}/all-animals`}>
            <PawPrint className="mr-2 h-5 w-5" />
            View All Animals
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
