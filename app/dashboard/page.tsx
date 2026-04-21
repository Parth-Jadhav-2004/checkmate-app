import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/dashboard-content";
import { DashboardHeader } from "@/components/dashboard-header";
import { getSupabaseAdmin } from "@/lib/supabase";

async function getDashboardStats() {
  const supabase = getSupabaseAdmin();

  // Get syllabi count
  const { count: syllabiCount } = await supabase
    .from("syllabus")
    .select("*", { count: "exact", head: true });

  // Get only completed question papers
  const { count: completedPapers } = await supabase
    .from("question_papers")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed");

  // Get students count
  const { count: studentsCount } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true });

  return {
    syllabiCount: syllabiCount || 0,
    completedPapers: completedPapers || 0,
    studentsCount: studentsCount || 0,
  };
}

export default async function DashboardPage() {
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

  const stats = await getDashboardStats();

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />
      <DashboardContent user={user} stats={stats} />
    </div>
  );
}
