import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Fetch a single student by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseAdmin();
    const studentId = params.id;

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    // Fetch student by ID
    const { data: student, error } = await supabase
      .from("students")
      .select("*")
      .eq("id", studentId)
      .single();

    if (error || !student) {
      console.error("Fetch student error:", error);
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Transform data to match frontend interface
    const transformedStudent = {
      id: student.id,
      firstName: student.first_name,
      lastName: student.last_name,
      email: student.email,
      rollNumber: student.roll_number,
      semester: student.semester,
      enrollmentDate: student.enrollment_date,
    };

    return NextResponse.json(
      { student: transformedStudent },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/students/[id] error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
