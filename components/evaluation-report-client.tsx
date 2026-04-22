"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  FileText, 
  Award,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  GraduationCap,
  Download,
  Edit,
  Save,
  X,
  ShieldCheck,
  RotateCcw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EvaluationData {
  answerSheet: {
    id: string;
    fileName: string;
    fileUrl: string;
    totalMarks: number;
    obtainedMarks: number;
    evaluationStatus: string;
    submittedAt: string;
    evaluatedAt: string;
    verificationHash?: string;
  };
  student: {
    id: string;
    name: string;
    rollNumber: string;
    email: string;
  };
  questionPaper: {
    id: string;
    title: string;
    examDate: string;
    course: string;
    courseCode: string;
    semester: string;
  };
  evaluationResults: Array<{
    id: string;
    questionNumber: string;
    questionText: string;
    maxMarks: number;
    marksAwarded: number;
    keywordMatchPercent: number;
    contextSimilarityPercent: number;
    remark: string;
    studentAnswer: string;
  }>;
  summary: {
    totalQuestions: number;
    totalMarks: number;
    obtainedMarks: number;
    percentage: string;
    grade: string;
  };
}

interface EvaluationReportClientProps {
  evaluationData: EvaluationData;
  studentId: string;
}

export function EvaluationReportClient({ evaluationData, studentId }: EvaluationReportClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedMarks, setEditedMarks] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isReEvaluating, setIsReEvaluating] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  const getGradeColor = (grade: string) => {
    if (grade === "A+" || grade === "A") return "bg-green-600";
    if (grade === "B+" || grade === "B") return "bg-blue-600";
    if (grade === "C") return "bg-yellow-600";
    if (grade === "D") return "bg-orange-600";
    return "bg-red-600";
  };

  const getRemarkColor = (remark: string) => {
    if (remark.includes("Excellent")) return "text-green-600";
    if (remark.includes("Very good")) return "text-blue-600";
    if (remark.includes("Partially")) return "text-yellow-600";
    return "text-red-600";
  };

  const handleReEvaluate = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to re-evaluate this answer sheet? This will replace all current marks and regenerate the verification hash."
    );
    if (!confirmed) return;

    setIsReEvaluating(true);
    try {
      const response = await fetch('/api/answer-sheets/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answerSheetId: evaluationData.answerSheet.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Re-evaluation failed');
      }

      toast({
        title: "Re-evaluation Complete",
        description: "The answer sheet has been re-evaluated successfully. Refreshing...",
      });

      // Refresh the page to show updated data
      router.refresh();
      // Small delay to allow server data to update before full reload
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error('Re-evaluation error:', error);
      toast({
        title: "Re-evaluation Failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsReEvaluating(false);
    }
  };

  const handleEditClick = () => {
    setIsEditMode(true);
    // Initialize edited marks with current values
    const initialMarks: Record<string, number> = {};
    evaluationData.evaluationResults.forEach(result => {
      initialMarks[result.id] = result.marksAwarded;
    });
    setEditedMarks(initialMarks);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedMarks({});
  };

  const handleMarkChange = (resultId: string, value: string, maxMarks: number) => {
    const numValue = parseFloat(value);
    
    // Validate input
    if (isNaN(numValue) || numValue < 0) {
      setEditedMarks(prev => ({ ...prev, [resultId]: 0 }));
      return;
    }
    
    if (numValue > maxMarks) {
      toast({
        title: "Invalid Marks",
        description: `Marks cannot exceed ${maxMarks}`,
        variant: "destructive",
      });
      setEditedMarks(prev => ({ ...prev, [resultId]: maxMarks }));
      return;
    }
    
    setEditedMarks(prev => ({ ...prev, [resultId]: numValue }));
  };

  const handleSaveMarks = async () => {
    setIsSaving(true);
    
    try {
      // Update each modified mark
      const updatePromises = Object.entries(editedMarks).map(async ([resultId, newMarks]) => {
        const originalResult = evaluationData.evaluationResults.find(r => r.id === resultId);
        
        // Only update if marks changed
        if (originalResult && originalResult.marksAwarded !== newMarks) {
          const response = await fetch(`/api/evaluation-results/${resultId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              marksAwarded: newMarks,
              answerSheetId: evaluationData.answerSheet.id 
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to update marks for question ${originalResult.questionNumber}`);
          }
        }
      });

      await Promise.all(updatePromises);

      toast({
        title: "Success",
        description: "Marks updated successfully!",
      });

      // Refresh the page to show updated data
      router.refresh();
      setIsEditMode(false);
      setEditedMarks({});
    } catch (error) {
      console.error('Error saving marks:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save marks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate updated totals if in edit mode
  const getDisplayedMarks = (resultId: string, originalMarks: number) => {
    return isEditMode && editedMarks[resultId] !== undefined ? editedMarks[resultId] : originalMarks;
  };

  const calculateUpdatedTotals = () => {
    if (!isEditMode) {
      return {
        obtainedMarks: evaluationData.summary.obtainedMarks,
        percentage: evaluationData.summary.percentage,
        grade: evaluationData.summary.grade,
      };
    }

    const newObtainedMarks = evaluationData.evaluationResults.reduce((sum, result) => {
      return sum + getDisplayedMarks(result.id, result.marksAwarded);
    }, 0);

    const newPercentage = ((newObtainedMarks / evaluationData.summary.totalMarks) * 100).toFixed(2);
    
    let newGrade = "F";
    const percent = parseFloat(newPercentage);
    if (percent >= 90) newGrade = "A+";
    else if (percent >= 85) newGrade = "A";
    else if (percent >= 75) newGrade = "B+";
    else if (percent >= 65) newGrade = "B";
    else if (percent >= 55) newGrade = "C";
    else if (percent >= 45) newGrade = "D";

    return {
      obtainedMarks: newObtainedMarks,
      percentage: newPercentage,
      grade: newGrade,
    };
  };

  const displayedTotals = calculateUpdatedTotals();

  return (
    <>
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/students">Students</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/dashboard/students/${studentId}`}>
              {evaluationData.student.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Evaluation Report</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Back Button */}
      <Button
        variant="outline"
        onClick={() => router.push(`/dashboard/students/${studentId}`)}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Student Profile
      </Button>

      {/* Header Section */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl mb-2">Evaluation Report</CardTitle>
              <CardDescription className="text-base">
                {evaluationData.questionPaper.title}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {isEditMode ? (
                <>
                  <Button onClick={handleCancelEdit} variant="outline" size="sm" disabled={isSaving}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSaveMarks} size="sm" disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    onClick={handleReEvaluate} 
                    variant="outline" 
                    size="sm"
                    disabled={isReEvaluating}
                    className="border-orange-500 text-orange-600 hover:bg-orange-50"
                  >
                    <RotateCcw className={`h-4 w-4 mr-2 ${isReEvaluating ? 'animate-spin' : ''}`} />
                    {isReEvaluating ? "Re-evaluating..." : "Re-evaluate"}
                  </Button>
                  <Button onClick={handleEditClick} variant="outline" size="sm" disabled={isReEvaluating}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Marks
                  </Button>
                  <Badge className={`${getGradeColor(displayedTotals.grade)} text-white text-2xl px-6 py-3`}>
                    Grade: {displayedTotals.grade}
                  </Badge>
                </>
              )}
              {isEditMode && (
                <Badge className={`${getGradeColor(displayedTotals.grade)} text-white text-2xl px-6 py-3`}>
                  Grade: {displayedTotals.grade}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Student</p>
                <p className="font-medium">{evaluationData.student.name}</p>
                <p className="text-sm text-muted-foreground">{evaluationData.student.rollNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Course</p>
                <p className="font-medium">{evaluationData.questionPaper.course}</p>
                <p className="text-sm text-muted-foreground">{evaluationData.questionPaper.courseCode}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Evaluated On</p>
                <p className="font-medium">
                  {new Date(evaluationData.answerSheet.evaluatedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4" />
              Total Score
              {isEditMode && <Badge variant="secondary" className="ml-2">Editing</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {displayedTotals.obtainedMarks}/{evaluationData.summary.totalMarks}
            </div>
            <Progress 
              value={(displayedTotals.obtainedMarks / evaluationData.summary.totalMarks) * 100} 
              className="mt-3"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Percentage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{displayedTotals.percentage}%</div>
            <p className="text-sm text-muted-foreground mt-2">
              {displayedTotals.grade} Grade
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{evaluationData.summary.totalQuestions}</div>
            <p className="text-sm text-muted-foreground mt-2">Total evaluated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Answer Sheet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              size="sm"
              className="w-full"
              onClick={() => window.open(evaluationData.answerSheet.fileUrl, '_blank')}
            >
              <Download className="h-4 w-4 mr-2" />
              View PDF
            </Button>
          </CardContent>
        </Card>

        {evaluationData.answerSheet.verificationHash && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                Anti-Tamper Verify
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-2">
              {baseUrl ? (
                <QRCodeCanvas 
                  value={`${baseUrl}/verify/${evaluationData.answerSheet.id}?hash=${evaluationData.answerSheet.verificationHash}`} 
                  size={84} 
                  level="M"
                  includeMargin={true}
                />
              ) : (
                <div style={{ width: 84, height: 84 }} className="bg-muted animate-pulse" />
              )}
              <p className="text-[9px] font-bold text-primary mt-1 text-center uppercase tracking-wider">Scan to Verify</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Question-wise Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Question-wise Evaluation</CardTitle>
          <CardDescription>
            Detailed breakdown of marks, keyword matching, and context similarity for each question
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Q.No</TableHead>
                <TableHead>Question</TableHead>
                <TableHead className="text-center w-[100px]">Marks</TableHead>
                <TableHead className="text-center w-[120px]">Keyword Match</TableHead>
                <TableHead className="text-center w-[120px]">Context Sim.</TableHead>
                <TableHead>Remark</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evaluationData.evaluationResults.map((result) => {
                const displayedMarks = getDisplayedMarks(result.id, result.marksAwarded);
                
                return (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">{result.questionNumber}</TableCell>
                    <TableCell>
                      <div className="max-w-md">
                        <p className="line-clamp-2 text-sm">{result.questionText}</p>
                        {result.studentAnswer && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-primary">
                              View student answer
                            </summary>
                            <p className="text-xs mt-2 p-2 bg-muted rounded">
                              {result.studentAnswer || "No answer provided"}
                            </p>
                          </details>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {isEditMode ? (
                        <div className="flex items-center justify-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max={result.maxMarks}
                            step="0.5"
                            value={displayedMarks}
                            onChange={(e) => handleMarkChange(result.id, e.target.value, result.maxMarks)}
                            className="w-16 h-8 text-center"
                          />
                          <span className="text-sm text-muted-foreground">/ {result.maxMarks}</span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="font-bold">
                          {displayedMarks}/{result.maxMarks}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-medium">{result.keywordMatchPercent}%</span>
                        <Progress value={result.keywordMatchPercent} className="h-1 w-16" />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-medium">{result.contextSimilarityPercent}%</span>
                        <Progress value={result.contextSimilarityPercent} className="h-1 w-16" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className={`text-sm font-medium ${getRemarkColor(result.remark)}`}>
                        {result.remark}
                      </p>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Footer Actions */}
      <div className="mt-8 flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.push(`/dashboard/students/${studentId}`)}>
          Back to Student
        </Button>
        <Button onClick={() => window.print()}>
          <FileText className="h-4 w-4 mr-2" />
          Print Report
        </Button>
      </div>
    </>
  );
}
