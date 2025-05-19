
// src/app/zoos/[zooId]/sites/page.tsx
"use client";
import type { Site, Zoo, User } from '@/lib/types'; // Added User
import SiteCard from '@/components/zoo/site-card';
import { use, useEffect, useState, useCallback, type ChangeEvent } from 'react';
import { useBreadcrumbs, type BreadcrumbItem } from '@/contexts/breadcrumb-context';
import { useZooData } from '@/contexts/zoo-data-context'; 
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle, Download, UploadCloud, Loader2, ListChecks } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import CsvUpload from '@/components/csv/csv-upload';
import { useAuth } from '@/hooks/use-auth';


interface ZooSitesPageProps {
  params: Promise<{ zooId: string }>;
}

// Helper function to convert full zoo data to CSV format
const convertZooDataToCSV = (zoo: Zoo, currentUser: User | null): { csv: string; hasData: boolean } => { // Added currentUser
  const headers = [
    'Zoo ID', 'Zoo Name', 'Zoo City',
    'Site ID', 'Site Name', 'Site Location',
    'Section ID', 'Section Name', 
    'Enclosure ID', 'Enclosure Name', 'Enclosure Type',
    'Animal ID', 'Animal Name', 'Animal Species', 'Common Name', 'Gender', 
    'Verified', 'Verified At', 'Who Verified',
    'MicroChip', 'RingNumber', 'IdentifierType', 'IdentifierValue',
    'BreedName', 'MorphName', 'Weight', 'Age',
    'AccessionDate', 'AccessionType', 'BirthDate', 'AddedOnAntz', 'CSV Row',
    'Night Cell Presence', 'Air Conditioning', 'Camera' // Added new boolean features
  ];

  const rows: (string | number | boolean | undefined | null)[][] = [];

  zoo.sites.forEach(site => {
    site.sections.forEach(section => { 
      section.enclosures.forEach(enclosure => {
        enclosure.animals.forEach(animal => {
          rows.push([
            zoo.id, zoo.name, zoo.city,
            site.id, site.name, site.location,
            section.id, section.name, 
            enclosure.id, enclosure.name, enclosure.type,
            animal.id, animal.name, animal.species, animal.commonName, animal.gender,
            animal.verified ? 'Yes' : 'No',
            animal.verified && animal.verifiedAt ? new Date(animal.verifiedAt).toLocaleString() : '',
            animal.verified && currentUser ? currentUser.email : '', // Populate 'Who Verified'
            animal.microChip, animal.ringNumber, animal.identifierType, animal.identifierValue,
            animal.breedName, animal.morphName, animal.weight, animal.age,
            animal.accessionDate, animal.accessionType, animal.birthDate, animal.addedOnAntz, animal.csvRowNumber,
            animal.nightCellPresence ? 'Yes' : 'No', // Added new boolean features
            animal.airConditioning ? 'Yes' : 'No',
            animal.camera ? 'Yes' : 'No'
          ]);
        });
      });
    });
  });

  const escapeField = (field: string | number | boolean | undefined | null) => {
    if (field === null || field === undefined) return '';
    const stringField = String(field);
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  };

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(escapeField).join(','))
  ].join('\n');

  return { csv: csvContent, hasData: rows.length > 0 };
};


