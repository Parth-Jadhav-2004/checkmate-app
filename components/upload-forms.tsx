"use client"

import { useState } from "react"
import { FileUpload } from "./file-upload"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText, Brain, GraduationCap, ArrowRight, Loader2 } from "lucide-react"

interface UploadFormsProps {
  currentStep: string
  onStepComplete: (step: string, file?: File) => void
}

interface UploadedFiles {
  syllabus?: File
  questionPaper?: File
  studentAnswer?: File
}

export function UploadForms({ currentStep, onStepComplete }: UploadFormsProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFiles>({})
  const [isGenerating, setIsGenerating] = useState(false)

  const handleFileUpload = (step: string, file: File | null) => {
    if (file) {
      setUploadedFiles((prev) => ({ ...prev, [step]: file }))
      onStepComplete(step, file)
    } else {
      setUploadedFiles((prev) => {
        const newFiles = { ...prev }
        delete newFiles[step as keyof UploadedFiles]
        return newFiles
      })
    }
  }

  const handleGenerateIdealAnswer = async () => {
    setIsGenerating(true)
    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 3000))
    setIsGenerating(false)
    onStepComplete("ideal-answer")
  }

  const renderUploadForm = () => {
    switch (currentStep) {
      case "syllabus":
        return (
          <div className="max-w-2xl mx-auto">
            <FileUpload
              title="Upload Course Syllabus"
              description="Upload your course syllabus to establish evaluation criteria and learning objectives"
              acceptedFileTypes={[".pdf", ".doc", ".docx", ".txt"]}
              onFileUpload={(file) => handleFileUpload("syllabus", file)}
              uploadedFile={uploadedFiles.syllabus}
              icon={GraduationCap}
            />
            {uploadedFiles.syllabus && (
              <div className="mt-6 text-center">
                <Button onClick={() => onStepComplete("syllabus", uploadedFiles.syllabus)} className="w-full sm:w-auto">
                  Continue to Question Paper
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )

      case "question-paper":
        return (
          <div className="max-w-2xl mx-auto">
            <FileUpload
              title="Upload Question Paper"
              description="Upload the question paper so AI can understand the assessment structure and requirements"
              acceptedFileTypes={[".pdf", ".doc", ".docx", ".jpg", ".png"]}
              onFileUpload={(file) => handleFileUpload("questionPaper", file)}
              uploadedFile={uploadedFiles.questionPaper}
              icon={FileText}
            />
            {uploadedFiles.questionPaper && (
              <div className="mt-6 text-center">
                <Button
                  onClick={() => onStepComplete("question-paper", uploadedFiles.questionPaper)}
                  className="w-full sm:w-auto"
                >
                  Continue to Generate Ideal Answers
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )

      case "ideal-answer":
        return (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4">
                  <Brain className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Generate Ideal Answers</CardTitle>
                <CardDescription>
                  AI will analyze your syllabus and question paper to generate ideal answers for evaluation
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Files ready for processing:</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-center space-x-2">
                        <GraduationCap className="w-4 h-4 text-success" />
                        <span className="text-sm">Syllabus: {uploadedFiles.syllabus?.name}</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <FileText className="w-4 h-4 text-success" />
                        <span className="text-sm">Question Paper: {uploadedFiles.questionPaper?.name}</span>
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleGenerateIdealAnswer} disabled={isGenerating} className="w-full sm:w-auto">
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Ideal Answers...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4 mr-2" />
                        Generate Ideal Answers
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "student-answer":
        return (
          <div className="max-w-2xl mx-auto">
            <FileUpload
              title="Upload Student Answer Sheet"
              description="Upload student answer sheets for AI-powered evaluation against the ideal answers"
              acceptedFileTypes={[".pdf", ".doc", ".docx", ".jpg", ".png"]}
              onFileUpload={(file) => handleFileUpload("studentAnswer", file)}
              uploadedFile={uploadedFiles.studentAnswer}
              icon={Upload}
            />
            {uploadedFiles.studentAnswer && (
              <div className="mt-6 text-center">
                <Button
                  onClick={() => onStepComplete("student-answer", uploadedFiles.studentAnswer)}
                  className="w-full sm:w-auto"
                >
                  Start Evaluation
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return <div className="py-8">{renderUploadForm()}</div>
}
