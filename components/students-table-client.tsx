"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StudentsTable } from "@/components/students-table";
import { AddStudentDialog } from "@/components/add-student-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  rollNumber: string;
  semester: string;
  enrollmentDate: string;
}

interface StudentsTableClientProps {
  initialStudents: Student[];
}

export function StudentsTableClient({ initialStudents }: StudentsTableClientProps) {
  const router = useRouter();
  const [students, setStudents] = useState(initialStudents);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddStudent = async (newStudent: {
    firstName: string;
    lastName: string;
    email: string;
    rollNumber: string;
    semester: string;
  }) => {
    setIsAdding(true);
    
    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newStudent),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add student");
      }

      // Add the new student to the local state
      setStudents([data.student, ...students]);
      
      // Refresh the page to get updated data from server
      router.refresh();
      
      return { success: true };
    } catch (error) {
      console.error("Error adding student:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to add student" 
      };
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Students Management</h1>
          <p className="text-muted-foreground">
            Manage your students and track their progress
          </p>
        </div>
        <AddStudentDialog onAddStudent={handleAddStudent} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{students.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Semester
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6th</div>
          </CardContent>
        </Card>
      </div>

      {/* Students Table */}
      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle>All Students</CardTitle>
          <CardDescription>
            A list of all students in your class including their details
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-visible">
          <StudentsTable students={students} />
        </CardContent>
      </Card>
    </>
  );
}
