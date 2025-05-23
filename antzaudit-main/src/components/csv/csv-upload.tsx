// src/components/csv/csv-upload.tsx
"use client";
import type { ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { FileText } from 'lucide-react';

interface CsvUploadProps {
  selectedFile: File | null;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  instanceId: string; // Unique ID for the input element
  disabled?: boolean;
  label?: string; // Optional label for the input
}

export default function CsvUpload({
  selectedFile,
  onFileChange,
  instanceId,
  disabled = false,
  label = "Select CSV File"
}: CsvUploadProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={instanceId} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <Input
        id={instanceId}
        type="file"
        accept=".csv"
        onChange={onFileChange}
        disabled={disabled}
        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
      />
      {selectedFile && !disabled && (
        <p className="mt-1 text-xs text-muted-foreground flex items-center">
          <FileText size={14} className="mr-1" />
          Selected: {selectedFile.name}
        </p>
      )}
    </div>
  );
}
