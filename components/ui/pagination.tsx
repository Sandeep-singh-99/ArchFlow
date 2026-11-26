import type { ComponentProps } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function Pagination({ className, ...props }: ComponentProps<"nav">) {
  return (
    <nav
      aria-label="Pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({ className, ...props }: ComponentProps<"ul">) {
  return <ul data-slot="pagination-content" className={cn("flex items-center gap-1", className)} {...props} />
}

function PaginationItem(props: ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationButtonProps = Omit<ComponentProps<typeof Button>, "asChild" | "variant"> & {
  isActive?: boolean
}

function PaginationButton({ isActive, className, size = "icon", ...props }: PaginationButtonProps) {
  return (
    <Button
      type="button"
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-button"
      variant={isActive ? "outline" : "ghost"}
      size={size}
      className={cn("cursor-pointer", className)}
      {...props}
    />
  )
}

function PaginationPrevious({ className, ...props }: PaginationButtonProps) {
  return (
    <PaginationButton aria-label="Go to previous page" size="default" className={cn("gap-1 px-2.5", className)} {...props}>
      <ChevronLeftIcon aria-hidden />
      <span className="hidden sm:inline">Previous</span>
    </PaginationButton>
  )
}

function PaginationNext({ className, ...props }: PaginationButtonProps) {
  return (
    <PaginationButton aria-label="Go to next page" size="default" className={cn("gap-1 px-2.5", className)} {...props}>
      <span className="hidden sm:inline">Next</span>
      <ChevronRightIcon aria-hidden />
    </PaginationButton>
  )
}

export { Pagination, PaginationButton, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious }
