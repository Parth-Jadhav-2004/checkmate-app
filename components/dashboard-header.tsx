"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { Bell } from "lucide-react";

interface DashboardHeaderProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-7 h-7 text-primary-foreground"
              >
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-bold text-xl leading-tight">CheckMate</span>
              <span className="text-xs text-muted-foreground">AI Answer Evaluation</span>
            </div>
          </div>
        </Link>

        {/* Right side - Notifications and User Menu */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-600 rounded-full"></span>
          </Button>

          {/* Clerk User Button with Profile & Logout */}
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "h-10 w-10"
              }
            }}
            afterSignOutUrl="/"
          />
        </div>
      </div>
    </header>
  );
}
