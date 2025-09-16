
// src/app/dashboard/page.tsx
"use client";
import type { Zoo } from '@/lib/types';
import ZooCard from '@/components/zoo/zoo-card';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState, type ChangeEvent } from 'react'; 
import { useBreadcrumbs } from '@/contexts/breadcrumb-context';
import { useZooData } from '@/contexts/zoo-data-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, UploadCloud, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CsvUpload from '@/components/csv/csv-upload';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user } = useAuth();
  const { zoos, createZoo, isLoading: isZooDataLoading } = useZooData();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { toast } = useToast();
  const router = useRouter();

  // State for the new inline form for importing the first zoo
  const [newZooName, setNewZooName] = useState('Ants');
  const [newZooCity, setNewZooCity] = useState('BLR');
  const [selectedCsvFile, setSelectedCsvFile] = useState<File | null>(null);
  const [isProcessingInlineUpload, setIsProcessingInlineUpload] = useState(false);

  useEffect(() => {
    setBreadcrumbs([]); 
  }, [setBreadcrumbs]);

  const pageLoading = isZooDataLoading || !user;

  const handleInlineCsvFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedCsvFile(event.target.files[0]);
    } else {
      setSelectedCsvFile(null);
    }
    if (!event.target.files || event.target.files.length === 0) {
      // Clear the input value if no file is selected or if the selection is cancelled
      event.target.value = ''; 
    }
  };

  const handleInlineCreateZooFromCsv = async () => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    if (!newZooName.trim() || !newZooCity.trim()) {
      toast({ title: "Missing Information", description: "Please enter a name and city for the new zoo.", variant: "destructive" });
      return;
    }
    if (!selectedCsvFile) {
      toast({ title: "Missing File", description: "Please select a CSV file to import.", variant: "destructive" });
      return;
    }

    setIsProcessingInlineUpload(true);
    let csvString: string;
    try {
      csvString = await selectedCsvFile.text();
    } catch (error) {
      console.error("File Read Error:", error);
      toast({ title: "File Read Error", description: "Could not read the selected CSV file.", variant: "destructive" });
      setIsProcessingInlineUpload(false);
      return;
    }

    const result = await createZoo(
      { name: newZooName.trim(), city: newZooCity.trim() },
      csvString,
      user
    );

    setIsProcessingInlineUpload(false);

    if (result.success && result.newZooId) {
      toast({ title: "Zoo Imported", description: `${newZooName.trim()} has been successfully imported.` });
      router.push(`/zoos/${result.newZooId}/sites`);
      // Clear form
      setNewZooName('');
      setNewZooCity('');
      setSelectedCsvFile(null);
      const fileInput = document.getElementById('inlineDashboardCsvUpload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } else {
      toast({ title: "Import Failed", description: result.error || "An unknown error occurred.", variant: "destructive" });
    }
  };


  if (pageLoading) { 
    return (
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Your Zoos</h1>
          <Skeleton className="h-10 w-48" /> {/* Create Zoo Button Skeleton */}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="flex flex-col">
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-7 w-3/4 mb-2" />
                <Skeleton className="h-5 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  if (!user) {
    // This case should ideally be handled by middleware or MainAppLayout,
    // but as a fallback:
    return <p>Please log in to view your zoos. Redirecting...</p>;
  }

  const userZoos = zoos.filter(zoo => zoo.userId === user.id);
  const overallLoading = isZooDataLoading || isProcessingInlineUpload;

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-4xl font-bold tracking-tight text-gray-800">Your Zoos</h1>
        <Button asChild size="lg">
          <Link href="/zoos/create">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Zoo Manually
          </Link>
        </Button>
      </div>
      
      {userZoos.length === 0 ? (
        <Card className="shadow-xl my-8 bg-card">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center text-card-foreground">
              <UploadCloud className="mr-3 h-6 w-6 text-primary" />
              Import Your First Zoo
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              No zoos found. Get started by providing a name, city, and uploading a CSV file with your zoo's data. Default values provided.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="inlineNewZooName" className="text-card-foreground">New Zoo Name</Label>
              <Input
                id="inlineNewZooName"
                placeholder="e.g., My Awesome Zoo"
                value={newZooName}
                onChange={(e) => setNewZooName(e.target.value)}
                disabled={overallLoading}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inlineNewZooCity" className="text-card-foreground">City</Label>
              <Input
                id="inlineNewZooCity"
                placeholder="e.g., Animalville"
                value={newZooCity}
                onChange={(e) => setNewZooCity(e.target.value)}
                disabled={overallLoading}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <CsvUpload
                selectedFile={selectedCsvFile}
                onFileChange={handleInlineCsvFileChange}
                instanceId="inlineDashboardCsvUpload"
                disabled={overallLoading}
                label="Upload Zoo Data (CSV)"
              />
               <p className="text-xs text-muted-foreground">
                 The CSV should contain columns like 'Antz Animal Id', 'Scientific Name', 'Site/Facilty', 'Section Name', 'Enclosure Name', etc. 'Organization Name' from CSV will be ignored.
               </p>
            </div>
            <Button 
              onClick={handleInlineCreateZooFromCsv} 
              className="w-full" 
              disabled={overallLoading || !selectedCsvFile || !newZooName.trim() || !newZooCity.trim()}
            >
              {overallLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="mr-2 h-4 w-4" />
              )}
              {overallLoading ? 'Importing Zoo...' : 'Import Zoo from CSV'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8 mt-6">
          {userZoos.map(zoo => (
            <ZooCard key={zoo.id} zoo={zoo} />
          ))}
        </div>
      )}
    </div>
  );
}

