// src/app/zoos/create/page.tsx
"use client";
import CreateZooForm from '@/components/zoo/create-zoo-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Metadata } from 'next'; // Though metadata object is not used for client components

// export const metadata: Metadata = { // Cannot be used in client component directly
//   title: 'Create New Zoo - Ants Zoo Audit System',
// };

export default function CreateZooPage() {
  return (
    <div className="container mx-auto py-8 px-4 animate-fadeIn">
      <Button asChild variant="outline" className="mb-6">
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Link>
      </Button>
      <h1 className="text-3xl font-bold mb-2 tracking-tight">Create New Zoo</h1>
      <p className="text-muted-foreground mb-8">
        Enter the details for your new zoo. You can optionally upload a CSV file to populate its sites, enclosures, and animals.
      </p>
      <CreateZooForm />
    </div>
  );
}
