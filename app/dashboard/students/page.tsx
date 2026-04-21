import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";
import { StudentsTableClient } from "@/components/students-table-client";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabaseAdmin } from "@/lib/supabase";

async function getStudents() {
  try {
    const supabase = getSupabaseAdmin();
    
    const { data: students, error } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Failed to fetch students:", error);
      return [];
    }
    
    // Transform data to match expected format
    return (students || []).map(student => ({
      id: student.id,
      firstName: student.first_name,
      lastName: student.last_name,
      email: student.email,
      rollNumber: student.roll_number,
      semester: student.semester,
      enrollmentDate: student.enrollment_date,
    }));
  } catch (error) {
    console.error("Error fetching students:", error);
    return [];
  }
}

export default async function StudentsPage() {
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

  // Fetch students from database
  const students = await getStudents();

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />

      <main className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Students</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Client-side components */}
        <StudentsTableClient initialStudents={students} />
      </main>
    </div>
  );
}
