'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#2563eb] to-[#ef4444] px-4 py-8 relative overflow-hidden">
      {/* Decorative Gradients */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 -left-32 w-[400px] h-[400px] bg-gradient-to-br from-[#2563eb]/60 via-white/10 to-[#ef4444]/60 rounded-full blur-3xl opacity-70 animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-gradient-to-tr from-[#ef4444]/60 via-white/10 to-[#2563eb]/60 rounded-full blur-2xl opacity-60 animate-[pulse_10s_ease-in-out_infinite]" />
      </div>
      {/* Card */}
      <div className="relative z-10 w-full max-w-md bg-[#101828]/95 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 flex flex-col items-center border border-white/30 dark:border-black/30 animate-in fade-in zoom-in-75 duration-700">
        {/* Logo & Title */}
        <div className="flex flex-col items-center mb-8 gap-4">
          
            <Image 
              src="/logo-dark.svg" 
              alt="Genfity Logo" 
              width={96} // Slightly smaller than container to ensure cover effect
              height={96} 
              className="object-cover w-full h-full" 
            />
          <span className="text-lg font-semibold text-black dark:text-white tracking-wide">Email Verification</span>
        </div>
        {/* Status Content */}
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="w-12 h-12 border-4 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
            <p className="text-lg text-[#2563eb] dark:text-[#60a5fa] animate-pulse">{result?.message === 'Memverifikasi email Anda...' ? 'Verifying your email...' : result?.message || 'Memverifikasi email Anda...'}</p>
          </div>
        )}
        {status === 'success' && (
          <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2563eb]/30 to-[#ef4444]/30 flex items-center justify-center mb-2 shadow-lg animate-bounce">
              <Image src="/email-cancelled.png" alt="Email verification success" width={32} height={32} className="w-8 h-8" />
            </div>
            <p className="text-lg font-semibold text-[#22c55e] dark:text-[#4ade80]">{result?.message === 'Email berhasil diverifikasi!' ? 'Your email has been successfully verified!' : result?.message || 'Email berhasil diverifikasi!'}</p>
            {/* <p className="text-gray-700 dark:text-gray-300">You will be redirected to the login page automatically.</p> */}
            <p className="text-gray-700 dark:text-gray-300">
              {/* If you are not redirected,&nbsp; */}
              <a
                href="https://www.genfity.com/auth/signin"
                className="text-[#2563eb] hover:underline font-semibold transition-colors duration-200"
              >
                click here to login
              </a>.
            </p>
          </div>
        )}
        {status === 'error' && (
          <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-500 justify-center text-center">
            <Image src="/email-cancelled.png" alt="Email verification error" width={160} height={160} className="w-40 h-40 flex items-center justify-center mb-2 shadow-lg animate-bounce" />
            <p className="text-lg font-semibold text-[#ff0000] dark:text-[#ff0000]">
              {result?.message || 'Terjadi kesalahan.'}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              Please try again or&nbsp;
              <a
                href="https://www.genfity.com/signup"
                className="text-blue-400 hover:underline font-semibold transition-colors duration-200"
              >
                sign up again
              </a>
              &nbsp;if the problem persists.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              You can also&nbsp;
              <a
                href="https://www.genfity.com/signin"
                className="text-blue-400 hover:underline font-semibold transition-colors duration-200"
              >
                try logging in
              </a>
              &nbsp;if you believe your email is already verified.
            </p>
          </div>
        )}
      </div>
      {/* Footer */}
      <footer className="mt-8 text-xs text-white dark:text-white z-10">
        &copy; {new Date().getFullYear()} Genfity. All rights reserved.
      </footer>
    </div>
  );
}
