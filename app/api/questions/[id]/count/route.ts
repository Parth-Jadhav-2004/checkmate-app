import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// GET - Get question count for a question paper
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = await context.params;

    const { count, error } = await supabase
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("question_paper_id", id);

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message, count: 0 },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: count || 0,
    });
  } catch (error) {
    console.error("Error fetching question count:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch question count",
        count: 0,
      },
      { status: 500 }
    );
  }
}
