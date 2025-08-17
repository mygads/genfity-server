'use client';

import React from 'react';

interface AuthProviderProps {
  children: React.ReactNode;
}

// Backend AuthProvider for JWT (admin)
export default function AuthProvider({ children }: AuthProviderProps) {
  return <>{children}</>;
}
