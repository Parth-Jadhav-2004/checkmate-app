"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { FileText, Calendar, Award, Eye, Upload, AlertCircle, CheckCircle2, Clock, Loader2, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type QuestionPaper = {
  id: string;
  title: string;
  status: string;
  total_marks: number | null;
  exam_date: string | null;
  file_name: string;
  file_url: string | null;
  created_at: string;
  questionCount: number;
  syllabus: {
    id: string;
    course_name: string;
    course_code: string;
    semester: string;
  } | null;
};

export default function QuestionPapersPage() {
  const [questionPapers, setQuestionPapers] = useState<QuestionPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paperToDelete, setPaperToDelete] = useState<QuestionPaper | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchQuestionPapers = useCallback(async () => {
    setLoading(true);
    try {
      // Add cache-busting parameter to prevent caching
      const response = await fetch("/api/questions?t=" + Date.now(), {
        cache: "no-store",
      });
      const data = await response.json();
      
      console.log("Fetched question papers:", data);
      
      if (data.success) {
        // Fetch question counts for each paper
        const papersWithCounts = await Promise.all(
          (data.papers || []).map(async (paper: any) => {
            try {
              const countResponse = await fetch(`/api/questions/${paper.id}/count`);
              const countData = await countResponse.json();
              return { ...paper, questionCount: countData.count || 0 };
            } catch {
              return { ...paper, questionCount: 0 };
            }
          })
        );
        console.log("Question papers with counts:", papersWithCounts);
        setQuestionPapers(papersWithCounts);
      }
    } catch (error) {
      console.error("Error fetching question papers:", error);
      toast.error("Failed to load question papers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestionPapers();

    // Refresh when page becomes visible (handles tab switching)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("Page became visible, refreshing data...");
        fetchQuestionPapers();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchQuestionPapers]);

  const handleDeleteClick = (paper: QuestionPaper) => {
    setPaperToDelete(paper);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!paperToDelete) return;

    console.log("Deleting question paper:", paperToDelete.id, paperToDelete.title);
    setDeleting(true);
    try {
      const response = await fetch(`/api/questions/${paperToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      console.log("Delete response:", data);

      if (response.ok && data.success) {
        toast.success("Question paper deleted successfully");
        // Remove from local state immediately
        setQuestionPapers(prev => {
          const filtered = prev.filter(p => p.id !== paperToDelete.id);
          console.log("Remaining papers:", filtered.length);
          return filtered;
        });
      } else if (response.status === 404) {
        // Paper already deleted (maybe from another tab or previous deletion)
        console.warn("Paper was already deleted, removing from UI");
        toast.info("Question paper was already deleted");
        // Still remove from UI
        setQuestionPapers(prev => prev.filter(p => p.id !== paperToDelete.id));
      } else {
        throw new Error(data.message || "Failed to delete question paper");
      }
    } catch (error) {
      console.error("Error deleting question paper:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete question paper");
      // Refresh the list to sync with database
      await fetchQuestionPapers();
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setPaperToDelete(null);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Question Papers</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Question Papers {!loading && questionPapers.length > 0 && (
              <span className="text-xl text-muted-foreground">({questionPapers.length})</span>
            )}
          </h1>
          <p className="text-muted-foreground">
            Manage question papers and review AI-generated answers
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchQuestionPapers}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button asChild>
            <Link href="/questions/upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload New
            </Link>
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : questionPapers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No question papers uploaded yet</p>
            <p className="text-sm text-muted-foreground mb-6">
              Upload your first question paper to get started with AI-powered evaluation
            </p>
            <Button asChild>
              <Link href="/questions/upload">
                <Upload className="h-4 w-4 mr-2" />
                Upload Question Paper
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {questionPapers.map((paper: any) => {
            const syllabus = paper.syllabus;
            const statusConfig = {
              completed: {
                icon: CheckCircle2,
                variant: "default" as const,
                label: "Completed",
                color: "bg-green-600",
              },
              processing: {
                icon: Clock,
                variant: "secondary" as const,
                label: "Processing",
                color: "bg-yellow-600",
              },
              failed: {
                icon: AlertCircle,
                variant: "destructive" as const,
                label: "Failed",
                color: "bg-red-600",
              },
            };

            const status = statusConfig[paper.status as keyof typeof statusConfig] || statusConfig.completed;
            const StatusIcon = status.icon;

            return (
              <Card key={paper.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={status.variant} className={status.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                      {paper.questionCount > 0 && (
                        <Badge variant="outline">
                          {paper.questionCount} Questions
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(paper)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="line-clamp-2">{paper.title}</CardTitle>
                  <CardDescription>
                    {syllabus?.course_name} ({syllabus?.course_code})
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    {paper.exam_date && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(paper.exam_date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                    {paper.total_marks && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Award className="h-4 w-4" />
                        <span>{paper.total_marks} marks</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span className="truncate">{paper.file_name}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {paper.status === "completed" && (
                      <Button asChild className="flex-1">
                        <Link href={`/questions/${paper.id}/review`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Review Answers
                        </Link>
                      </Button>
                    )}
                    {paper.file_url && (
                      <Button asChild variant="outline" className={paper.status === "completed" ? "" : "flex-1"}>
                        <a href={paper.file_url} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4 mr-2" />
                          View PDF
                        </a>
                      </Button>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground pt-2 border-t space-y-1">
                    <div>Uploaded {new Date(paper.created_at).toLocaleDateString()}</div>
                    <div className="font-mono text-[10px] opacity-50 truncate" title={paper.id}>
                      ID: {paper.id.slice(0, 8)}...
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the question paper "{paperToDelete?.title}" and all its associated questions and ideal answers. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
