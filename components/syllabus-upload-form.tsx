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
import { FileUploadZone } from "@/components/file-upload-zone";
import { toast } from "sonner";
import { Loader2, Upload, CheckCircle2 } from "lucide-react";

// Form validation schema
const syllabusFormSchema = z.object({
  courseName: z.string().min(3, "Course name must be at least 3 characters"),
  courseCode: z.string().min(2, "Course code is required"),
  semester: z.string().min(1, "Semester is required"),
  file: z.instanceof(File, { message: "Please upload a syllabus file" })
    .refine((file) => file.size <= 10 * 1024 * 1024, "File size must be less than 10MB")
    .refine(
      (file) => ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type),
      "Only PDF and DOCX files are allowed"
    ),
});

type SyllabusFormValues = z.infer<typeof syllabusFormSchema>;

export function SyllabusUploadForm() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const form = useForm<SyllabusFormValues>({
    resolver: zodResolver(syllabusFormSchema),
    defaultValues: {
      courseName: "",
      courseCode: "",
      semester: "",
    },
  });

  const onSubmit = async (data: SyllabusFormValues) => {
    setIsUploading(true);
    setUploadSuccess(false);

    try {
      // Create FormData to send file
      const formData = new FormData();
      formData.append("file", data.file);
      formData.append("courseName", data.courseName);
      formData.append("courseCode", data.courseCode);
      formData.append("semester", data.semester);

      // Call API route to upload
      const response = await fetch("/api/syllabus/upload", {
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
      toast.success("Syllabus uploaded successfully!", {
        description: `${data.courseName} (${data.courseCode}) has been uploaded.`,
      });

      // Reset form
      form.reset();

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/syllabus");
      }, 2000);

    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed", {
        description: error instanceof Error ? error.message : "Please try again later.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Course Name */}
        <FormField
          control={form.control}
          name="courseName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course Name *</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Data Structures and Algorithms"
                  {...field}
                  disabled={isUploading}
                />
              </FormControl>
              <FormDescription>
                Enter the full name of the course
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Course Code */}
        <FormField
          control={form.control}
          name="courseCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course Code *</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., CS201"
                  {...field}
                  disabled={isUploading}
                />
              </FormControl>
              <FormDescription>
                Enter the official course code
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Semester */}
        <FormField
          control={form.control}
          name="semester"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Semester/Term *</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Fall 2025 or Semester 3"
                  {...field}
                  disabled={isUploading}
                />
              </FormControl>
              <FormDescription>
                Enter the semester or term
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
              <FormLabel>Syllabus Document *</FormLabel>
              <FormControl>
                <FileUploadZone
                  onFileSelect={(file: File | null) => {
                    onChange(file);
                  }}
                  acceptedFormats={[".pdf", ".docx"]}
                  maxSize={10}
                  disabled={isUploading}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Upload PDF or DOCX file (Maximum size: 10MB)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <div className="flex items-center gap-4">
          <Button
            type="submit"
            disabled={isUploading || uploadSuccess}
            className="min-w-[150px]"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : uploadSuccess ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Uploaded
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Syllabus
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
