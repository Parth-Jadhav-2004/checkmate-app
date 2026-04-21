"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface AnswerSheetUploadProps {
  studentId: string;
}

interface QuestionPaper {
  id: string;
  title: string;
  syllabus_id: string;
  syllabus?: {
    course_name: string;
    course_code: string;
  };
}

export function AnswerSheetUpload({ studentId }: AnswerSheetUploadProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [questionPaperId, setQuestionPaperId] = useState("");
  const [questionPapers, setQuestionPapers] = useState<QuestionPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPapers, setLoadingPapers] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch question papers on mount
  useEffect(() => {
    async function fetchQuestionPapers() {
      try {
        setLoadingPapers(true);
        const response = await fetch("/api/questions");
        
        console.log("Response status:", response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("API Error:", errorData);
          throw new Error("Failed to fetch question papers");
        }
        
        const data = await response.json();
        console.log("Fetched question papers:", data);
        console.log("Number of papers:", data.papers?.length || 0);
        
        setQuestionPapers(data.papers || []);
      } catch (err) {
        console.error("Error fetching question papers:", err);
        setError("Failed to load question papers");
      } finally {
        setLoadingPapers(false);
      }
    }

    fetchQuestionPapers();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setSuccess("");
    
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Please upload a PDF or image file (JPG, PNG)");
      setFile(null);
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
      setError("File size must be less than 10MB");
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError("Please select a file");
      return;
    }

    if (!questionPaperId) {
      setError("Please select a question paper");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("studentId", studentId);
      formData.append("questionPaperId", questionPaperId);

      // Upload answer sheet
      const response = await fetch("/api/answer-sheets/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload answer sheet");
      }

      setSuccess("Answer sheet uploaded successfully!");
      setFile(null);
      setQuestionPaperId("");
      
      // Reset file input
      const fileInput = document.getElementById("answer-sheet-file") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      // Refresh the page after 2 seconds
      setTimeout(() => {
        router.refresh();
      }, 2000);

    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload answer sheet");
    } finally {
      setLoading(false);
    }
  };

  const selectedPaper = questionPapers.find(p => p.id === questionPaperId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Question Paper Selection */}
      <div className="space-y-2">
        <Label htmlFor="question-paper">Question Paper *</Label>
        {loadingPapers ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading question papers...
          </div>
        ) : (
          <Select value={questionPaperId} onValueChange={setQuestionPaperId}>
            <SelectTrigger id="question-paper">
              <SelectValue placeholder="Select a question paper" />
            </SelectTrigger>
            <SelectContent>
              {questionPapers.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  No question papers available
                </div>
              ) : (
                questionPapers.map((paper) => (
                  <SelectItem key={paper.id} value={paper.id}>
                    {paper.title} 
                    {paper.syllabus && (
                      <span className="text-muted-foreground ml-2">
                        ({paper.syllabus.course_code})
                      </span>
                    )}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        )}
        {selectedPaper && (
          <p className="text-sm text-muted-foreground">
            Course: {selectedPaper.syllabus?.course_name || "N/A"}
          </p>
        )}
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <Label htmlFor="answer-sheet-file">Answer Sheet File *</Label>
        <div className="flex items-center gap-4">
          <Input
            id="answer-sheet-file"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            disabled={loading}
            className="cursor-pointer"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Accepted formats: PDF, JPG, PNG (Max 10MB)
        </p>
      </div>

      {/* File Preview */}
      {file && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert className="border-green-500 bg-green-50 text-green-900">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <div className="flex items-center gap-4">
        <Button
          type="submit"
          disabled={loading || !file || !questionPaperId}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Answer Sheet
            </>
          )}
        </Button>
      </div>

      {/* Information */}
      <div className="bg-muted p-4 rounded-lg">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Important Information
        </h4>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>The answer sheet will be linked to the selected question paper and its syllabus</li>
          <li>Make sure the file is clear and readable for accurate evaluation</li>
          <li>The evaluation button will be available after upload</li>
          <li>You can upload only one answer sheet per student per question paper</li>
        </ul>
      </div>
    </form>
  );
}
