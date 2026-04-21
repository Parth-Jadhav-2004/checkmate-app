"use client";

import { useRouter } from "next/navigation";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Mail, 
  Calendar, 
  GraduationCap, 
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import { AnswerSheetUpload } from "@/components/answer-sheet-upload";
import { toast } from "sonner";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  rollNumber: string;
  semester: string;
  enrollmentDate: string;
}

interface AnswerSheet {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  total_marks: number;
  obtained_marks?: number;
  evaluation_status: "pending" | "evaluated" | "in_progress";
  submitted_at: string;
  evaluated_at?: string;
  question_papers: {
    id: string;
    title: string;
    syllabus?: {
      id: string;
      course_name: string;
      course_code: string;
    };
  };
}

interface StudentDetailClientProps {
  student: Student;
  answerSheets: AnswerSheet[];
}

export function StudentDetailClient({ student, answerSheets }: StudentDetailClientProps) {
  const router = useRouter();

  const getInitials = () => {
    return `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`.toUpperCase();
  };

  const handleEvaluate = async (sheet: AnswerSheet) => {
    console.log("Evaluate answer sheet:", sheet);
    
    // Show loading toast
    const loadingToast = toast.loading("Starting evaluation...", {
      description: "This may take a few minutes",
    });
    
    try {
      const response = await fetch("/api/answer-sheets/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answerSheetId: sheet.id,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Evaluation failed");
      }
      
      toast.dismiss(loadingToast);
      toast.success("Evaluation completed!", {
        description: `Score: ${data.data.totalAwarded}/${data.data.totalMarks} (${data.data.percentage}%)`,
      });
      
      // Refresh the page to show updated results
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error("Evaluation error:", error);
      toast.dismiss(loadingToast);
      toast.error("Evaluation failed", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "evaluated":
        return "bg-green-500";
      case "in_progress":
        return "bg-yellow-500";
      case "pending":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "evaluated":
        return <CheckCircle2 className="h-4 w-4" />;
      case "in_progress":
        return <Clock className="h-4 w-4" />;
      case "pending":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const evaluatedSheets = answerSheets.filter(s => s.evaluation_status === "evaluated");
  const pendingSheets = answerSheets.filter(s => s.evaluation_status === "pending");
  const averageScore = evaluatedSheets.length > 0
    ? (evaluatedSheets.reduce((sum, sheet) => sum + (sheet.obtained_marks || 0), 0) / evaluatedSheets.length).toFixed(1)
    : "N/A";

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
            <BreadcrumbPage>{student.firstName} {student.lastName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Back Button */}
      <Button
        variant="outline"
        onClick={() => router.push("/dashboard/students")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Students
      </Button>

      {/* Student Info Card */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src="/placeholder-user.jpg" alt={student.firstName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-3xl mb-2">
                  {student.firstName} {student.lastName}
                </CardTitle>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    <span>{student.rollNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{student.email}</span>
                  </div>
                </div>
              </div>
            </div>
            <Badge className="text-lg px-4 py-2">
              {student.semester}th Semester
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Student ID</p>
              <p className="font-medium">{student.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Enrollment Date</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">
                  {new Date(student.enrollmentDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Submitted Sheets</p>
              <p className="font-medium text-2xl">{answerSheets.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Average Score</p>
              <p className="font-medium text-2xl">{averageScore}{averageScore !== "N/A" && "%"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{answerSheets.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All answer sheets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Evaluated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{evaluatedSheets.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed evaluations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{pendingSheets.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting evaluation</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="submissions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="submissions">
            <FileText className="mr-2 h-4 w-4" />
            Submissions
          </TabsTrigger>
          <TabsTrigger value="upload">
            <Upload className="mr-2 h-4 w-4" />
            Upload Answer Sheet
          </TabsTrigger>
        </TabsList>

        {/* Submissions Tab */}
        <TabsContent value="submissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Answer Sheet Submissions</CardTitle>
              <CardDescription>
                All answer sheets submitted by {student.firstName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {answerSheets.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No answer sheets submitted yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {answerSheets.map((sheet) => (
                    <Card key={sheet.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <h3 className="font-semibold text-lg">
                                {sheet.question_papers.title}
                              </h3>
                              <Badge 
                                variant="secondary" 
                                className={`${getStatusColor(sheet.evaluation_status)} text-white`}
                              >
                                <span className="flex items-center gap-1">
                                  {getStatusIcon(sheet.evaluation_status)}
                                  {sheet.evaluation_status.replace("_", " ").toUpperCase()}
                                </span>
                              </Badge>
                              {sheet.evaluation_status === "evaluated" && sheet.obtained_marks !== null && sheet.obtained_marks !== undefined && (
                                <Badge variant="outline" className="font-bold text-base border-green-600 text-green-600">
                                  Score: {sheet.obtained_marks}/{sheet.total_marks} ({((sheet.obtained_marks / sheet.total_marks) * 100).toFixed(1)}%)
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {sheet.question_papers.syllabus?.course_name || "N/A"}
                            </p>
                            <div className="flex items-center gap-6 text-sm">
                              <div>
                                <span className="text-muted-foreground">File: </span>
                                <span className="font-medium">{sheet.file_name}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Submitted: </span>
                                <span className="font-medium">
                                  {new Date(sheet.submitted_at).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>
                              {sheet.evaluation_status === "evaluated" && sheet.obtained_marks && (
                                <div>
                                  <span className="text-muted-foreground">Score: </span>
                                  <span className="font-bold text-green-600">
                                    {sheet.obtained_marks}/{sheet.total_marks}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(sheet.file_url, '_blank')}
                            >
                              View PDF
                            </Button>
                            {sheet.evaluation_status === "evaluated" ? (
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => router.push(`/dashboard/students/${student.id}/evaluations/${sheet.id}`)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                View Report
                              </Button>
                            ) : (
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => handleEvaluate(sheet)}
                              >
                                Evaluate
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload Answer Sheet</CardTitle>
              <CardDescription>
                Upload a new answer sheet for {student.firstName} {student.lastName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnswerSheetUpload studentId={student.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
