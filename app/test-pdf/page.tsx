"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileUploadZone } from "@/components/file-upload-zone";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle, FileText } from "lucide-react";

export default function TestPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTest = async () => {
    if (!file) return;

    setTesting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/test-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Test failed",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">PDF Test Tool</h1>
      <p className="text-muted-foreground mb-8">
        Test if your PDF can be parsed correctly before uploading
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Upload PDF to Test</CardTitle>
          <CardDescription>
            This will test if the PDF contains extractable text
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FileUploadZone
            onFileSelect={(f) => setFile(f)}
            acceptedFormats={[".pdf"]}
            maxSize={10}
            disabled={testing}
          />

          {file && (
            <div className="flex items-center gap-4">
              <Button onClick={handleTest} disabled={testing}>
                {testing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Test PDF
                  </>
                )}
              </Button>
            </div>
          )}

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {result.success ? (
                  <div className="space-y-4">
                    <div className="font-medium text-green-600">✅ PDF Can Be Parsed!</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex gap-2">
                        <Badge>Pages: {result.info.pages}</Badge>
                        <Badge>Text Length: {result.info.textLength} chars</Badge>
                        <Badge variant={result.info.hasText ? "default" : "destructive"}>
                          {result.info.hasText ? "Has Text" : "No Text"}
                        </Badge>
                      </div>
                      
                      {result.info.textLength > 0 ? (
                        <>
                          <div className="mt-4">
                            <div className="font-medium mb-2">Preview (first 500 chars):</div>
                            <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-48 whitespace-pre-wrap">
                              {result.info.preview}
                            </pre>
                          </div>
                          
                          <div className="mt-4">
                            <div className="font-medium mb-2">Full Extracted Text:</div>
                            <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-96 whitespace-pre-wrap">
                              {result.info.fullText}
                            </pre>
                          </div>
                        </>
                      ) : (
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="font-medium text-yellow-800">⚠️ Warning</p>
                          <p className="text-yellow-700 text-sm mt-1">
                            The PDF has no extractable text. It might be:
                            <ul className="list-disc list-inside mt-2">
                              <li>A scanned image (needs OCR)</li>
                              <li>Protected/encrypted</li>
                              <li>Corrupted</li>
                            </ul>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="font-medium">❌ Test Failed</div>
                    <div className="text-sm">{result.message}</div>
                    {result.error && (
                      <pre className="bg-muted p-2 rounded text-xs mt-2 overflow-auto">
                        {result.error}
                      </pre>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
