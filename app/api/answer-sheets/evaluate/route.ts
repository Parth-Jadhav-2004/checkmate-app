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

    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
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
    
    console.log("🔄 Attempting text extraction using pdf-parse...");
    
    let extractedText = "";

    try {
      // Stage 1: Try pdf-parse for digital (text-layer) PDFs
      // Uses internal lib path to bypass pdf-parse v1 Next.js bug
      const pdfParse = require("pdf-parse/lib/pdf-parse");
      const data = await pdfParse(buffer);
      extractedText = data.text.trim();
      console.log("📊 pdf-parse extracted text length:", extractedText.length);
    } catch (parseErr) {
      console.warn("⚠️ pdf-parse failed, will fall back to vision model:", parseErr);
    }

    // Stage 2: If pdf-parse got nothing (scanned/image PDF), use a vision model
    if (!extractedText || extractedText.length < 50) {
      console.log("🖼️ PDF appears image-based. Using vision model (Gemini Flash) for OCR...");

      const base64Pdf = buffer.toString("base64");

      const visionModel = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
      
      const visionResult = await visionModel.generateContent([
        {
          inlineData: {
            data: base64Pdf,
            mimeType: "application/pdf"
          }
        },
        "Extract all the text from this student's answer sheet in order. " +
        "Preserve question numbering (Q1, Q2, 1., 2., etc.) if present. " +
        "Include all written content, even if handwritten. " +
        "Return the complete text as-is without any analysis or commentary."
      ]);

      extractedText = visionResult.response.text().trim() || "";
      console.log("📊 Vision model extracted text length:", extractedText.length);
    }

    console.log("✅ Text extraction complete");

    if (!extractedText || extractedText.length < 10) {
      throw new Error(
        "Could not extract text from PDF. The file may be corrupted or completely empty."
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
    
    // Generate Verification Hash
    const crypto = require('crypto');
    const evaluatedAt = new Date().toISOString();
    const hashPayload = `${answerSheetId}-${totalAwarded}-${answerSheet.student.id}-${evaluatedAt}`;
    const verificationHash = crypto.createHash('sha256').update(hashPayload).digest('hex');
    
    // Step 8: Update answer sheet with summary
    await supabase
      .from("answer_sheets")
      .update({
        total_marks: totalMarks,
        obtained_marks: totalAwarded,
        evaluation_status: "evaluated",
        evaluated_at: evaluatedAt,
        verification_hash: verificationHash,
        updated_at: new Date().toISOString(),
      })
      .eq("id", answerSheetId);
    
    console.log(`✅ Answer sheet updated with final score and verification hash: ${verificationHash}`);
    
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
