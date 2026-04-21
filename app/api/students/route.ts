import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Fetch all students
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    // Fetch all students ordered by enrollment date
    const { data: students, error } = await supabase
      .from("students")
      .select("*")
      .order("enrollment_date", { ascending: false });

    if (error) {
      console.error("Fetch students error:", error);
      return NextResponse.json(
        { error: "Failed to fetch students", details: error.message },
        { status: 500 }
      );
    }

    // Transform data to match frontend interface
    const transformedStudents = students?.map((student) => ({
      id: student.id,
      firstName: student.first_name,
      lastName: student.last_name,
      email: student.email,
      rollNumber: student.roll_number,
      semester: student.semester,
      enrollmentDate: student.enrollment_date,
    })) || [];

    return NextResponse.json(
      { students: transformedStudents },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/students error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// POST - Add a new student
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();

    // Validate required fields
    const { firstName, lastName, email, rollNumber, semester } = body;

    if (!firstName || !lastName || !email || !rollNumber || !semester) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from("students")
      .select("id")
      .eq("email", email)
      .single();

    if (existingEmail) {
      return NextResponse.json(
        { error: "A student with this email already exists" },
        { status: 409 }
      );
    }

    // Check if roll number already exists
    const { data: existingRollNumber } = await supabase
      .from("students")
      .select("id")
      .eq("roll_number", rollNumber)
      .single();

    if (existingRollNumber) {
      return NextResponse.json(
        { error: "A student with this roll number already exists" },
        { status: 409 }
      );
    }

    // Insert new student
    const { data: newStudent, error } = await supabase
      .from("students")
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: email,
        roll_number: rollNumber,
        semester: semester,
        enrollment_date: new Date().toISOString().split("T")[0],
      })
      .select()
      .single();

    if (error) {
      console.error("Insert student error:", error);
      return NextResponse.json(
        { error: "Failed to add student", details: error.message },
        { status: 500 }
      );
    }

    // Transform data to match frontend interface
    const transformedStudent = {
      id: newStudent.id,
      firstName: newStudent.first_name,
      lastName: newStudent.last_name,
      email: newStudent.email,
      rollNumber: newStudent.roll_number,
      semester: newStudent.semester,
      enrollmentDate: newStudent.enrollment_date,
    };

    return NextResponse.json(
      {
        message: "Student added successfully",
        student: transformedStudent,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/students error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
