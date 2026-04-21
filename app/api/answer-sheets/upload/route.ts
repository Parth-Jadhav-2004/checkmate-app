import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const studentId = formData.get("studentId") as string;
    const questionPaperId = formData.get("questionPaperId") as string;

    // Validate inputs
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    if (!questionPaperId) {
      return NextResponse.json(
        { error: "Question Paper ID is required" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF and images are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Fetch question paper to get syllabus_id
    const { data: questionPaper, error: questionPaperError } = await supabase
      .from("question_papers")
      .select("id, syllabus_id, title, total_marks")
      .eq("id", questionPaperId)
      .single();

    if (questionPaperError || !questionPaper) {
      return NextResponse.json(
        { error: "Question paper not found" },
        { status: 404 }
      );
    }

    // Check if answer sheet already exists for this student and question paper
    const { data: existingSheet } = await supabase
      .from("answer_sheets")
      .select("id")
      .eq("student_id", studentId)
      .eq("question_paper_id", questionPaperId)
      .single();

    if (existingSheet) {
      return NextResponse.json(
        { error: "Answer sheet already exists for this student and question paper" },
        { status: 409 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split(".").pop();
    const sanitizedFileName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .replace(/\s+/g, "_");
    const fileName = `${studentId}_${questionPaperId}_${timestamp}.${fileExt}`;
    const filePath = `answer-sheets/${fileName}`;

    // Upload file to Supabase Storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from("answer-sheets")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (storageError) {
      console.error("Storage error:", storageError);
      return NextResponse.json(
        { error: "Failed to upload file to storage: " + storageError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("answer-sheets")
      .getPublicUrl(filePath);

    // Insert answer sheet record into database
    const { data: answerSheet, error: dbError } = await supabase
      .from("answer_sheets")
      .insert({
        student_id: studentId,
        question_paper_id: questionPaperId,
        syllabus_id: questionPaper.syllabus_id,
        file_name: sanitizedFileName,
        file_path: filePath,
        file_url: urlData.publicUrl,
        file_size: file.size,
        file_type: file.type,
        total_marks: questionPaper.total_marks,
        evaluation_status: "pending",
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      
      // Try to delete the uploaded file if database insert fails
      await supabase.storage.from("answer-sheets").remove([filePath]);

      return NextResponse.json(
        { error: "Failed to save answer sheet record: " + dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Answer sheet uploaded successfully",
        answerSheet: {
          id: answerSheet.id,
          fileName: answerSheet.file_name,
          fileUrl: answerSheet.file_url,
          fileSize: answerSheet.file_size,
          evaluationStatus: answerSheet.evaluation_status,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch answer sheets for a student
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    // Fetch answer sheets with related data
    const { data: answerSheets, error } = await supabase
      .from("answer_sheets")
      .select(`
        id,
        file_name,
        file_url,
        file_size,
        file_type,
        total_marks,
        obtained_marks,
        evaluation_status,
        submitted_at,
        evaluated_at,
        question_papers (
          id,
          title,
          syllabus (
            id,
            course_name,
            course_code
          )
        )
      `)
      .eq("student_id", studentId)
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("Fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch answer sheets" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { answerSheets: answerSheets || [] },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
