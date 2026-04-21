"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QuestionPaperUploadForm } from "@/components/question-paper-upload-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { supabase, type Syllabus } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function QuestionPaperUploadPage() {
  const router = useRouter();
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSyllabi();
  }, []);

  const fetchSyllabi = async () => {
    try {
      const { data, error } = await supabase
        .from("syllabus")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSyllabi(data || []);
    } catch (error) {
      console.error("Error fetching syllabi:", error);
    } finally {
      setLoading(false);
    }
  };

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
            <BreadcrumbLink href="/questions">Question Papers</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Upload</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Upload Question Paper</h1>
          <p className="text-muted-foreground">
            Upload a question paper and let AI analyze it to generate ideal answers
          </p>
        </div>
        <a 
          href="/questions" 
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          View All Question Papers →
        </a>
      </div>

      {/* Upload Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Question Paper Details</CardTitle>
          <CardDescription>
            Select the course and upload the question paper (PDF format, max 10MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : syllabi.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No syllabi found. Please upload a syllabus first.
              </p>
              <a href="/syllabus/upload" className="text-primary hover:underline">
                Upload Syllabus →
              </a>
            </div>
          ) : (
            <QuestionPaperUploadForm syllabi={syllabi} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
