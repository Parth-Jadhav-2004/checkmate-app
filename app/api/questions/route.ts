import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    console.log("📋 Fetching question papers from database...");

    // Fetch all question papers (including processing and failed ones)
    const { data: papers, error } = await supabase
      .from("question_papers")
      .select(`
        id,
        title,
        syllabus_id,
        status,
        total_marks,
        exam_date,
        file_name,
        file_url,
        created_at,
        syllabus:syllabus_id (
          id,
          course_name,
          course_code,
          semester
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching question papers:", error);
      return NextResponse.json(
        { success: false, message: error.message, papers: [] },
        { status: 500 }
      );
    }

    console.log(`✅ Found ${papers?.length || 0} question papers in database`);
    console.log("📋 Paper IDs:", papers?.map(p => ({ id: p.id, title: p.title })));

    return NextResponse.json(
      {
        success: true,
        papers: papers || [],
        count: papers?.length || 0,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "An unexpected error occurred",
        papers: [],
      },
      { status: 500 }
    );
  }
}
