"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressTracker } from "@/components/progress-tracker"
import { UploadForms } from "@/components/upload-forms"
import { EvaluationResults } from "@/components/evaluation-results"
import { Navigation } from "@/components/navigation"
import { Breadcrumb } from "@/components/breadcrumb"
import { Upload, FileText, Brain, GraduationCap } from "lucide-react"

type ViewType = "home" | "upload" | "results"

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState("syllabus")
  const [currentView, setCurrentView] = useState<ViewType>("home")

  const handleStepClick = (step: string) => {
    setCurrentStep(step)
    setCurrentView("upload")
  }

  const handleStepComplete = (step: string, file?: File) => {
    const stepOrder = ["syllabus", "question-paper", "ideal-answer", "student-answer", "evaluation"]
    const currentIndex = stepOrder.indexOf(step)

    if (currentIndex < stepOrder.length - 1) {
      const nextStep = stepOrder[currentIndex + 1]
      setCurrentStep(nextStep)

      if (nextStep === "evaluation") {
        setTimeout(() => {
          setCurrentView("results")
        }, 2000)
      }
    }
  }

  const handleNavigate = (view: ViewType) => {
    setCurrentView(view)
  }

  const handleStartOver = () => {
    setCurrentView("home")
    setCurrentStep("syllabus")
  }

  const getBreadcrumbItems = () => {
    const items = [{ label: "Home", onClick: () => handleNavigate("home") }]

    if (currentView === "upload") {
      items.push({
        label: "Upload Files",
        onClick: () => handleNavigate("upload"),
        isActive: true,
      })
    } else if (currentView === "results") {
      items.push({
        label: "Upload Files",
        onClick: () => handleNavigate("upload"),
      })
      items.push({
        label: "Evaluation Results",
        isActive: true,
      })
    }

    return items
  }

  const renderContent = () => {
    switch (currentView) {
      case "results":
        return (
          <>
            <Breadcrumb items={getBreadcrumbItems()} />
            <ProgressTracker currentStep="evaluation" />
            <EvaluationResults onStartOver={handleStartOver} />
          </>
        )

      case "upload":
        return (
          <>
            <Breadcrumb items={getBreadcrumbItems()} />
            <ProgressTracker currentStep={currentStep} />
            <UploadForms currentStep={currentStep} onStepComplete={handleStepComplete} />
          </>
        )

      default:
        return (
          <>
            {/* Hero Section */}
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">CheckMate</h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 text-balance">
                AI Powered Answer Sheet Evaluation System
              </p>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
                Streamline your grading process with intelligent AI evaluation. Upload your syllabus, question papers,
                and student answers to get detailed, explainable evaluations.
              </p>
            </div>

            {/* Progress Tracker */}
            <ProgressTracker currentStep={currentStep} />

            {/* Action Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card
                className="cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-lg"
              >
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Upload Syllabus</CardTitle>
                  <CardDescription>Upload your course syllabus to establish evaluation criteria</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    variant="default"
                    onClick={() => window.location.href = '/syllabus/upload'}
                  >
                    Upload Syllabus
                  </Button>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-lg"
                onClick={() => handleStepClick("question-paper")}
              >
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mx-auto mb-4">
                    <FileText className="w-8 h-8 text-accent" />
                  </div>
                  <CardTitle className="text-xl">Upload Question Paper</CardTitle>
                  <CardDescription>
                    Upload the question paper for AI to understand the assessment structure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    variant={currentStep === "question-paper" ? "default" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStepClick("question-paper")
                    }}
                  >
                    Choose Question Paper
                  </Button>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-lg"
                onClick={() => handleStepClick("student-answer")}
              >
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mx-auto mb-4">
                    <Brain className="w-8 h-8 text-success" />
                  </div>
                  <CardTitle className="text-xl">Upload Student Answer</CardTitle>
                  <CardDescription>Upload student answer sheets for AI-powered evaluation</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    variant={currentStep === "student-answer" ? "default" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStepClick("student-answer")
                    }}
                  >
                    Choose Answer Sheet
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Features Section */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">AI-Powered</h3>
                <p className="text-sm text-muted-foreground">Advanced AI algorithms for accurate evaluation</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 mx-auto mb-4">
                  <FileText className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold mb-2">Detailed Reports</h3>
                <p className="text-sm text-muted-foreground">Comprehensive evaluation with explanations</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-success/10 mx-auto mb-4">
                  <Upload className="w-6 h-6 text-success" />
                </div>
                <h3 className="font-semibold mb-2">Easy Upload</h3>
                <p className="text-sm text-muted-foreground">Simple drag-and-drop file upload interface</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-chart-4/10 mx-auto mb-4">
                  <GraduationCap className="w-6 h-6 text-chart-4" />
                </div>
                <h3 className="font-semibold mb-2">Educational Focus</h3>
                <p className="text-sm text-muted-foreground">Designed specifically for academic evaluation</p>
              </div>
            </div>
          </>
        )
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation
        currentView={currentView}
        onNavigate={handleNavigate}
        showBackButton={currentView !== "home"}
        onBack={() => handleNavigate("home")}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">{renderContent()}</main>
    </div>
  )
}
