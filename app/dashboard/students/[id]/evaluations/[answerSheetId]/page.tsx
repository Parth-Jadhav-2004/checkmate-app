import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";
import { EvaluationReportClient } from "@/components/evaluation-report-client";

async function getEvaluationResults(answerSheetId: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/answer-sheets/evaluation-results?answerSheetId=${answerSheetId}`,
      { cache: 'no-store' }
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.data || null;
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
