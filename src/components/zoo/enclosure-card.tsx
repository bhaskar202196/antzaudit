// src/components/zoo/enclosure-card.tsx
import type { Enclosure } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Fence, Home, Eye, Tag } from 'lucide-react'; // Using Home as a fallback if Fence isn't fitting

interface EnclosureCardProps {
  enclosure: Enclosure;
  zooId: string;
  siteId: string;
}

export default function EnclosureCard({ enclosure, zooId, siteId }: EnclosureCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      {enclosure.imageUrl && (
        <div className="relative h-48 w-full">
          <Image 
            src={enclosure.imageUrl} 
            alt={`Image of ${enclosure.name}`} 
            layout="fill" 
            objectFit="cover"
            data-ai-hint="animal enclosure"
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <Fence className="mr-3 h-7 w-7 text-primary" /> {/* Or Home */}
          {enclosure.name}
        </CardTitle>
        <CardDescription className="flex items-center">
          <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
          Type: {enclosure.type}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground">
          This enclosure houses {enclosure.animals.length} animal(s) requiring verification.
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/zoos/${zooId}/sites/${siteId}/enclosures/${enclosure.id}/animals`}>
            <Eye className="mr-2 h-5 w-5" />
            View Animals
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
