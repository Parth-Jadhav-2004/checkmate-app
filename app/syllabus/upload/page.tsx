"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SyllabusUploadForm } from "@/components/syllabus-upload-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export default function SyllabusUploadPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Breadcrumb Navigation */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/syllabus">Syllabus</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Upload</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Upload Syllabus</h1>
        <p className="text-muted-foreground">
          Upload your course syllabus to begin the evaluation process. The syllabus will be used as context for generating ideal answers.
        </p>
      </div>

      {/* Upload Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Syllabus Information</CardTitle>
          <CardDescription>
            Please provide the course details and upload the syllabus document (PDF or DOCX format, max 10MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SyllabusUploadForm />
        </CardContent>
      </Card>
    </div>
  );
}
