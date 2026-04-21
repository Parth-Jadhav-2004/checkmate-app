import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { evaluateQuestion } from "@/lib/evaluation";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Split extracted text into individual answers using Gemini
 */
async function splitIntoAnswers(
  extractedText: string,
  questionNumbers: string[]
): Promise<Record<string, string>> {
  try {
    console.log("🔪 Splitting text into individual answers...");
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const prompt = `
You are a text parsing expert. Split the following answer sheet text into individual question answers.

QUESTION NUMBERS TO FIND:
${questionNumbers.join(", ")}

ANSWER SHEET TEXT:
${extractedText}

INSTRUCTIONS:
1. Identify each student answer for the given question numbers
2. Extract the complete answer text for each question
3. If a question is not answered or found, mark it as empty string
4. Return ONLY valid JSON, no markdown formatting

Return JSON in this exact format:
{
  "1": "Student's answer for question 1...",
  "2": "Student's answer for question 2...",
  "3": ""
}
`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse split answers from AI response");
    }

    const answers: Record<string, string> = JSON.parse(jsonMatch[0]);
    console.log(`✅ Split into ${Object.keys(answers).length} answers`);
    
    return answers;
  } catch (error) {
    console.error("❌ Error splitting answers:", error);
    // Return empty answers as fallback
    const emptyAnswers: Record<string, string> = {};
    questionNumbers.forEach((num) => {
      emptyAnswers[num] = "";
    });
    return emptyAnswers;
  }
}

/**
 * Extract text from PDF using Gemini 2.5 Pro with File API
 */
