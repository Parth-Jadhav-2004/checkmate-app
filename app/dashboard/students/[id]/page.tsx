import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { StudentDetailClient } from "@/components/student-detail-client";
import { DashboardHeader } from "@/components/dashboard-header";
import { getSupabaseAdmin } from "@/lib/supabase";

async function getStudent(studentId: string) {
  try {
    const supabase = getSupabaseAdmin();
    
    const { data: student, error } = await supabase
      .from("students")
      .select("*")
      .eq("id", studentId)
      .single();
    
    if (error || !student) {
      console.error("Error fetching student:", error);
      return null;
    }
    
    // Transform data to match expected format
    return {
      id: student.id,
      firstName: student.first_name,
      lastName: student.last_name,
      email: student.email,
      rollNumber: student.roll_number,
      semester: student.semester,
      enrollmentDate: student.enrollment_date,
    };
  } catch (error) {
    console.error("Error fetching student:", error);
    return null;
  }
}

async function getAnswerSheets(studentId: string) {
  try {
    const supabase = getSupabaseAdmin();
    
    const { data: answerSheets, error } = await supabase
      .from("answer_sheets")
      .select(`
        *,
        question_papers:question_paper_id (
          id,
          title,
          syllabus:syllabus_id (
            id,
            course_name,
            course_code
          )
        )
      `)
      .eq("student_id", studentId)
      .order("submitted_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching answer sheets:", error);
      return [];
    }
    
    return answerSheets || [];
  } catch (error) {
    console.error("Error fetching answer sheets:", error);
    return [];
  }
}

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  // Get authenticated user from Clerk
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  const clerkUser = await currentUser();

  // Format user data for dashboard
  const user = {
    firstName: clerkUser?.firstName || clerkUser?.username || "User",
    lastName: clerkUser?.lastName || "",
    email: clerkUser?.emailAddresses[0]?.emailAddress || "",
    role: "teacher",
  };

  const studentId = params.id;

  // Fetch student and answer sheets
  const student = await getStudent(studentId);
  const answerSheets = await getAnswerSheets(studentId);

  if (!student) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader user={user} />
        <main className="container mx-auto py-8 px-4 max-w-7xl">
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Student not found</p>
            <a 
              href="/dashboard/students"
              className="text-primary hover:underline"
            >
              ← Back to Students
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
        <StudentDetailClient 
          student={student}
          answerSheets={answerSheets}
        />
      </main>
    </div>
  );
}
