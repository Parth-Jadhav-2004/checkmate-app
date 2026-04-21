"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, type File, X, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  title: string
  description: string
  acceptedFileTypes: string[]
  onFileUpload: (file: File) => void
  uploadedFile?: File | null
  isProcessing?: boolean
  icon?: React.ComponentType<{ className?: string }>
}

export function FileUpload({
  title,
  description,
  acceptedFileTypes,
  onFileUpload,
  uploadedFile,
  isProcessing = false,
  icon: Icon = Upload,
}: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileUpload(acceptedFiles[0])
      }
    },
    [onFileUpload],
  )

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce(
      (acc, type) => {
        acc[type] = []
        return acc
      },
      {} as Record<string, string[]>,
    ),
    multiple: false,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false),
  })

  const removeFile = () => {
    onFileUpload(null as any)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 flex-shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="text-center sm:text-left">
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {uploadedFile ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-success/10 border border-success/20 rounded-lg space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-success truncate">{uploadedFile.name}</p>
                <p className="text-sm text-muted-foreground">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="text-muted-foreground hover:text-destructive self-end sm:self-center"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 md:p-8 text-center cursor-pointer transition-all duration-300",
              isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50",
              isProcessing && "opacity-50 cursor-not-allowed",
            )}
          >
            <input {...getInputProps()} disabled={isProcessing} />
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-muted">
                <Upload className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-base md:text-lg font-medium">
                  {isDragActive ? "Drop your file here" : "Drag & drop your file here"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">or click to browse files</p>
              </div>
              <Button variant="outline" disabled={isProcessing} className="w-full sm:w-auto bg-transparent">
                {isProcessing ? "Processing..." : "Choose File"}
              </Button>
              <p className="text-xs text-muted-foreground">Supported formats: {acceptedFileTypes.join(", ")}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
