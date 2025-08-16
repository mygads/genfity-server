import { Inter } from "next/font/google";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export default async function AdminLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  
  // TODO: Add admin authentication check here
  // const session = await getServerSession();
  // if (!session || session.user?.role !== 'admin') {
  //   redirect(`/${locale}/admin/auth/signin`);
  // }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex h-screen">
        {/* Admin Sidebar - will be implemented later */}
        <aside className="w-64 bg-white dark:bg-gray-800 shadow-md">
          <div className="p-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              Admin Panel
            </h2>
          </div>
          <nav className="mt-8">
            {/* Admin navigation will be added here */}
          </nav>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
