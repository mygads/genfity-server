import type { ReactNode } from 'react';

export default function AdminSignInLayout({
  children,
}: {
  children: ReactNode;
}) {
  // This layout completely overrides the admin layout for signin page
  // Renders children in full screen without sidebar or admin layout wrapper
  // Header and Footer will be handled by ConditionalLayoutWrapper
  return (
    <>
      {children}
    </>
  );
}
