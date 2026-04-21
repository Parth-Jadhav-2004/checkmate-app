import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { processQuestionPaper } from "@/lib/gemini";
import * as path from "path";

export async function POST(request: NextRequest) {
  console.log("📝 Question paper upload API called");

  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const syllabusId = formData.get("syllabusId") as string;
    const title = formData.get("title") as string;
    const examDate = formData.get("examDate") as string | null;
    const totalMarks = formData.get("totalMarks") as string | null;

    // Validation
    if (!file || !syllabusId || !title) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { success: false, message: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    console.log("✅ Validation passed");
    console.log("📄 File:", file.name, "Size:", file.size, "bytes");

    // Get Supabase admin client
    const supabase = getSupabaseAdmin();

    // Create a unique file name
    const fileExt = path.extname(file.name);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
    const filePath = `question-papers/${fileName}`;

    console.log("📤 Uploading to Supabase Storage:", filePath);

    // Convert File to ArrayBuffer then Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage (create bucket if doesn't exist)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("Question-Papers")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ Upload error:", uploadError);
      return NextResponse.json(
        { success: false, message: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    console.log("✅ File uploaded to storage");

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("Question-Papers")
      .getPublicUrl(filePath);

    console.log("🔗 Public URL:", urlData.publicUrl);

    // Insert question paper record into database
    const { data: questionPaper, error: dbError } = await supabase
      .from("question_papers")
      .insert({
        syllabus_id: syllabusId,
        title,
        exam_date: examDate || null,
        total_marks: totalMarks ? parseInt(totalMarks) : null,
        file_name: file.name,
        file_path: filePath,
        file_url: urlData.publicUrl,
        file_size: file.size,
        file_type: file.type,
        status: "processing", // Start with processing status
      })
      .select()
      .single();

    if (dbError) {
      console.error("❌ Database error:", dbError);
      // Clean up uploaded file
      await supabase.storage.from("Question-Papers").remove([filePath]);
      return NextResponse.json(
        { success: false, message: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }

    console.log("✅ Question paper record created:", questionPaper.id);

    // Process with Gemini AI
    console.log("🤖 Starting AI processing...");

    try {
      // Parse PDF to extract text
      const pdfParse = require("pdf-parse");
      console.log("📄 Parsing PDF, buffer size:", buffer.length, "bytes");
      
      // Parse with options
      const pdfData = await pdfParse(buffer, {
        max: 0, // parse all pages
      });
      
      const questionPaperText = pdfData.text;

      console.log("✅ PDF parsed successfully");
      console.log("📊 PDF Info:", {
        pages: pdfData.numpages,
        textLength: questionPaperText.length,
        preview: questionPaperText.substring(0, 100) + "...",
      });

      if (!questionPaperText || questionPaperText.trim().length < 20) {
        console.error("❌ PDF text too short or empty");
        console.error("Full text:", questionPaperText);
        throw new Error(
          "Could not extract sufficient text from PDF. The file might be:\n" +
          "1. Image-based/scanned (needs OCR)\n" +
          "2. Protected/encrypted\n" +
          "3. Corrupted\n\n" +
          "Please ensure the PDF contains selectable text."
        );
      }

      // Process question paper with Gemini
      console.log("🤖 Sending to Gemini AI for processing...");
      const result = await processQuestionPaper(questionPaperText);

      // Insert questions and ideal answers into database
      let questionsCount = 0;

      for (const item of result.questions) {
        // Insert question
        // Default to 5 marks if AI couldn't extract marks
        const marks = item.question.marks || 5;
        
        const { data: question, error: questionError } = await supabase
          .from("questions")
          .insert({
            question_paper_id: questionPaper.id,
            question_number: item.question.questionNumber,
            question_text: item.question.questionText,
            marks: marks,
            question_type: item.question.questionType || "short",
          })
          .select()
          .single();

        if (questionError) {
          console.error("❌ Question insert error:", questionError);
          continue;
        }

        questionsCount++;

        // Insert ideal answer
        const { error: answerError } = await supabase
          .from("ideal_answers")
          .insert({
            question_id: question.id,
            answer_text: item.idealAnswer.answerText,
            key_points: item.idealAnswer.keyPoints,
            generated_by: "gemini-2.0-flash-exp",
            is_approved: false,
            teacher_edited: false,
          });

        if (answerError) {
          console.error("❌ Answer insert error:", answerError);
        }
      }

      console.log(`✅ Inserted ${questionsCount} questions with answers`);

      // Update question paper status to completed
      await supabase
        .from("question_papers")
        .update({ status: "completed" })
        .eq("id", questionPaper.id);

      console.log("✅ Question paper status updated to completed");

      // Return success response
      return NextResponse.json({
        success: true,
        message: "Question paper uploaded and processed successfully",
        data: {
          questionPaperId: questionPaper.id,
          questionsCount,
          title: questionPaper.title,
          fileUrl: questionPaper.file_url,
        },
      });

    } catch (aiError) {
      console.error("❌ AI processing error:", aiError);

      // Update status to failed
      await supabase
        .from("question_papers")
        .update({ status: "failed" })
        .eq("id", questionPaper.id);

      return NextResponse.json(
        {
          success: false,
          message: `AI processing failed: ${aiError instanceof Error ? aiError.message : "Unknown error"}`,
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
