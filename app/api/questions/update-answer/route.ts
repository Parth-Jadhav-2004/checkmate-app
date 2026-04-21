import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { answerId, answerText, keyPoints, teacherEdited } = await request.json();

    if (!answerId || !answerText) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Update the ideal answer
    const { data, error } = await supabase
      .from("ideal_answers")
      .update({
        answer_text: answerText,
        key_points: keyPoints || [],
        teacher_edited: teacherEdited || false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", answerId)
      .select()
      .single();

    if (error) {
      console.error("Error updating answer:", error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Answer updated successfully",
      data,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
