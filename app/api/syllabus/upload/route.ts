import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    console.log("=== Upload API Started ===");
    console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("Service Role Key exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    const formData = await request.formData();
    
    const file = formData.get("file") as File;
    const courseName = formData.get("courseName") as string;
    const courseCode = formData.get("courseCode") as string;
    const semester = formData.get("semester") as string;

    console.log("Received data:", { courseName, courseCode, semester, fileName: file?.name });

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file uploaded" },
        { status: 400 }
      );
    }

    if (!courseName || !courseCode || !semester) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Invalid file type. Only PDF and DOCX are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Convert file to buffer for Supabase upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop();
    const sanitizedCourseCode = courseCode.replace(/[^a-zA-Z0-9]/g, "_");
    const storagePath = `${sanitizedCourseCode}_${timestamp}.${fileExtension}`;

    console.log("Uploading to storage path:", storagePath);
    console.log("Bucket name: syllabus-files");

    // First, check if bucket exists
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    console.log("Available buckets:", buckets?.map(b => b.name));
    
    if (listError) {
      console.error("Error listing buckets:", listError);
    }

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("Syllabus-Files")
      .upload(storagePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase storage error:", uploadError);
      console.error("Error details:", JSON.stringify(uploadError, null, 2));
      return NextResponse.json(
        { 
          success: false, 
          message: "Failed to upload file to storage", 
          error: uploadError.message,
          buckets: buckets?.map(b => b.name) || []
        },
        { status: 500 }
      );
    }

    console.log("File uploaded successfully:", uploadData);

    // Get public URL for the uploaded file
    const { data: urlData } = supabaseAdmin.storage
      .from("Syllabus-Files")
      .getPublicUrl(storagePath);

    // Save metadata to database
    const { data: dbData, error: dbError } = await supabaseAdmin
      .from("syllabus")
      .insert({
        course_name: courseName,
        course_code: courseCode,
        semester: semester,
        file_name: file.name,
        file_path: storagePath,
        file_url: urlData.publicUrl,
        file_size: file.size,
        file_type: file.type,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      
      // Try to clean up uploaded file if database insert fails
      await supabaseAdmin.storage
        .from("Syllabus-Files")
        .remove([storagePath]);

      return NextResponse.json(
        { success: false, message: "Failed to save to database", error: dbError.message },
        { status: 500 }
      );
    }

    console.log("Syllabus uploaded successfully:", dbData);

    return NextResponse.json(
      {
        success: true,
        message: "Syllabus uploaded successfully",
        data: dbData,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to upload file",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
