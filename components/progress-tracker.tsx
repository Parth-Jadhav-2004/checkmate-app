import type React from "react"
import { CheckCircle, Upload, FileText, Brain, ClipboardCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProgressStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  status: "completed" | "current" | "upcoming"
}

interface ProgressTrackerProps {
  currentStep: string
}

export function ProgressTracker({ currentStep }: ProgressTrackerProps) {
  const steps: ProgressStep[] = [
    {
      id: "syllabus",
      title: "Syllabus Uploaded",
      description: "Upload course syllabus",
      icon: Upload,
      status: getStepStatus("syllabus", currentStep),
    },
    {
      id: "question-paper",
      title: "Question Paper Uploaded",
      description: "Upload question paper",
      icon: FileText,
      status: getStepStatus("question-paper", currentStep),
    },
    {
      id: "ideal-answer",
      title: "Ideal Answer Generated",
      description: "AI generates ideal answers",
      icon: Brain,
      status: getStepStatus("ideal-answer", currentStep),
    },
    {
      id: "student-answer",
      title: "Student Answer Uploaded",
      description: "Upload student answer sheet",
      icon: Upload,
      status: getStepStatus("student-answer", currentStep),
    },
    {
      id: "evaluation",
      title: "Evaluation Done",
      description: "AI evaluation complete",
      icon: ClipboardCheck,
      status: getStepStatus("evaluation", currentStep),
    },
  ]

  return (
    <div className="w-full max-w-5xl mx-auto mb-8 md:mb-12">
      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300",
                  step.status === "completed" && "bg-success border-success text-success-foreground",
                  step.status === "current" && "bg-primary border-primary text-primary-foreground",
                  step.status === "upcoming" && "bg-muted border-border text-muted-foreground",
                )}
              >
                {step.status === "completed" ? <CheckCircle className="w-6 h-6" /> : <step.icon className="w-6 h-6" />}
              </div>
              <div className="mt-3 text-center max-w-24">
                <p
                  className={cn(
                    "text-sm font-medium",
                    step.status === "completed" && "text-success",
                    step.status === "current" && "text-primary",
                    step.status === "upcoming" && "text-muted-foreground",
                  )}
                >
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-4 transition-all duration-300",
                  getConnectionStatus(steps[index], steps[index + 1]) === "completed" ? "bg-success" : "bg-border",
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center space-x-4">
            <div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 flex-shrink-0",
                step.status === "completed" && "bg-success border-success text-success-foreground",
                step.status === "current" && "bg-primary border-primary text-primary-foreground",
                step.status === "upcoming" && "bg-muted border-border text-muted-foreground",
              )}
            >
              {step.status === "completed" ? <CheckCircle className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm font-medium",
                  step.status === "completed" && "text-success",
                  step.status === "current" && "text-primary",
                  step.status === "upcoming" && "text-muted-foreground",
                )}
              >
                {step.title}
              </p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
            {index < steps.length - 1 && <div className="absolute left-5 mt-10 w-0.5 h-4 bg-border" />}
          </div>
        ))}
      </div>
    </div>
  )
}

function getStepStatus(stepId: string, currentStep: string): "completed" | "current" | "upcoming" {
  const stepOrder = ["syllabus", "question-paper", "ideal-answer", "student-answer", "evaluation"]
  const currentIndex = stepOrder.indexOf(currentStep)
  const stepIndex = stepOrder.indexOf(stepId)

  if (stepIndex < currentIndex) return "completed"
  if (stepIndex === currentIndex) return "current"
  return "upcoming"
}

function getConnectionStatus(currentStep: ProgressStep, nextStep: ProgressStep): "completed" | "upcoming" {
  return currentStep.status === "completed" ? "completed" : "upcoming"
}
