import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { marksAwarded, answerSheetId } = body;

    // Validate input
    if (typeof marksAwarded !== 'number' || marksAwarded < 0) {
      return NextResponse.json(
        { error: "Invalid marks value" },
        { status: 400 }
      );
    }

    if (!answerSheetId) {
      return NextResponse.json(
        { error: "Answer sheet ID is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Update the marks in evaluation_results table
    const { data: updatedResult, error: updateError } = await supabase
      .from("evaluation_results")
      .update({ 
        marks_awarded: marksAwarded,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating evaluation result:", updateError);
      return NextResponse.json(
        { error: "Failed to update marks" },
        { status: 500 }
      );
    }

    // Recalculate total marks for the answer sheet
    const { data: allResults, error: fetchError } = await supabase
      .from("evaluation_results")
      .select("marks_awarded")
      .eq("answer_sheet_id", answerSheetId);

    if (fetchError) {
      console.error("Error fetching evaluation results:", fetchError);
      return NextResponse.json(
        { error: "Failed to recalculate total marks" },
        { status: 500 }
      );
    }

    // Calculate new total
    const newTotalMarks = allResults.reduce(
      (sum, result) => sum + (result.marks_awarded || 0),
      0
    );

    // Update answer sheet with new total
    const { error: sheetUpdateError } = await supabase
      .from("answer_sheets")
      .update({ 
        obtained_marks: newTotalMarks,
        updated_at: new Date().toISOString()
      })
      .eq("id", answerSheetId);

    if (sheetUpdateError) {
      console.error("Error updating answer sheet:", sheetUpdateError);
      return NextResponse.json(
        { error: "Failed to update total marks" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedResult,
      newTotalMarks,
    });
  } catch (error) {
    console.error("Error in PATCH /api/evaluation-results/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
