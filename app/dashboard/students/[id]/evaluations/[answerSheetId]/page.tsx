import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";
import { EvaluationReportClient } from "@/components/evaluation-report-client";
import { getSupabaseAdmin } from "@/lib/supabase";

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

async function getEvaluationResults(answerSheetId: string) {
  try {
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
      console.error("Answer sheet not found:", sheetError);
      return null;
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
      return null;
    }

    if (!results || results.length === 0) {
      console.error("No evaluation results found for answer sheet:", answerSheetId);
      return null;
    }

    return {
      answerSheet: {
        id: answerSheet.id,
        fileName: answerSheet.file_name,
        fileUrl: answerSheet.file_url,
        totalMarks: answerSheet.total_marks,
        obtainedMarks: answerSheet.obtained_marks,
        evaluationStatus: answerSheet.evaluation_status,
        submittedAt: answerSheet.submitted_at,
        evaluatedAt: answerSheet.evaluated_at,
        verificationHash: answerSheet.verification_hash,
      },
      student: {
        id: (answerSheet as any).student.id,
        name: `${(answerSheet as any).student.first_name} ${(answerSheet as any).student.last_name}`,
        rollNumber: (answerSheet as any).student.roll_number,
        email: (answerSheet as any).student.email,
      },
      questionPaper: {
        id: (answerSheet as any).question_paper.id,
        title: (answerSheet as any).question_paper.title,
        examDate: (answerSheet as any).question_paper.exam_date,
        course: (answerSheet as any).question_paper.syllabus?.course_name,
        courseCode: (answerSheet as any).question_paper.syllabus?.course_code,
        semester: (answerSheet as any).question_paper.syllabus?.semester,
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
    };
  } catch (error) {
    console.error("Error fetching evaluation results:", error);
    return null;
  }
}

export default async function EvaluationReportPage({ 
  params 
}: { 
  params: { id: string; answerSheetId: string } 
}) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  const clerkUser = await currentUser();

  const user = {
    firstName: clerkUser?.firstName || clerkUser?.username || "User",
    lastName: clerkUser?.lastName || "",
    email: clerkUser?.emailAddresses[0]?.emailAddress || "",
    role: "teacher",
  };

  const evaluationData = await getEvaluationResults(params.answerSheetId);

  if (!evaluationData) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader user={user} />
        <main className="container mx-auto py-8 px-4 max-w-7xl">
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Evaluation results not found</p>
            <a 
              href={`/dashboard/students/${params.id}`}
              className="text-primary hover:underline"
            >
              ← Back to Student
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />
      <main className="container mx-auto py-8 px-4 max-w-7xl">
        <EvaluationReportClient 
          evaluationData={evaluationData}
          studentId={params.id}
        />
      </main>
    </div>
  );
}
