"use client"

import { ChevronRight, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BreadcrumbItem {
  label: string
  onClick?: () => void
  isActive?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={items[0]?.onClick}
        className="p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
      >
        <Home className="w-4 h-4 mr-1" />
        Home
      </Button>

      {items.slice(1).map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="w-4 h-4" />
          {item.onClick ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={item.onClick}
              className={`p-0 h-auto font-normal ${
                item.isActive ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </Button>
          ) : (
            <span className={item.isActive ? "text-foreground font-medium" : ""}>{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}
