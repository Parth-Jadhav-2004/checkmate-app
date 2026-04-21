import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// GET - Fetch a single question paper
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = await context.params;

    const { data: paper, error } = await supabase
      .from("question_papers")
      .select(`
        *,
        syllabus:syllabus_id (
          id,
          course_name,
          course_code,
          semester
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      paper,
    });
  } catch (error) {
    console.error("Error fetching question paper:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch question paper",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a question paper and all related data
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = await context.params;

    console.log(`🗑️ Starting deletion of question paper ID: ${id}`);
    console.log(`🗑️ ID type: ${typeof id}, ID value: "${id}"`);

    // First, get the question paper details (to get file_path for storage deletion)
    const { data: paper, error: fetchError } = await supabase
      .from("question_papers")
      .select("file_path, title, id")
      .eq("id", id)
      .single();

    if (fetchError || !paper) {
      console.error("❌ Question paper not found!");
      console.error("❌ Error:", fetchError);
      console.error("❌ Attempted ID:", id);
      return NextResponse.json(
        { success: false, message: `Question paper not found with ID: ${id}` },
        { status: 404 }
      );
    }

    console.log(`📄 Found question paper: ${paper.title} (ID: ${paper.id})`);

    // Get all questions for this paper (to delete ideal answers)
    const { data: questions, error: questionsError } = await supabase
      .from("questions")
      .select("id")
      .eq("question_paper_id", id);

    if (questionsError) {
      console.error("Error fetching questions:", questionsError);
    }

    const questionIds = questions?.map(q => q.id) || [];
    console.log(`📝 Found ${questionIds.length} questions to delete`);

    // Delete ideal answers for all questions
    if (questionIds.length > 0) {
      console.log(`🗑️ Deleting ideal answers for ${questionIds.length} questions...`);
      const { error: answersError } = await supabase
        .from("ideal_answers")
        .delete()
        .in("question_id", questionIds);

      if (answersError) {
        console.error("❌ Error deleting ideal answers:", answersError);
        return NextResponse.json(
          { success: false, message: `Failed to delete ideal answers: ${answersError.message}` },
          { status: 500 }
        );
      } else {
        console.log(`✅ Deleted ideal answers for ${questionIds.length} questions`);
      }
    }

    // Delete all questions for this paper
    console.log(`🗑️ Deleting ${questionIds.length} questions for paper ${id}...`);
    const { error: deleteQuestionsError } = await supabase
      .from("questions")
      .delete()
      .eq("question_paper_id", id);

    if (deleteQuestionsError) {
      console.error("❌ Error deleting questions:", deleteQuestionsError);
      return NextResponse.json(
        { success: false, message: `Failed to delete questions: ${deleteQuestionsError.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ Deleted ${questionIds.length} questions`);

    // Delete answer sheets related to this question paper
    console.log(`🗑️ Deleting answer sheets for paper ${id}...`);
    const { error: answerSheetsError } = await supabase
      .from("answer_sheets")
      .delete()
      .eq("question_paper_id", id);

    if (answerSheetsError) {
      console.error("❌ Error deleting answer sheets:", answerSheetsError);
      // Don't fail - continue with deletion
    } else {
      console.log(`✅ Deleted answer sheets`);
    }

    // Delete the question paper record
    console.log(`🗑️ Deleting question paper record ${id}...`);
    const { error: deletePaperError } = await supabase
      .from("question_papers")
      .delete()
      .eq("id", id);

    if (deletePaperError) {
      console.error("❌ Error deleting question paper:", deletePaperError);
      return NextResponse.json(
        { success: false, message: `Failed to delete question paper: ${deletePaperError.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ Deleted question paper record`);

    // Delete the file from storage
    if (paper.file_path) {
      const { error: storageError } = await supabase.storage
        .from("Question-Papers")
        .remove([paper.file_path]);

      if (storageError) {
        console.error("Error deleting file from storage:", storageError);
        // Don't fail the whole operation if storage deletion fails
      } else {
        console.log("✅ Deleted file from storage");
      }
    }

    console.log("🎉 Question paper deletion completed successfully");

    return NextResponse.json({
      success: true,
      message: "Question paper deleted successfully",
    });
  } catch (error) {
    console.error("❌ Unexpected error during deletion:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete question paper",
      },
      { status: 500 }
    );
  }
}
