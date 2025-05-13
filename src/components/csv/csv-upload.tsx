// src/components/csv/csv-upload.tsx
"use client";
import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useZooData } from '@/contexts/zoo-data-context';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, FileText } from 'lucide-react';

export default function CsvUpload() {
  const { loadZoosFromCsv, isLoading: isZooDataLoading } = useZooData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false); // Local processing state

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({ title: "Upload Error", description: "Please select a CSV file.", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to upload data.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      const csvString = e.target?.result as string;
      if (csvString) {
        const { success, error } = await loadZoosFromCsv(csvString, user);
        if (success) {
          toast({ title: "CSV Processed", description: "Zoo data has been updated from the CSV file." });
          setSelectedFile(null); 
          // Clear the file input visually - this is tricky with controlled file inputs
          // A common way is to reset the form or use a key on the input to force re-render
          const fileInput = document.getElementById('csvFile') as HTMLInputElement;
          if (fileInput) fileInput.value = '';

        } else {
          toast({ title: "CSV Processing Failed", description: error || "An unknown error occurred.", variant: "destructive" });
        }
      } else {
        toast({ title: "File Read Error", description: "Could not read the selected file.", variant: "destructive" });
      }
      setIsProcessing(false);
    };

    reader.onerror = () => {
      toast({ title: "File Read Error", description: "Error reading file.", variant: "destructive" });
      setIsProcessing(false);
    };

    reader.readAsText(selectedFile);
  };

  const overallLoading = isZooDataLoading || isProcessing;

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-card my-6">
      <h3 className="text-lg font-semibold mb-3 text-card-foreground flex items-center">
        <UploadCloud className="mr-2 h-5 w-5 text-primary" />
        Upload Zoo Data via CSV
      </h3>
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex-grow w-full sm:w-auto">
          <Input
            id="csvFile"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={overallLoading}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
          />
          {selectedFile && !overallLoading && <p className="mt-2 text-xs text-muted-foreground flex items-center"><FileText size={14} className="mr-1"/>Selected: {selectedFile.name}</p>}
        </div>
        <Button onClick={handleUpload} disabled={!selectedFile || overallLoading} className="w-full sm:w-auto">
          {overallLoading ? (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : <UploadCloud size={18} className="mr-2"/>}
          {overallLoading ? 'Processing...' : (selectedFile ? `Process ${selectedFile.name.substring(0,15)}...` : 'Upload & Process')}
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Upload a CSV file to populate or update zoo, site, enclosure, and animal data. Existing data will be replaced by the CSV content.
      </p>
    </div>
  );
}
