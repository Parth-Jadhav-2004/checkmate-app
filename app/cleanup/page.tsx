"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function CleanupPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const cleanupDuplicates = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/cleanup-duplicates", {
        method: "POST",
      });
      
      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        toast.success(`Cleaned up! Kept 1 record, deleted ${data.deletedCount} duplicates`);
      } else {
        toast.error("Cleanup failed: " + data.message);
      }
    } catch (error) {
      toast.error("Failed to cleanup");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Database Cleanup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            This will remove duplicate syllabus entries and keep only the most recent one.
          </p>
          
          <Button onClick={cleanupDuplicates} disabled={loading}>
            {loading ? "Cleaning up..." : "Remove Duplicates"}
          </Button>

          {result && (
            <div className="mt-4">
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
