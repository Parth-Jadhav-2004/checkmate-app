"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DiagnosticPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const testResults: any = {
      timestamp: new Date().toISOString(),
      tests: [],
    };

    // Test 1: Check environment variables
    testResults.tests.push({
      name: "Environment Variables",
      status: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ PASS" : "❌ FAIL",
      details: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
    });

    // Test 2: Fetch from syllabus table
    try {
      const { data, error } = await supabase
        .from("syllabus")
        .select("*")
        .order("created_at", { ascending: false });

      testResults.tests.push({
        name: "Database Query",
        status: error ? "❌ FAIL" : "✅ PASS",
        details: {
          recordsFound: data?.length || 0,
          error: error?.message,
          data: data,
        },
      });
    } catch (error: any) {
      testResults.tests.push({
        name: "Database Query",
        status: "❌ FAIL",
        details: {
          error: error.message,
        },
      });
    }

    // Test 3: Test API endpoint
    try {
      const response = await fetch("/api/test-supabase");
      const apiData = await response.json();
      
      testResults.tests.push({
        name: "API Endpoint Test",
        status: apiData.success ? "✅ PASS" : "❌ FAIL",
        details: apiData,
      });
    } catch (error: any) {
      testResults.tests.push({
        name: "API Endpoint Test",
        status: "❌ FAIL",
        details: {
          error: error.message,
        },
      });
    }

    setResults(testResults);
    setLoading(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Supabase Diagnostic Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={runTests} disabled={loading} className="mb-6">
            {loading ? "Running Tests..." : "Run Tests Again"}
          </Button>

          {results && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Test run at: {new Date(results.timestamp).toLocaleString()}
              </div>

              {results.tests.map((test: any, index: number) => (
                <Card key={index} className="border">
                  <CardHeader>
                    <CardTitle className="text-base">
                      {test.status} {test.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto">
                      {JSON.stringify(test.details, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
