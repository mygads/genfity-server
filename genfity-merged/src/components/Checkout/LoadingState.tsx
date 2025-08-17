import { RefreshCw } from "lucide-react"

export function LoadingState() {
  return (
    <div className="container mx-auto py-16 px-4 flex justify-center items-center min-h-[60vh]">
      <div className="flex flex-col items-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  )
}
