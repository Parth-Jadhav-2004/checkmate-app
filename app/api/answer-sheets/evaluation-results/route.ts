import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/answer-sheets/evaluation-results?answerSheetId=xxx
 * Fetch detailed evaluation results for an answer sheet
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const answerSheetId = searchParams.get("answerSheetId");

    if (!answerSheetId) {
      return NextResponse.json(
        { success: false, message: "Answer sheet ID is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Fetch answer sheet details
    const { data: answerSheet, error: sheetError } = await supabase
      .from("answer_sheets")
      .select(`
        *,
        student:student_id (
          id,
          first_name,
          last_name,
          roll_number,
          email
        ),
        question_paper:question_paper_id (
          id,
          title,
          exam_date,
          syllabus:syllabus_id (
            course_name,
            course_code,
            semester
          )
        )
      `)
      .eq("id", answerSheetId)
      .single();

    if (sheetError || !answerSheet) {
      return NextResponse.json(
        { success: false, message: "Answer sheet not found" },
        { status: 404 }
      );
    }

    // Fetch evaluation results
    const { data: results, error: resultsError } = await supabase
      .from("evaluation_results")
      .select(`
        *,
        question:question_id (
          question_text,
          marks
        )
      `)
      .eq("answer_sheet_id", answerSheetId)
      .order("question_number");

    if (resultsError) {
      console.error("Error fetching evaluation results:", resultsError);
      return NextResponse.json(
        { success: false, message: "Failed to fetch evaluation results" },
        { status: 500 }
      );
    }

    // Check if evaluation exists
    if (!results || results.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: "No evaluation results found. Please evaluate the answer sheet first." 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        answerSheet: {
          id: answerSheet.id,
          fileName: answerSheet.file_name,
          fileUrl: answerSheet.file_url,
          totalMarks: answerSheet.total_marks,
          obtainedMarks: answerSheet.obtained_marks,
          evaluationStatus: answerSheet.evaluation_status,
          submittedAt: answerSheet.submitted_at,
          evaluatedAt: answerSheet.evaluated_at,
        },
        student: {
          id: answerSheet.student.id,
          name: `${answerSheet.student.first_name} ${answerSheet.student.last_name}`,
          rollNumber: answerSheet.student.roll_number,
          email: answerSheet.student.email,
        },
        questionPaper: {
          id: answerSheet.question_paper.id,
          title: answerSheet.question_paper.title,
          examDate: answerSheet.question_paper.exam_date,
          course: answerSheet.question_paper.syllabus?.course_name,
          courseCode: answerSheet.question_paper.syllabus?.course_code,
          semester: answerSheet.question_paper.syllabus?.semester,
        },
        evaluationResults: results.map((r: any) => ({
          id: r.id,
          questionNumber: r.question_number,
          questionText: r.question?.question_text,
          maxMarks: r.max_marks,
          marksAwarded: r.marks_awarded,
          keywordMatchPercent: r.keyword_match_percent,
          contextSimilarityPercent: r.context_similarity_percent,
          remark: r.remark,
          studentAnswer: r.student_answer,
        })),
        summary: {
          totalQuestions: results.length,
          totalMarks: answerSheet.total_marks,
          obtainedMarks: answerSheet.obtained_marks,
          percentage: ((answerSheet.obtained_marks / answerSheet.total_marks) * 100).toFixed(2),
          grade: getGrade(answerSheet.obtained_marks, answerSheet.total_marks),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching evaluation results:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch results",
      },
      { status: 500 }
    );
  }
}

function getGrade(obtained: number, total: number): string {
  const percentage = (obtained / total) * 100;
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 40) return "D";
  return "F";
}
