"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  FileText, 
  Users, 
  ArrowRight
} from "lucide-react";

interface DashboardContentProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  stats: {
    syllabiCount: number;
    completedPapers: number;
    studentsCount: number;
  };
}

export function DashboardContent({ user, stats }: DashboardContentProps) {
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return "Good Morning";
      if (hour < 18) return "Good Afternoon";
      return "Good Evening";
    };

    setGreeting(getGreeting());
  }, []);

  const navigationCards = [
    {
      title: "Syllabus",
      description: "Manage course syllabi and upload new ones",
      icon: BookOpen,
      href: "/syllabus",
      color: "bg-blue-500",
      stats: `${stats.syllabiCount} Active`,
    },
    {
      title: "Question Papers",
      description: "Upload and review AI-generated answers",
      icon: FileText,
      href: "/questions",
      color: "bg-purple-500",
      stats: `${stats.completedPapers} Completed`,
    },
    {
      title: "Students",
      description: "View and manage your students",
      icon: Users,
      href: "/dashboard/students",
      color: "bg-green-500",
      stats: `${stats.studentsCount} ${stats.studentsCount === 1 ? 'Student' : 'Students'}`,
    },
  ];

  return (
    <main className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Hero Section */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-2">
          {greeting}, {user.firstName}! 👋
        </h1>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.studentsCount}</div>
            <p className="text-xs text-muted-foreground">Across all classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Question Papers</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedPapers}</div>
            <p className="text-xs text-muted-foreground">
              Successfully completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Syllabi</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.syllabiCount}</div>
            <p className="text-xs text-muted-foreground">For current semester</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Cards */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {navigationCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.href} href={card.href}>
                <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className={`${card.color} p-3 rounded-lg`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl">{card.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{card.stats}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">{card.description}</CardDescription>
                    <Button variant="ghost" className="w-full group">
                      Manage {card.title}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>


    </main>
  );
}
