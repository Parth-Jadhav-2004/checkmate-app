"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, XCircle, AlertCircle, Download, RotateCcw, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface EvaluationResult {
  questionNo: string
  studentAnswer: string
  idealAnswer: string
  marksScored: number
  totalMarks: number
  remarks: string
  status: "correct" | "incorrect" | "partial"
}

interface EvaluationResultsProps {
  onStartOver: () => void
}

// Mock data for demonstration
const mockResults: EvaluationResult[] = [
  {
    questionNo: "1",
    studentAnswer: "Photosynthesis is the process by which plants convert sunlight into energy using chlorophyll.",
    idealAnswer:
      "Photosynthesis is the process by which plants convert light energy, usually from the sun, into chemical energy (glucose) using chlorophyll in the presence of carbon dioxide and water.",
    marksScored: 7,
    totalMarks: 10,
    remarks:
      "Good understanding of the basic concept. Missing details about carbon dioxide, water, and glucose production.",
    status: "partial",
  },
  {
    questionNo: "2",
    studentAnswer: "The mitochondria is the powerhouse of the cell and produces ATP through cellular respiration.",
    idealAnswer:
      "The mitochondria is the powerhouse of the cell, producing ATP through cellular respiration by breaking down glucose in the presence of oxygen.",
    marksScored: 9,
    totalMarks: 10,
    remarks: "Excellent answer with clear understanding. Minor detail about glucose and oxygen could be added.",
    status: "correct",
  },
  {
    questionNo: "3",
    studentAnswer: "DNA stands for something related to genetics.",
    idealAnswer:
      "DNA stands for Deoxyribonucleic Acid, which is the hereditary material in humans and almost all other organisms that carries genetic information.",
    marksScored: 2,
    totalMarks: 10,
    remarks: "Very basic understanding shown. Answer lacks specific knowledge of what DNA stands for and its function.",
    status: "incorrect",
  },
  {
    questionNo: "4",
    studentAnswer:
      "Enzymes are biological catalysts that speed up chemical reactions in living organisms by lowering activation energy.",
    idealAnswer:
      "Enzymes are biological catalysts that speed up chemical reactions in living organisms by lowering the activation energy required for the reaction to occur.",
    marksScored: 10,
    totalMarks: 10,
    remarks: "Perfect answer demonstrating complete understanding of enzyme function and mechanism.",
    status: "correct",
  },
  {
    questionNo: "5",
    studentAnswer: "Evolution is when animals change over time.",
    idealAnswer:
      "Evolution is the process by which species change over time through natural selection, genetic variation, and adaptation to environmental pressures.",
    marksScored: 3,
    totalMarks: 10,
    remarks:
      "Basic concept mentioned but lacks understanding of mechanisms like natural selection, genetic variation, and environmental factors.",
    status: "incorrect",
  },
]

export function EvaluationResults({ onStartOver }: EvaluationResultsProps) {
  const totalMarks = mockResults.reduce((sum, result) => sum + result.totalMarks, 0)
  const scoredMarks = mockResults.reduce((sum, result) => sum + result.marksScored, 0)
  const percentage = Math.round((scoredMarks / totalMarks) * 100)

  const correctAnswers = mockResults.filter((r) => r.status === "correct").length
  const partialAnswers = mockResults.filter((r) => r.status === "partial").length
  const incorrectAnswers = mockResults.filter((r) => r.status === "incorrect").length

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "correct":
        return <CheckCircle className="w-5 h-5 text-success" />
      case "partial":
        return <AlertCircle className="w-5 h-5 text-chart-4" />
      case "incorrect":
        return <XCircle className="w-5 h-5 text-destructive" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "correct":
        return (
          <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
            Correct
          </Badge>
        )
      case "partial":
        return (
          <Badge variant="secondary" className="bg-chart-4/10 text-chart-4 border-chart-4/20">
            Partial
          </Badge>
        )
      case "incorrect":
        return (
          <Badge variant="secondary" className="bg-destructive/10 text-destructive border-destructive/20">
            Incorrect
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
              <span className="text-xl md:text-2xl font-bold">
                {scoredMarks}/{totalMarks}
              </span>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">{percentage}% Overall</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Correct</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-success flex-shrink-0" />
              <span className="text-xl md:text-2xl font-bold text-success">{correctAnswers}</span>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">Out of {mockResults.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Partial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-chart-4 flex-shrink-0" />
              <span className="text-xl md:text-2xl font-bold text-chart-4">{partialAnswers}</span>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">Needs work</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Incorrect</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <XCircle className="w-4 h-4 md:w-5 md:h-5 text-destructive flex-shrink-0" />
              <span className="text-xl md:text-2xl font-bold text-destructive">{incorrectAnswers}</span>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">Review needed</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Results */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg md:text-xl">Evaluation Summary</CardTitle>
              <CardDescription>Detailed breakdown of student performance with AI-powered explanations</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" size="sm" className="w-full sm:w-auto bg-transparent">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline" size="sm" onClick={onStartOver} className="w-full sm:w-auto bg-transparent">
                <RotateCcw className="w-4 h-4 mr-2" />
                Start Over
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 sm:w-20">Q#</TableHead>
                      <TableHead className="min-w-[200px]">Student Answer</TableHead>
                      <TableHead className="min-w-[200px] hidden lg:table-cell">Ideal Answer</TableHead>
                      <TableHead className="w-20 sm:w-24">Score</TableHead>
                      <TableHead className="w-20 sm:w-24">Status</TableHead>
                      <TableHead className="min-w-[250px]">AI Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockResults.map((result) => (
                      <TableRow key={result.questionNo}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(result.status)}
                            <span className="text-sm">Q{result.questionNo}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="text-sm">
                            <p className="line-clamp-3">{result.studentAnswer}</p>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs hidden lg:table-cell">
                          <div className="text-sm text-muted-foreground">
                            <p className="line-clamp-3">{result.idealAnswer}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <span
                              className={cn(
                                "font-semibold text-sm",
                                result.status === "correct" && "text-success",
                                result.status === "partial" && "text-chart-4",
                                result.status === "incorrect" && "text-destructive",
                              )}
                            >
                              {result.marksScored}/{result.totalMarks}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(result.status)}</TableCell>
                        <TableCell className="max-w-md">
                          <p className="text-sm text-muted-foreground line-clamp-2">{result.remarks}</p>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Insights</CardTitle>
          <CardDescription>AI-generated recommendations for improvement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-success/5 border border-success/20 rounded-lg">
              <h4 className="font-semibold text-success mb-2">Strengths</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Strong understanding of basic biological concepts</li>
                <li>• Good grasp of enzyme function and cellular processes</li>
                <li>• Clear and concise writing style</li>
              </ul>
            </div>
            <div className="p-4 bg-chart-4/5 border border-chart-4/20 rounded-lg">
              <h4 className="font-semibold text-chart-4 mb-2">Areas for Improvement</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Include more specific details in answers</li>
                <li>• Focus on understanding complex processes like evolution</li>
                <li>• Learn scientific terminology and definitions</li>
              </ul>
            </div>
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <h4 className="font-semibold text-primary mb-2">Recommendations</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Review chapters on genetics and evolution</li>
                <li>• Practice writing detailed explanations</li>
                <li>• Focus on understanding mechanisms behind biological processes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
