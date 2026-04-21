"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Calendar, BookOpen, Download, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { supabase, type Syllabus } from "@/lib/supabase";
import { toast } from "sonner";

export default function SyllabusPage() {
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSyllabi();
  }, []);

  const fetchSyllabi = async () => {
    try {
      setLoading(true);
      console.log("Fetching syllabi from Supabase...");
      
      const { data, error } = await supabase
        .from("syllabus")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("Supabase response:", { data, error });

      if (error) {
        console.error("Error fetching syllabi:", error);
        toast.error(`Failed to load syllabi: ${error.message}`);
        return;
      }

      console.log(`Found ${data?.length || 0} syllabi`);
      setSyllabi(data || []);
      
      if (data && data.length > 0) {
        toast.success(`Loaded ${data.length} syllabus/syllabi`);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("Failed to load syllabi");
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    window.open(fileUrl, "_blank");
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Syllabus Management</h1>
          <p className="text-muted-foreground">
            Manage your course syllabi and upload new ones
          </p>
        </div>
        <Button asChild>
          <Link href="/syllabus/upload">
            <Plus className="mr-2 h-4 w-4" />
            Upload Syllabus
          </Link>
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty State */}
      {!loading && syllabi.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <FileText className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No syllabi uploaded yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Get started by uploading your first course syllabus. The syllabus will be used to generate ideal answers for question papers.
            </p>
            <Button asChild>
              <Link href="/syllabus/upload">
                <Plus className="mr-2 h-4 w-4" />
                Upload Your First Syllabus
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Syllabi Grid */}
      {!loading && syllabi.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {syllabi.map((syllabus) => (
            <Card key={syllabus.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="rounded-full bg-primary/10 p-2">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="secondary">{syllabus.course_code}</Badge>
                </div>
                <CardTitle className="text-lg line-clamp-2">{syllabus.course_name}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  {syllabus.semester}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>File:</span>
                    <span className="truncate max-w-[150px]" title={syllabus.file_name}>
                      {syllabus.file_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Size:</span>
                    <span>{formatFileSize(syllabus.file_size)}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Uploaded:</span>
                    <span>{formatDate(syllabus.created_at)}</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleDownload(syllabus.file_url!, syllabus.file_name)}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View File
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
