import { StepProps } from "@/types/checkout"
import { Check } from "lucide-react"

export function Step({ title, isActive, isCompleted, number }: StepProps) {
  return (
    <div className="flex items-center">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium
        ${
          isCompleted
            ? "bg-primary text-white"
            : isActive
              ? "border-2 border-primary bg-primary/10 text-primary dark:border-white dark:text-white"
              : "border-2 border-gray-200 text-gray-400 dark:border-gray-700"
        }`}
      >
        {isCompleted ? <Check className="h-4 w-4" /> : number}
      </div>
      <span
        className={`ml-2 text-sm font-medium 
        ${isActive || isCompleted ? "text-primary dark:text-white" : "text-gray-400 dark:text-gray-600"}`}
      >
        {title}
      </span>
    </div>
  )
}
