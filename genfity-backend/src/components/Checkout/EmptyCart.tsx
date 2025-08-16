import { ArrowLeft, Trash2 } from "lucide-react"
import Link from "next/link"

export function EmptyCart() {
  return (
    <div className="container mx-auto py-16 mt-36 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-6">
          <div className="relative inline-block h-32 w-32 opacity-20">
            <Trash2 className="h-full w-full" strokeWidth={1} />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-4">There is nothing in your cart</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">You haven't selected any products in the cart</p>
        <Link href="/products">
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-white transition-all hover:bg-primary/90">
            <ArrowLeft className="h-4 w-4" />
            View Products
          </button>
        </Link>
      </div>
    </div>
  )
}
