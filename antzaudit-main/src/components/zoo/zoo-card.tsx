// src/components/zoo/zoo-card.tsx
import type { Zoo } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, Eye } from 'lucide-react';

interface ZooCardProps {
  zoo: Zoo;
}

export default function ZooCard({ zoo }: ZooCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      {zoo.imageUrl && (
        <div className="relative h-48 w-full">
          <Image 
            src={zoo.imageUrl} 
            alt={`Image of ${zoo.name}`} 
            layout="fill" 
            objectFit="cover"
            data-ai-hint="zoo exterior"
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <Building2 className="mr-3 h-7 w-7 text-primary" />
          {zoo.name}
        </CardTitle>
        <CardDescription className="flex items-center">
          <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
          {zoo.city}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground">
          This zoo has {zoo.sites.length} distinct site(s) to explore and audit.
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/zoos/${zoo.id}/sites`}>
            <Eye className="mr-2 h-5 w-5" />
            View Sites
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
