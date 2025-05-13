// src/app/dashboard/page.tsx
"use client";
import type { Zoo } from '@/lib/types';
import ZooCard from '@/components/zoo/zoo-card';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState, type ChangeEvent } from 'react'; 
import { useBreadcrumbs } from '@/contexts/breadcrumb-context';
import { useZooData } from '@/contexts/zoo-data-context';
import CsvUpload from '@/components/csv/csv-upload';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, UploadCloud, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { user } = useAuth();
  const { zoos, isLoading: isZooDataLoading, replaceGlobalZoosFromCsv } = useZooData();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { toast } = useToast();

  const [selectedGlobalCsvFile, setSelectedGlobalCsvFile] = useState<File | null>(null);
  const [isProcessingGlobalCsv, setIsProcessingGlobalCsv] = useState(false);


  useEffect(() => {
    setBreadcrumbs([]); 
  }, [setBreadcrumbs]);

  const handleGlobalFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedGlobalCsvFile(event.target.files[0]);
    } else {
      setSelectedGlobalCsvFile(null);
    }
     if (!event.target.files || event.target.files.length === 0) {
         event.target.value = ''; 
    }
  };

  const handleGlobalCsvUpload = async () => {
    if (!selectedGlobalCsvFile) {
      toast({ title: "Upload Error", description: "Please select a CSV file.", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to upload data.", variant: "destructive" });
      return;
    }

    setIsProcessingGlobalCsv(true);
    
    try {
      const csvString = await selectedGlobalCsvFile.text();
      const { success, error } = await replaceGlobalZoosFromCsv(csvString, user);

      if (success) {
        toast({ title: "Global CSV Processed", description: "All zoo data has been replaced by the CSV content." });
        setSelectedGlobalCsvFile(null); 
        // Clear the file input visually
        const fileInput = document.getElementById('globalCsvUpload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        toast({ title: "CSV Processing Failed", description: error || "An unknown error occurred.", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "File Read Error", description: "Could not read the selected file.", variant: "destructive" });
    } finally {
      setIsProcessingGlobalCsv(false);
    }
  };


  const pageLoading = isZooDataLoading || !user || isProcessingGlobalCsv;

  if (pageLoading && !isProcessingGlobalCsv) { // Show skeleton if initial load or auth load
    return (
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Your Zoos</h1>
          <Skeleton className="h-10 w-36" /> {/* Create Zoo Button Skeleton */}
        </div>
        
        {/* Global CSV Upload Section Skeleton */}
        <div className="p-4 border rounded-lg shadow-sm bg-card my-6">
          <Skeleton className="h-6 w-1/2 mb-3" />
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <Skeleton className="h-10 flex-grow w-full sm:w-auto" />
            <Skeleton className="h-10 w-full sm:w-40" />
          </div>
          <Skeleton className="h-4 w-3/4 mt-3" />
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
    return <p>Please log in to view your zoos. Redirecting...</p>;
  }

  const userZoos = zoos.filter(zoo => zoo.userId === user.id);

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-4xl font-bold tracking-tight text-gray-800">Your Zoos</h1>
        <Button asChild size="lg">
          <Link href="/zoos/create">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Zoo
          </Link>
        </Button>
      </div>

      {/* Global CSV Upload Section */}
      <div className="p-4 border rounded-lg shadow-sm bg-card my-8">
        <h3 className="text-lg font-semibold mb-3 text-card-foreground flex items-center">
          <UploadCloud className="mr-2 h-5 w-5 text-primary" />
          Replace All Zoo Data via CSV
        </h3>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex-grow w-full sm:w-auto">
            <CsvUpload
              selectedFile={selectedGlobalCsvFile}
              onFileChange={handleGlobalFileChange}
              instanceId="globalCsvUpload"
              disabled={isProcessingGlobalCsv || isZooDataLoading}
              label="Select CSV to replace all data"
            />
          </div>
          <Button 
            onClick={handleGlobalCsvUpload} 
            disabled={!selectedGlobalCsvFile || isProcessingGlobalCsv || isZooDataLoading} 
            className="w-full sm:w-auto"
          >
            {isProcessingGlobalCsv ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : <UploadCloud size={18} className="mr-2"/>}
            {isProcessingGlobalCsv ? 'Processing...' : (selectedGlobalCsvFile ? `Process ${selectedGlobalCsvFile.name.substring(0,15)}...` : 'Upload & Replace')}
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Warning: Uploading a CSV here will replace all existing zoo data with the content from this file.
        </p>
      </div>
      
      {userZoos.length === 0 ? (
        <p className="text-lg text-muted-foreground mt-6">You have no zoos yet. Create one or upload a global CSV.</p>
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
