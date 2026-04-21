"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Upload, File, X, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadZoneProps {
  onFileSelect: (file: File | null) => void;
  acceptedFormats?: string[];
  maxSize?: number; // in MB
  disabled?: boolean;
}

export function FileUploadZone({
  onFileSelect,
  acceptedFormats = [".pdf", ".docx"],
  maxSize = 10,
  disabled = false,
}: FileUploadZoneProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null);

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === "file-too-large") {
          setError(`File is too large. Maximum size is ${maxSize}MB`);
        } else if (rejection.errors[0]?.code === "file-invalid-type") {
          setError(`Invalid file type. Please upload ${acceptedFormats.join(" or ")} files`);
        } else {
          setError("File upload failed. Please try again.");
        }
        return;
      }

      // Handle accepted files
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [maxSize, acceptedFormats, onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxSize: maxSize * 1024 * 1024, // Convert MB to bytes
    multiple: false,
    disabled,
  });

  const removeFile = () => {
    setSelectedFile(null);
    onFileSelect(null);
    setError(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50",
            disabled && "opacity-50 cursor-not-allowed pointer-events-none",
            error && "border-destructive"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-full bg-primary/10 p-3">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {isDragActive ? (
                  "Drop the file here..."
                ) : (
                  <>
                    <span className="text-primary">Click to upload</span> or drag and drop
                  </>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {acceptedFormats.join(", ").toUpperCase()} (max {maxSize}MB)
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-2 border-primary rounded-lg p-4 bg-primary/5">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={removeFile}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-xs text-green-600 font-medium">File ready to upload</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive mt-2 flex items-center gap-1">
          <X className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  );
}
