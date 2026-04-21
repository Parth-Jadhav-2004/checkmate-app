"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search } from "lucide-react";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  rollNumber: string;
  semester: string;
  enrollmentDate: string;
}

interface StudentsTableProps {
  students: Student[];
}

export function StudentsTable({ students }: StudentsTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStudents = students.filter((student) =>
    `${student.firstName} ${student.lastName} ${student.email} ${student.rollNumber}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleRowClick = (studentId: string) => {
    router.push(`/dashboard/students/${studentId}`);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students by name, email, or roll number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-visible">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Student</TableHead>
              <TableHead>Roll Number</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Enrolled</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No students found matching your search" : "No students added yet"}
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student) => (
                <TableRow 
                  key={student.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleRowClick(student.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`/placeholder-user.jpg`} alt={student.firstName} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(student.firstName, student.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Student ID: {student.id}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{student.rollNumber}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {student.email}
                  </TableCell>
                  <TableCell>
                    <Badge>{student.semester}th Semester</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(student.enrollmentDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Showing <strong>{filteredStudents.length}</strong> of <strong>{students.length}</strong> students
        </div>
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery("")}
          >
            Clear search
          </Button>
        )}
      </div>
    </div>
  );
}
