"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GraduationCap, Menu, Home, Upload, BarChart3, Settings, HelpCircle } from "lucide-react"

interface NavigationProps {
  currentView: "home" | "upload" | "results"
  onNavigate: (view: "home" | "upload" | "results") => void
  showBackButton?: boolean
  onBack?: () => void
}

export function Navigation({ currentView, onNavigate, showBackButton, onBack }: NavigationProps) {
  return (
    <nav className="border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigate("home")}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">CheckMate</h1>
                <p className="text-sm text-muted-foreground">AI Answer Evaluation</p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Button
              variant={currentView === "home" ? "default" : "ghost"}
              size="sm"
              onClick={() => onNavigate("home")}
              className="flex items-center space-x-2"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Button>

            <Button
              variant={currentView === "upload" ? "default" : "ghost"}
              size="sm"
              onClick={() => onNavigate("upload")}
              className="flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </Button>

            <Button
              variant={currentView === "results" ? "default" : "ghost"}
              size="sm"
              onClick={() => onNavigate("results")}
              className="flex items-center space-x-2"
              disabled={currentView !== "results"}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Results</span>
            </Button>

            {showBackButton && onBack && (
              <Button variant="outline" size="sm" onClick={onBack}>
                Back
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/sign-in'}
              className="flex items-center space-x-2"
            >
              <span>Sign In</span>
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={() => window.location.href = '/sign-up'}
              className="flex items-center space-x-2"
            >
              <span>Sign Up</span>
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onNavigate("home")}>
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate("upload")}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Files
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate("results")} disabled={currentView !== "results"}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Results
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Help
                </DropdownMenuItem>
                {showBackButton && onBack && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onBack}>Back</DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}