async function extractTextFromPDF(pdfUrl: string): Promise<string> {
  try {
    console.log("📄 Fetching PDF from:", pdfUrl);
    
    // Fetch the PDF file
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log("🔄 Uploading PDF to Gemini File API...");
    
    // Upload file to Gemini
    const { GoogleAIFileManager } = require("@google/generative-ai/server");
    const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
    
    // Write buffer to temporary file
    const fs = require("fs");
    const path = require("path");
    const os = require("os");
    const tempFilePath = path.join(os.tmpdir(), `answer-sheet-${Date.now()}.pdf`);
    
    fs.writeFileSync(tempFilePath, buffer);
    
    // Upload to Gemini
    const uploadResult = await fileManager.uploadFile(tempFilePath, {
      mimeType: "application/pdf",
      displayName: "Student Answer Sheet",
    });
    
    console.log(`✅ File uploaded: ${uploadResult.file.uri}`);
    
    // Clean up temp file
    fs.unlinkSync(tempFilePath);
    
    // Extract text using Gemini 2.0 Flash Thinking
    console.log("🤖 Extracting text using Gemini 2.0 Flash Thinking...");
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    
    const result = await model.generateContent([
      {
        fileData: {
          fileUri: uploadResult.file.uri,
          mimeType: uploadResult.file.mimeType,
        },
      },
      "Extract all the text from this student's answer sheet in order. " +
      "Preserve question numbering (Q1, Q2, etc.) if present. " +
      "Include all written content, even if handwritten. " +
      "Return the complete text as-is without any analysis or commentary.",
    ]);
    
    const extractedText = result.response.text().trim();
    
    console.log("✅ Text extracted successfully");
    console.log("📊 Extracted text length:", extractedText.length);
    
    if (!extractedText || extractedText.length < 10) {
      throw new Error(
        "Could not extract sufficient text from PDF. The file might be empty or unreadable."
      );
    }
    
    return extractedText;
  } catch (error) {
    console.error("❌ Error extracting text from PDF:", error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Step 1: Extract text from student's answer sheet
 */
export async function POST(request: NextRequest) {
  try {
    const { answerSheetId } = await request.json();
    
    if (!answerSheetId) {
      return NextResponse.json(
        { success: false, message: "Answer sheet ID is required" },
        { status: 400 }
      );
    }
    
    console.log("🎯 Starting evaluation for answer sheet:", answerSheetId);
    
    const supabase = getSupabaseAdmin();
    
    // Step 1: Get answer sheet details
    const { data: answerSheet, error: sheetError } = await supabase
      .from("answer_sheets")
      .select(`
        *,
        student:student_id (
          id,
          first_name,
          last_name,
          roll_number
        ),
        question_paper:question_paper_id (
          id,
          title,
          total_marks
        )
      `)
      .eq("id", answerSheetId)
      .single();
    
    if (sheetError || !answerSheet) {
      console.error("❌ Answer sheet not found:", sheetError);
      return NextResponse.json(
        { success: false, message: "Answer sheet not found" },
        { status: 404 }
      );
    }
    
    console.log("✅ Answer sheet found:", answerSheet.file_name);
    
    // Step 2: Extract text from PDF
    const extractedText = await extractTextFromPDF(answerSheet.file_url);
    
    // Step 3: Get ideal answers (only approved ones) for the question paper
    const { data: questions, error: questionsError } = await supabase
      .from("questions")
      .select(`
        id,
        question_number,
        question_text,
        marks,
        ideal_answers!inner (
          id,
          answer_text,
          key_points,
          is_approved
        )
      `)
      .eq("question_paper_id", answerSheet.question_paper_id)
      .eq("ideal_answers.is_approved", true)
      .order("question_number");
    
    if (questionsError || !questions || questions.length === 0) {
      console.error("❌ No approved ideal answers found:", questionsError);
      return NextResponse.json(
        { 
          success: false, 
          message: "No approved ideal answers found for this question paper. Please approve answers first." 
        },
        { status: 400 }
      );
    }
    
    console.log(`✅ Found ${questions.length} questions with approved ideal answers`);
    
    // Step 4: Update answer sheet status to in_progress
    await supabase
      .from("answer_sheets")
      .update({
        evaluation_status: "in_progress",
        updated_at: new Date().toISOString(),
      })
      .eq("id", answerSheetId);
    
    // Step 5: Split extracted text into individual answers
    const questionNumbers = questions.map((q: any) => q.question_number);
    const studentAnswers = await splitIntoAnswers(extractedText, questionNumbers);
    
    console.log("🎯 Starting evaluation of each question...");
    
    // Step 6: Evaluate each question
    const evaluationResults = [];
    let totalMarks = 0;
    let totalAwarded = 0;
    
    for (const question of questions) {
      const q = question as any;
      const studentAnswer = studentAnswers[q.question_number] || "";
      const idealAnswer = q.ideal_answers[0]?.answer_text || "";
      const keyPoints = q.ideal_answers[0]?.key_points || [];
      
      console.log(`\n📝 Question ${q.question_number}: "${q.question_text.substring(0, 50)}..."`);
      
      const evaluation = await evaluateQuestion(
        idealAnswer,
        keyPoints,
        q.marks,
        studentAnswer
      );
      
      totalMarks += q.marks;
      totalAwarded += evaluation.marksAwarded;
      
      evaluationResults.push({
        questionId: q.id,
        questionNumber: q.question_number,
        questionText: q.question_text,
        maxMarks: q.marks,
        marksAwarded: evaluation.marksAwarded,
        keywordMatchPercent: evaluation.keywordMatchPercent,
        contextSimilarityPercent: evaluation.contextSimilarityPercent,
        remark: evaluation.remark,
        studentAnswer,
      });
    }
    
    console.log(`\n🎉 Evaluation complete! Score: ${totalAwarded}/${totalMarks}`);
    
    // Step 7: Save detailed evaluation results to database
    const evaluationRecords = evaluationResults.map((result) => ({
      answer_sheet_id: answerSheetId,
      question_id: result.questionId,
      question_number: result.questionNumber,
      max_marks: result.maxMarks,
      marks_awarded: result.marksAwarded,
      keyword_match_percent: result.keywordMatchPercent,
      context_similarity_percent: result.contextSimilarityPercent,
      remark: result.remark,
      student_answer: result.studentAnswer,
    }));
    
    const { error: insertError } = await supabase
      .from("evaluation_results")
      .insert(evaluationRecords);
    
    if (insertError) {
      console.error("❌ Error saving evaluation results:", insertError);
    } else {
      console.log("✅ Detailed results saved to evaluation_results table");
    }
    
    // Step 8: Update answer sheet with summary
    await supabase
      .from("answer_sheets")
      .update({
        total_marks: totalMarks,
        obtained_marks: totalAwarded,
        evaluation_status: "evaluated",
        evaluated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", answerSheetId);
    
    console.log("✅ Answer sheet updated with final score");
    
    return NextResponse.json({
      success: true,
      message: "Evaluation completed successfully",
      data: {
        answerSheetId,
        studentName: `${answerSheet.student.first_name} ${answerSheet.student.last_name}`,
        rollNumber: answerSheet.student.roll_number,
        questionPaperTitle: answerSheet.question_paper.title,
        totalMarks,
        totalAwarded,
        percentage: ((totalAwarded / totalMarks) * 100).toFixed(2),
        evaluationResults,
      },
    });
    
  } catch (error) {
    console.error("❌ Evaluation error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Evaluation failed",
      },
      { status: 500 }
    );
  }
}
