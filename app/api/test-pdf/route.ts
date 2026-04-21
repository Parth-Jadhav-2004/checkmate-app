import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 }
      );
    }

    console.log("📄 Testing PDF file:", file.name);
    console.log("📊 File info:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("✅ Buffer created, size:", buffer.length);

    // Try to parse PDF
    const pdfParse = require("pdf-parse");
    console.log("📖 Attempting to parse PDF...");

    const pdfData = await pdfParse(buffer, {
      max: 0, // parse all pages
    });

    console.log("✅ PDF parsed successfully!");

    const response = {
      success: true,
      info: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        pages: pdfData.numpages,
        textLength: pdfData.text.length,
        hasText: pdfData.text.trim().length > 0,
        preview: pdfData.text.substring(0, 500),
        fullText: pdfData.text, // Include full text for debugging
      },
    };

    console.log("📊 PDF Analysis:", response.info);

    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ Test failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
        error: error instanceof Error ? error.toString() : "Unknown error",
      },
      { status: 500 }
    );
  }
}
