// src/components/zoo/section-card.tsx
import type { Section } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layers, Eye } from 'lucide-react'; // Using Layers for section icon

interface SectionCardProps {
  section: Section;
  zooId: string;
  siteId: string;
}

export default function SectionCard({ section, zooId, siteId }: SectionCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      {section.imageUrl && (
        <div className="relative h-48 w-full">
          <Image 
            src={section.imageUrl} 
            alt={`Image of ${section.name}`} 
            layout="fill" 
            objectFit="cover"
            data-ai-hint="zoo section area"
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <Layers className="mr-3 h-7 w-7 text-primary" />
          {section.name}
        </CardTitle>
        {/* Optional: Add description for section if available, e.g., section.description 
        <CardDescription>Optional description for the section.</CardDescription>
        */}
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground">
          This section contains {section.enclosures.length} enclosure(s).
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/zoos/${zooId}/sites/${siteId}/sections/${section.id}/enclosures`}>
            <Eye className="mr-2 h-5 w-5" />
            View Enclosures
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
