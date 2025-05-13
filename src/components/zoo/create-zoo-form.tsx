// src/components/zoo/create-zoo-form.tsx
"use client";
import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CsvUpload from '@/components/csv/csv-upload';
import { useZooData } from '@/contexts/zoo-data-context';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Building2, UploadCloud, Loader2 } from 'lucide-react';

const createZooSchema = z.object({
  zooName: z.string().min(3, { message: "Zoo name must be at least 3 characters" }),
  zooCity: z.string().min(2, { message: "City name must be at least 2 characters" }),
});

type CreateZooFormInputs = z.infer<typeof createZooSchema>;

export default function CreateZooForm() {
  const { createZoo, isLoading: isZooDataLoading } = useZooData();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<CreateZooFormInputs>({
    resolver: zodResolver(createZooSchema),
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
    // Clear the input value if no file is selected or if the selection is cancelled
    if (!event.target.files || event.target.files.length === 0) {
         event.target.value = ''; // This helps in re-selecting the same file if needed
    }
  };

  const onSubmit: SubmitHandler<CreateZooFormInputs> = async (data) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    let csvString: string | null = null;

    if (selectedFile) {
      try {
        csvString = await selectedFile.text();
      } catch (error) {
        toast({ title: "File Read Error", description: "Could not read the selected CSV file.", variant: "destructive" });
        setIsProcessing(false);
        return;
      }
    }

    const result = await createZoo(
      { name: data.zooName, city: data.zooCity },
      csvString,
      user
    );

    setIsProcessing(false);

    if (result.success && result.newZooId) {
      toast({ title: "Zoo Created", description: `${data.zooName} has been successfully created.` });
      router.push(`/zoos/${result.newZooId}/sites`); // Navigate to the new zoo's sites page
    } else {
      toast({ title: "Creation Failed", description: result.error || "An unknown error occurred.", variant: "destructive" });
    }
  };
  
  const overallLoading = isZooDataLoading || isProcessing;

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <Building2 className="mr-3 h-6 w-6 text-primary" />
          New Zoo Details
        </CardTitle>
        <CardDescription>
          Fill in the information for the new zoo. Optionally, upload a CSV to pre-populate data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="zooName">Zoo Name</Label>
            <Input
              id="zooName"
              placeholder="e.g., Grand City Safari Park"
              {...register("zooName")}
              className={errors.zooName ? "border-destructive" : ""}
              disabled={overallLoading}
            />
            {errors.zooName && <p className="text-sm text-destructive">{errors.zooName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="zooCity">City</Label>
            <Input
              id="zooCity"
              placeholder="e.g., Metropolis"
              {...register("zooCity")}
              className={errors.zooCity ? "border-destructive" : ""}
              disabled={overallLoading}
            />
            {errors.zooCity && <p className="text-sm text-destructive">{errors.zooCity.message}</p>}
          </div>

          <div className="space-y-2">
            <CsvUpload
              selectedFile={selectedFile}
              onFileChange={handleFileChange}
              instanceId="newZooCsvUpload"
              disabled={overallLoading}
              label="Populate with CSV (Optional)"
            />
             <p className="text-xs text-muted-foreground">
              If provided, data from this CSV will populate the new zoo. 'Organization Name' in the CSV will be ignored; all data will belong to this new zoo.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={overallLoading}>
            {overallLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UploadCloud className="mr-2 h-4 w-4" /> 
            )}
            {overallLoading ? 'Creating Zoo...' : 'Create Zoo'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
