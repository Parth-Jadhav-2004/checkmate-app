import { getSupabaseAdmin } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, FileText, User } from "lucide-react";

async function verifyAnswerSheet(id: string, providedHash: string | null) {
  if (!providedHash) return { verified: false, error: "No hash provided" };

  try {
    const supabase = getSupabaseAdmin();
    const { data: answerSheet, error } = await supabase
      .from("answer_sheets")
      .select(`
        id,
        obtained_marks,
        evaluated_at,
        verification_hash,
        student:student_id ( id, first_name, last_name, roll_number )
      `)
      .eq("id", id)
      .single();

    const sheet = answerSheet as any;

    if (error || !sheet) {
      return { verified: false, error: "Answer sheet not found" };
    }

    if (!sheet.verification_hash) {
      return { verified: false, error: "This answer sheet does not have a verification hash." };
    }

    // Server-side calculation verification (Blockchain-style verification)
    const crypto = require('crypto');
    const student = Array.isArray(sheet.student) ? sheet.student[0] : sheet.student;
    // Normalize the timestamp to ISO string format (with "Z" suffix) to match
    // what was used during hash generation: new Date().toISOString()
    const normalizedEvaluatedAt = new Date(sheet.evaluated_at).toISOString();
    const hashPayload = `${sheet.id}-${sheet.obtained_marks}-${student.id}-${normalizedEvaluatedAt}`;
    const calculatedHash = crypto.createHash('sha256').update(hashPayload).digest('hex');

    const isVerified = calculatedHash === providedHash && sheet.verification_hash === providedHash;

    return { 
      verified: isVerified, 
      answerSheet: { ...sheet, student },
      error: isVerified ? null : "Verification failed. The data may have been tampered with." 
    };
  } catch (error) {
    return { verified: false, error: "An error occurred during verification" };
  }
}

export default async function VerifyPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const hash = searchParams.hash as string | null;
  const result = await verifyAnswerSheet(params.id, hash);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            {result.verified ? (
              <ShieldCheck className="h-8 w-8 text-green-600" />
            ) : (
              <ShieldAlert className="h-8 w-8 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            Evaluation Verification
          </CardTitle>
          <CardDescription>
            Anti-Tamper Integrity Check
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {result.verified && result.answerSheet ? (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-4 text-center">
                <p className="font-semibold text-lg flex items-center justify-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Verified Authentic
                </p>
                <p className="text-sm mt-1 opacity-90">
                  This document's integrity has been cryptographically verified.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Student</p>
                    <p className="font-medium">
                      {result.answerSheet.student.first_name} {result.answerSheet.student.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Roll No: {result.answerSheet.student.roll_number}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Evaluation Date</p>
                    <p className="font-medium">
                      {new Date(result.answerSheet.evaluated_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Marks Awarded</span>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {result.answerSheet.obtained_marks}
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 text-center">
                <p className="font-semibold text-lg flex items-center justify-center gap-2">
                  <ShieldAlert className="h-5 w-5" />
                  Verification Failed
                </p>
                <p className="text-sm mt-1 opacity-90">
                  {result.error}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {hash && (
        <p className="text-[10px] text-gray-400 mt-6 max-w-md text-center break-all">
          Hash: {hash}
        </p>
      )}
    </div>
  );
}
