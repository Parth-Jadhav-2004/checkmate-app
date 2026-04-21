"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUploadZone } from "@/components/file-upload-zone";
import { toast } from "sonner";
import { Loader2, Upload, CheckCircle2, Sparkles } from "lucide-react";
import type { Syllabus } from "@/lib/supabase";

// Form validation schema
const questionPaperFormSchema = z.object({
  syllabusId: z.string().min(1, "Please select a course"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  examDate: z.string().optional(),
  totalMarks: z.string().optional(),
  file: z.instanceof(File, { message: "Please upload a question paper file" })
    .refine((file) => file.size <= 10 * 1024 * 1024, "File size must be less than 10MB")
    .refine(
      (file) => file.type === "application/pdf",
      "Only PDF files are allowed"
    ),
});

type QuestionPaperFormValues = z.infer<typeof questionPaperFormSchema>;

interface QuestionPaperUploadFormProps {
  syllabi: Syllabus[];
}

export function QuestionPaperUploadForm({ syllabi }: QuestionPaperUploadFormProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");

  const form = useForm<QuestionPaperFormValues>({
    resolver: zodResolver(questionPaperFormSchema),
    defaultValues: {
      syllabusId: "",
      title: "",
      examDate: "",
      totalMarks: "",
    },
  });

  const onSubmit = async (data: QuestionPaperFormValues) => {
    setIsUploading(true);
    setUploadSuccess(false);
    setProcessingStatus("Uploading question paper...");

    try {
      // Create FormData to send file
      const formData = new FormData();
      formData.append("file", data.file);
      formData.append("syllabusId", data.syllabusId);
      formData.append("title", data.title);
      if (data.examDate) formData.append("examDate", data.examDate);
      if (data.totalMarks) formData.append("totalMarks", data.totalMarks);

      // Call API route to upload
      setProcessingStatus("Analyzing with AI...");
      const response = await fetch("/api/questions/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      const result = await response.json();

      // Success
      setUploadSuccess(true);
      setProcessingStatus("Processing complete!");
      toast.success("Question paper processed successfully!", {
        description: `Generated ${result.data.questionsCount} questions with ideal answers.`,
        icon: <Sparkles className="h-4 w-4" />,
      });

      // Reset form
      form.reset();

      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/questions/${result.data.questionPaperId}/review`);
      }, 2000);

    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed", {
        description: error instanceof Error ? error.message : "Please try again later.",
      });
      setProcessingStatus("");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Syllabus Selection */}
        <FormField
          control={form.control}
          name="syllabusId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Course *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isUploading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course syllabus" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {syllabi.map((syllabus) => (
                    <SelectItem key={syllabus.id} value={syllabus.id}>
                      {syllabus.course_name} ({syllabus.course_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Select the course this question paper belongs to
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Exam Title *</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Mid-Term Exam 2025 or Final Exam"
                  {...field}
                  disabled={isUploading}
                />
              </FormControl>
              <FormDescription>
                Enter a descriptive title for this exam
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Exam Date */}
        <FormField
          control={form.control}
          name="examDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Exam Date (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  disabled={isUploading}
                />
              </FormControl>
              <FormDescription>
                When is/was this exam conducted?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Total Marks */}
        <FormField
          control={form.control}
          name="totalMarks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Total Marks (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="e.g., 100"
                  {...field}
                  disabled={isUploading}
                />
              </FormControl>
              <FormDescription>
                Total marks for this exam
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* File Upload */}
        <FormField
          control={form.control}
          name="file"
          render={({ field: { onChange, value, ...field } }) => (
            <FormItem>
              <FormLabel>Question Paper *</FormLabel>
              <FormControl>
                <FileUploadZone
                  onFileSelect={(file: File | null) => {
                    onChange(file);
                  }}
                  acceptedFormats={[".pdf"]}
                  maxSize={10}
                  disabled={isUploading}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Upload PDF file (Maximum size: 10MB)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Processing Status */}
        {processingStatus && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              <div>
                <p className="font-medium text-sm">{processingStatus}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  AI is analyzing the question paper and generating ideal answers...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center gap-4">
          <Button
            type="submit"
            disabled={isUploading || uploadSuccess}
            className="min-w-[200px]"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : uploadSuccess ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Uploaded
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Upload & Process with AI
              </>
            )}
          </Button>

          {!isUploading && !uploadSuccess && (
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
            >
              Clear Form
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
