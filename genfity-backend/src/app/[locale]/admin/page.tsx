import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";

export default async function AdminPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  
  // const t = await getTranslations('Admin');

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Welcome to the admin panel. This is where admin users can manage the system.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            User Management
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Manage users and their permissions
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Content Management
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Manage website content and pages
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            System Settings
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Configure system-wide settings
          </p>
        </div>
      </div>
    </div>
  );
}
