import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST() {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Get all syllabus records
    const { data: allRecords, error: fetchError } = await supabaseAdmin
      .from("syllabus")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      return NextResponse.json({
        success: false,
        message: "Failed to fetch records",
        error: fetchError.message,
      }, { status: 500 });
    }

    if (!allRecords || allRecords.length <= 1) {
      return NextResponse.json({
        success: true,
        message: "No duplicates found",
        totalRecords: allRecords?.length || 0,
        deletedCount: 0,
      });
    }

    // Keep only the first record (most recent), delete the rest
    const recordsToKeep = allRecords.slice(0, 1);
    const recordsToDelete = allRecords.slice(1);

    // Delete old records
    const idsToDelete = recordsToDelete.map(r => r.id);
    
    const { error: deleteError } = await supabaseAdmin
      .from("syllabus")
      .delete()
      .in("id", idsToDelete);

    if (deleteError) {
      return NextResponse.json({
        success: false,
        message: "Failed to delete duplicates",
        error: deleteError.message,
      }, { status: 500 });
    }

    // Also clean up files from storage
    for (const record of recordsToDelete) {
      try {
        await supabaseAdmin.storage
          .from("Syllabus-Files")
          .remove([record.file_path]);
      } catch (err) {
        console.log("Failed to delete file:", record.file_path);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Duplicates removed successfully",
      totalRecords: allRecords.length,
      deletedCount: recordsToDelete.length,
      keptRecord: recordsToKeep[0],
    });

  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json({
      success: false,
      message: "Cleanup failed",
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
