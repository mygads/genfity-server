'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ShineBorder } from '@/components/ui/shine-border';

interface VerificationResult {
  success: boolean;
  message: string;
  error?: string;
  data?: {
    user?: {
      id: string;
      name: string;
      email: string;
    };
  };
}

type VerificationStatus = 'loading' | 'success' | 'error';

export default function VerifyEmailPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [result, setResult] = useState<VerificationResult | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setResult({
        success: false,
        message: 'Token verifikasi tidak ditemukan dalam URL.',
        error: 'MISSING_TOKEN'
      });
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email/${token}`);
        const data: VerificationResult = await response.json();
        setResult(data);

        if (!response.ok) {
          setStatus('error');
        } else {
          setStatus('success');
          // Redirect to signin page after successful verification
          // setTimeout(() => {
          //   router.push('/auth/signin?verified=true');
          // }, 3000); // Redirect after 3 seconds
        }
      } catch (err) {
        console.error('Verification API error:', err);
        setStatus('error');
        setResult({
          success: false,
          message: 'Terjadi kesalahan saat menghubungi server untuk verifikasi.',
          error: 'NETWORK_ERROR'
        });
      }
    };

    verifyToken();
  }, [token, router]);

  return (
    <section className="relative z-10 overflow-hidden pb-16 pt-36 md:pb-20 lg:pb-28 lg:pt-[180px]">
      <div className="container">
        <div className="flex flex-wrap">
          <div className="w-full px-4">
            <div className="mx-auto max-w-[500px] relative rounded-xl bg-white px-6 py-10 shadow-2xl dark:bg-gray-900 sm:p-[60px]">
              <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />
              
              {/* Logo & Title */}
              <div className="flex flex-col items-center mb-8 gap-4">
                <h3 className="text-center text-2xl font-bold text-black dark:text-white sm:text-3xl">
                  Email Verification
                </h3>
              </div>

              {/* Status Content */}
              {status === 'loading' && (
                <div className="flex flex-col items-center gap-6 mb-8">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-center text-base font-medium text-gray-600 dark:text-gray-400">
                    Memverifikasi email Anda...
                  </p>
                </div>
              )}

              {status === 'success' && (
                <div className="flex flex-col items-center gap-6 mb-8">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">
                      {result?.message || 'Email berhasil diverifikasi!'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      Your email has been successfully verified. You can now access your account.
                    </p>
                  </div>
                </div>
              )}

              {status === 'error' && (
                <div className="flex flex-col items-center gap-6 mb-8">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                      Verification Failed
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      {result?.message || 'Terjadi kesalahan saat verifikasi email.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-4">
                {status === 'success' && (
                  <Link
                    href="/signin?verified=true"
                    className="flex w-full items-center justify-center rounded-md bg-primary px-9 py-3 text-base font-medium text-white shadow-submit duration-300 hover:bg-primary/90 dark:shadow-submit-dark"
                  >
                    Continue to Sign In
                  </Link>
                )}

                {status === 'error' && (
                  <div className="space-y-3">
                    <Link
                      href="/signin"
                      className="flex w-full items-center justify-center rounded-md bg-primary px-9 py-3 text-base font-medium text-white shadow-submit duration-300 hover:bg-primary/90 dark:shadow-submit-dark"
                    >
                      Try Sign In
                    </Link>
                    <Link
                      href="/signup"
                      className="flex w-full items-center justify-center rounded-md border border-stroke bg-[#f8f8f8] px-9 py-3 text-base font-medium text-foreground duration-300 hover:border-primary hover:bg-primary/5 dark:border-transparent dark:bg-[#2C303B] dark:text-white dark:shadow-two dark:hover:border-primary"
                    >
                      Sign Up Again
                    </Link>
                  </div>
                )}
              </div>

              {/* Footer Text */}
              <p className="mt-8 text-center text-base font-medium text-foreground">
                Need help?{" "}
                <Link href="/contact" className="text-primary dark:text-blue-500 hover:underline">
                  Contact Support
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Background SVG */}
      <div className="absolute left-0 top-0 z-[-1]">
        <svg width="1440" height="969" viewBox="0 0 1440 969" fill="none" xmlns="http://www.w3.org/2000/svg">
          <mask
            id="mask0_95:1005"
            style={{ maskType: "alpha" }}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="1440"
            height="969"
          >
            <rect width="1440" height="969" fill="#090E34" />
          </mask>
          <g mask="url(#mask0_95:1005)">
            <path
              opacity="0.1"
              d="M1086.96 297.978L632.959 554.978L935.625 535.926L1086.96 297.978Z"
              fill="url(#paint0_linear_95:1005)"
            />
            <path
              opacity="0.1"
              d="M1324.5 755.5L1450 687V886.5L1324.5 967.5L-10 288L1324.5 755.5Z"
              fill="url(#paint1_linear_95:1005)"
            />
          </g>
          <defs>
            <linearGradient
              id="paint0_linear_95:1005"
              x1="1178.4"
              y1="151.853"
              x2="780.959"
              y2="453.581"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#4A6CF7" />
              <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
            </linearGradient>
            <linearGradient
              id="paint1_linear_95:1005"
              x1="160.5"
              y1="220"
              x2="1099.45"
              y2="1192.04"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#4A6CF7" />
              <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </section>
  );
}
