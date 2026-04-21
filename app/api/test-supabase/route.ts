import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    console.log("=== Testing Supabase Connection ===");
    
    // Test 1: Check environment variables
    const envCheck = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };
    console.log("Environment:", envCheck);

    // Test 2: List all buckets
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
    
    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError);
      return NextResponse.json({
        success: false,
        message: "Failed to list buckets",
        error: bucketsError.message,
        envCheck,
      }, { status: 500 });
    }

    console.log("Found buckets:", buckets?.map(b => ({ name: b.name, public: b.public })));

    // Test 3: Check if syllabus-files bucket exists
    const syllabusBucket = buckets?.find(b => b.name === "syllabus-files");
    
    // Test 4: Try to list files in the bucket (if it exists)
    let filesInBucket = null;
    if (syllabusBucket) {
      const { data: files, error: filesError } = await supabaseAdmin.storage
        .from("syllabus-files")
        .list();
      
      if (!filesError) {
        filesInBucket = files;
        console.log("Files in syllabus-files bucket:", files?.length);
      }
    }

    // Test 5: Check database connection
    const { data: dbTest, error: dbError } = await supabaseAdmin
      .from("syllabus")
      .select("count");

    return NextResponse.json({
      success: true,
      message: "Supabase connection test completed",
      results: {
        environment: envCheck,
        bucketsFound: buckets?.length || 0,
        bucketsList: buckets?.map(b => ({ name: b.name, public: b.public })),
        syllabusBucketExists: !!syllabusBucket,
        syllabusBucketPublic: syllabusBucket?.public,
        filesInBucket: filesInBucket?.length || 0,
        databaseConnected: !dbError,
        databaseError: dbError?.message,
      },
    });

  } catch (error) {
    console.error("Test error:", error);
    return NextResponse.json({
      success: false,
      message: "Test failed",
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