export default function ZooSitesPage({ params: paramsPromise }: ZooSitesPageProps) {
  const params = use(paramsPromise);
  const { zooId } = params;

  const { getZooById: getZooByIdFromContext, isLoading: isZooDataLoading, replaceSpecificZooDataFromCsv } = useZooData(); 
  const [zoo, setZoo] = useState<Zoo | null | undefined>(null); 
  const { setBreadcrumbs } = useBreadcrumbs();
  const { toast } = useToast();
  const { user } = useAuth(); // Get current user

  const [selectedZooCsvFile, setSelectedZooCsvFile] = useState<File | null>(null);
  const [isProcessingZooCsv, setIsProcessingZooCsv] = useState(false);


  useEffect(() => {
    const currentZoo = getZooByIdFromContext(zooId);
    setZoo(currentZoo);

    if (currentZoo) {
      const breadcrumbsData: BreadcrumbItem[] = [
        { label: currentZoo.name, href: `/zoos/${zooId}/sites` },
      ];
      setBreadcrumbs(breadcrumbsData);
    } else if (!isZooDataLoading) { 
      setZoo(undefined); 
      setBreadcrumbs([{ label: "Zoo Not Found", href: `/dashboard` }]);
    }
  }, [zooId, getZooByIdFromContext, setBreadcrumbs, isZooDataLoading]);

  const handleExportZooCSV = useCallback(() => {
    if (!zoo) {
      setTimeout(() => {
        toast({ title: "Error", description: "Zoo data not loaded yet or not found.", variant: "destructive" });
      },0);
      return;
    }

    const { csv: csvData, hasData } = convertZooDataToCSV(zoo, user); // Pass user

    if (!hasData) {
      setTimeout(() => {
      toast({ title: "No Data", description: `No animal data found in ${zoo.name} to export.`, variant: "default", className: "bg-secondary text-secondary-foreground" });
      },0);
      // Do not return here if you want to download an empty CSV with headers
    }
    
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const timestamp = `${year}${month}${day}_${hours}${minutes}${seconds}`;
      
      const fileName = `${zoo.name.replace(/\s+/g, '_')}_${zoo.city.replace(/\s+/g, '_')}_data_export_${timestamp}.csv`;

      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      if (hasData) {
        setTimeout(() => {
        toast({ title: "Export Successful", description: `All data for ${zoo.name} has been downloaded as ${fileName}.` });
        },0);
      } else {
         setTimeout(() => {
        toast({ title: "Export Note", description: `An empty CSV template for ${zoo.name} has been downloaded as ${fileName}.` });
        },0);
      }
    } catch (error) {
      console.error("Failed to export Zoo CSV:", error);
      setTimeout(() => {
      toast({ title: "Export Failed", description: "Could not generate CSV file. Please try again.", variant: "destructive" });
      },0);
    }
  }, [zoo, toast, user]); // Add user to dependencies

  const handleZooFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedZooCsvFile(event.target.files[0]);
    } else {
      setSelectedZooCsvFile(null);
    }
     if (!event.target.files || event.target.files.length === 0) {
         event.target.value = ''; 
    }
  };

  const handleZooCsvUpload = async () => {
    if (!selectedZooCsvFile) {
      toast({ title: "Upload Error", description: "Please select a CSV file.", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to upload data.", variant: "destructive" });
      return;
    }
    if (!zoo) {
      toast({ title: "Zoo Error", description: "Zoo data not available for replacement.", variant: "destructive" });
      return;
    }

    setIsProcessingZooCsv(true);
    
    try {
      const csvString = await selectedZooCsvFile.text();
      const { success, error } = await replaceSpecificZooDataFromCsv(zoo.id, csvString, user);

      if (success) {
        toast({ title: "Zoo Data Replaced", description: `Data for ${zoo.name} has been replaced by the CSV content.` });
        setSelectedZooCsvFile(null); 
        const fileInput = document.getElementById('specificZooCsvUpload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        toast({ title: "CSV Processing Failed", description: error || "An unknown error occurred.", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "File Read Error", description: "Could not read the selected file.", variant: "destructive" });
    } finally {
      setIsProcessingZooCsv(false);
    }
  };

  if (isZooDataLoading || zoo === null || isProcessingZooCsv) { 
    return (
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <Skeleton className="h-10 w-36" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" /> {/* Report Button Skeleton */}
            <Skeleton className="h-10 w-48" /> {/* Export Button Skeleton */}
          </div>
        </div>
        <Skeleton className="h-10 w-1/2 mb-2" />
        <Skeleton className="h-8 w-1/3 mb-8" />
         {/* Specific Zoo CSV Upload Section Skeleton */}
        <div className="p-4 border rounded-lg shadow-sm bg-card my-6">
          <Skeleton className="h-6 w-1/2 mb-3" />
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <Skeleton className="h-10 flex-grow w-full sm:w-auto" />
            <Skeleton className="h-10 w-full sm:w-40" />
          </div>
          <Skeleton className="h-4 w-3/4 mt-3" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 xl:gap-8">
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

  if (zoo === undefined) { 
    return (
      <div className="flex flex-col items-center justify-center text-center py-10">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold mb-2">Zoo Not Found</h1>
        <p className="text-muted-foreground mb-6">The zoo you are looking for does not exist or you do not have permission to view it.</p>
        <Button asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/zoos/${zoo.id}/report`}>
              <ListChecks className="mr-2 h-4 w-4" /> View Audit Report
            </Link>
          </Button>
          <Button variant="outline" onClick={handleExportZooCSV}>
            <Download className="mr-2 h-4 w-4" /> Export All Zoo Data (CSV)
          </Button>
        </div>
      </div>
      <h1 className="text-4xl font-bold mb-2 tracking-tight text-gray-800">{zoo.name}</h1>
      <p className="text-xl text-muted-foreground mb-8">Sites within this Zoo</p>

      {/* Specific Zoo CSV Upload Section */}
      <div className="p-4 border rounded-lg shadow-sm bg-card my-8">
        <h3 className="text-lg font-semibold mb-3 text-card-foreground flex items-center">
          <UploadCloud className="mr-2 h-5 w-5 text-primary" />
          Replace Data for {zoo.name} via CSV
        </h3>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex-grow w-full sm:w-auto">
            <CsvUpload
              selectedFile={selectedZooCsvFile}
              onFileChange={handleZooFileChange}
              instanceId="specificZooCsvUpload"
              disabled={isProcessingZooCsv || isZooDataLoading}
              label={`Select CSV to replace data for ${zoo.name}`}
            />
          </div>
          <Button 
            onClick={handleZooCsvUpload} 
            disabled={!selectedZooCsvFile || isProcessingZooCsv || isZooDataLoading} 
            className="w-full sm:w-auto"
          >
            {isProcessingZooCsv ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : <UploadCloud size={18} className="mr-2"/>}
            {isProcessingZooCsv ? 'Processing...' : (selectedZooCsvFile ? `Process ${selectedZooCsvFile.name.substring(0,15)}...` : 'Upload & Replace')}
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Warning: Uploading a CSV here will replace all existing sites, sections, enclosures, and animals for <strong>{zoo.name}</strong> with the content from this file. The zoo's name and city will remain unchanged.
        </p>
      </div>
      
      {zoo.sites.length === 0 ? (
        <p className="text-lg text-muted-foreground">This zoo has no sites configured yet. You can add them by uploading a CSV above.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 xl:gap-8"> {/* Changed lg:grid-cols-3 to lg:grid-cols-2 */}
          {zoo.sites.map(site => (
            <SiteCard key={site.id} site={site} zooId={zoo.id} />
          ))}
        </div>
      )}
    </div>
  );
}

