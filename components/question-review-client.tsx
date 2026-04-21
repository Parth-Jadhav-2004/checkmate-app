"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Edit,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Award,
  ArrowRight,
  Users,
} from "lucide-react";

interface Question {
  id: string;
  question_number: string;
  question_text: string;
  marks: number | null;
  question_type: string | null;
  ideal_answers: Array<{
    id: string;
    answer_text: string;
    key_points: string[] | null;
    generated_by: string;
    is_approved: boolean;
    teacher_edited: boolean;
  }>;
}

interface QuestionReviewClientProps {
  questionPaperId: string;
  questions: Question[];
}

export function QuestionReviewClient({ questionPaperId, questions }: QuestionReviewClientProps) {
  const router = useRouter();
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editedAnswers, setEditedAnswers] = useState<Record<string, string>>({});
  const [editedKeyPoints, setEditedKeyPoints] = useState<Record<string, string[]>>({});
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  const [approvedQuestions, setApprovedQuestions] = useState<Set<string>>(
    new Set(questions.filter((q) => q.ideal_answers[0]?.is_approved).map((q) => q.id))
  );

  const handleEdit = (question: Question) => {
    const answer = question.ideal_answers[0];
    if (!answer) return;

    setEditingQuestionId(question.id);
    setEditedAnswers({ ...editedAnswers, [question.id]: answer.answer_text });
    setEditedKeyPoints({
      ...editedKeyPoints,
      [question.id]: answer.key_points || [],
    });
  };

  const handleCancelEdit = (questionId: string) => {
    setEditingQuestionId(null);
    const newEditedAnswers = { ...editedAnswers };
    const newEditedKeyPoints = { ...editedKeyPoints };
    delete newEditedAnswers[questionId];
    delete newEditedKeyPoints[questionId];
    setEditedAnswers(newEditedAnswers);
    setEditedKeyPoints(newEditedKeyPoints);
  };

  const handleSave = async (question: Question) => {
    const answer = question.ideal_answers[0];
    if (!answer) return;

    setSavingStates({ ...savingStates, [question.id]: true });

    try {
      const response = await fetch("/api/questions/update-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answerId: answer.id,
          answerText: editedAnswers[question.id] || answer.answer_text,
          keyPoints: editedKeyPoints[question.id] || answer.key_points,
          teacherEdited: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update answer");
      }

      toast.success("Answer updated successfully", {
        description: `Question ${question.question_number} has been saved.`,
      });

      setEditingQuestionId(null);

      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error("Error saving answer:", error);
      toast.error("Failed to save answer", {
        description: "Please try again later.",
      });
    } finally {
      setSavingStates({ ...savingStates, [question.id]: false });
    }
  };

  const handleApprove = async (question: Question) => {
    const answer = question.ideal_answers[0];
    if (!answer) return;

    try {
      const response = await fetch("/api/questions/approve-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answerId: answer.id,
          isApproved: !approvedQuestions.has(question.id),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve answer");
      }

      const newApproved = new Set(approvedQuestions);
      const wasApproving = !approvedQuestions.has(question.id);
      
      if (approvedQuestions.has(question.id)) {
        newApproved.delete(question.id);
        toast.info("Approval removed", {
          description: `Question ${question.question_number} needs review.`,
        });
      } else {
        newApproved.add(question.id);
        
        // Check if this is the last question being approved
        const willBeAllApproved = newApproved.size === totalCount;
        
        if (willBeAllApproved) {
          toast.success("All answers approved! 🎉", {
            description: "Redirecting to student selection in 2 seconds...",
            duration: 5000,
          });
          
          // Auto-redirect after 2 seconds
          setTimeout(() => {
            router.push(`/dashboard/students?questionPaperId=${questionPaperId}`);
          }, 2000);
        } else {
          toast.success("Answer approved", {
            description: `Question ${question.question_number} is ready for evaluation.`,
          });
        }
      }
      setApprovedQuestions(newApproved);
    } catch (error) {
      console.error("Error approving answer:", error);
      toast.error("Failed to update approval status");
    }
  };

  const handleKeyPointChange = (questionId: string, index: number, value: string) => {
    const currentPoints = editedKeyPoints[questionId] || [];
    const newPoints = [...currentPoints];
    newPoints[index] = value;
    setEditedKeyPoints({ ...editedKeyPoints, [questionId]: newPoints });
  };

  const handleAddKeyPoint = (questionId: string) => {
    const currentPoints = editedKeyPoints[questionId] || [];
    setEditedKeyPoints({ ...editedKeyPoints, [questionId]: [...currentPoints, ""] });
  };

  const handleRemoveKeyPoint = (questionId: string, index: number) => {
    const currentPoints = editedKeyPoints[questionId] || [];
    const newPoints = currentPoints.filter((_, i) => i !== index);
    setEditedKeyPoints({ ...editedKeyPoints, [questionId]: newPoints });
  };

  const approvedCount = approvedQuestions.size;
  const totalCount = questions.length;
  const allApproved = approvedCount === totalCount && totalCount > 0;

  const handleProceedToStudents = () => {
    // Navigate to students page with question paper ID as query parameter
    router.push(`/dashboard/students?questionPaperId=${questionPaperId}`);
    toast.success("Redirecting to student selection", {
      description: "Select students to evaluate their answer sheets",
    });
  };

  return (
    <div className="space-y-6">
      {/* Progress Alert */}
      <Alert className={allApproved ? "border-green-500 bg-green-50 dark:bg-green-950" : ""}>
        <Sparkles className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>
              <strong>{approvedCount}</strong> of <strong>{totalCount}</strong> answers approved
            </span>
            {allApproved && (
              <Badge variant="default" className="ml-4 bg-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                All Approved
              </Badge>
            )}
          </div>
        </AlertDescription>
      </Alert>

      {/* Proceed Button - Show when all approved */}
      {allApproved && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  All Answers Approved!
                </h3>
                <p className="text-sm text-muted-foreground">
                  All ideal answers have been reviewed and approved. You can now proceed to select students for evaluation.
                </p>
              </div>
              <Button 
                onClick={handleProceedToStudents}
                size="lg"
                className="ml-4 bg-green-600 hover:bg-green-700"
              >
                <Users className="h-4 w-4 mr-2" />
                Select Students
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions List */}
      {questions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No questions found</p>
            <p className="text-sm text-muted-foreground mt-2">
              The AI processing may have failed. Please try uploading again.
            </p>
          </CardContent>
        </Card>
      ) : (
        questions.map((question) => {
          const answer = question.ideal_answers[0];
          const isEditing = editingQuestionId === question.id;
          const isSaving = savingStates[question.id];
          const isApproved = approvedQuestions.has(question.id);

          return (
            <Card key={question.id} className={isApproved ? "border-green-500/50" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Badge variant="outline">Q{question.question_number}</Badge>
                      {question.marks && (
                        <Badge variant="secondary" className="ml-2">
                          <Award className="h-3 w-3 mr-1" />
                          {question.marks} marks
                        </Badge>
                      )}
                      {answer?.teacher_edited && (
                        <Badge variant="default" className="ml-2">
                          Edited
                        </Badge>
                      )}
                      {isApproved && (
                        <Badge variant="default" className="ml-2 bg-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Approved
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">{question.question_text}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {answer ? (
                  <>
                    {/* Answer Text */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Ideal Answer:</label>
                      {isEditing ? (
                        <Textarea
                          value={editedAnswers[question.id] || answer.answer_text}
                          onChange={(e) =>
                            setEditedAnswers({
                              ...editedAnswers,
                              [question.id]: e.target.value,
                            })
                          }
                          rows={6}
                          className="font-mono text-sm"
                        />
                      ) : (
                        <div className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap">
                          {answer.answer_text}
                        </div>
                      )}
                    </div>

                    {/* Key Points */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Key Points for Evaluation:</label>
                      {isEditing ? (
                        <div className="space-y-2">
                          {(editedKeyPoints[question.id] || answer.key_points || []).map((point, idx) => (
                            <div key={idx} className="flex gap-2">
                              <Textarea
                                value={point}
                                onChange={(e) => handleKeyPointChange(question.id, idx, e.target.value)}
                                rows={2}
                                className="flex-1 text-sm"
                                placeholder={`Key point ${idx + 1}`}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveKeyPoint(question.id, idx)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddKeyPoint(question.id)}
                          >
                            Add Key Point
                          </Button>
                        </div>
                      ) : (
                        <ul className="list-disc list-inside space-y-1 bg-muted p-4 rounded-lg text-sm">
                          {(answer.key_points || []).map((point, idx) => (
                            <li key={idx}>{point}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      {isEditing ? (
                        <>
                          <Button onClick={() => handleSave(question)} disabled={isSaving}>
                            <Save className="h-4 w-4 mr-2" />
                            {isSaving ? "Saving..." : "Save Changes"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleCancelEdit(question.id)}
                            disabled={isSaving}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="outline" onClick={() => handleEdit(question)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Answer
                          </Button>
                          <Button
                            variant={isApproved ? "secondary" : "default"}
                            onClick={() => handleApprove(question)}
                          >
                            {isApproved ? (
                              <>
                                <X className="h-4 w-4 mr-2" />
                                Remove Approval
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Approve Answer
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </div>

                    {/* AI Info */}
                    {answer.teacher_edited && (
                      <div className="text-xs text-muted-foreground flex items-center gap-2 pt-2 border-t">
                        <Sparkles className="h-3 w-3" />
                        Edited by teacher
                      </div>
                    )}
                  </>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>No answer generated for this question</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
