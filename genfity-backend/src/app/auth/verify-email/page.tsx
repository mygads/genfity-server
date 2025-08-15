'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { CheckCircle, XCircle, Mail, Clock, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        const emailParam = searchParams.get('email');
        if (emailParam) {
            setEmail(decodeURIComponent(emailParam));
        }
    }, [searchParams]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (countdown > 0) {
            interval = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [countdown]);

    const sendEmailOtp = async () => {
        if (!email) {
            setError('Please enter your email address');
            return;
        }

        setSending(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch('/api/auth/send-email-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (data.success) {
                setMessage('Verification code sent to your email. Please check your inbox.');
                setCountdown(60);
            } else {
                setError(data.message || 'Failed to send verification code');
            }
        } catch (error) {
            setError('Failed to send verification code. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const verifyEmailOtp = async () => {
        if (!email || !otp) {
            setError('Please enter both email and verification code');
            return;
        }

        if (otp.length !== 4) {
            setError('Verification code must be 4 digits');
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    identifier: email,
                    otp,
                    purpose: 'email-verification'
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                setMessage('Email verified successfully! You can now access all features.');
                setTimeout(() => {
                    const returnUrl = searchParams.get('returnUrl') || '/dashboard';
                    router.push(returnUrl);
                }, 2000);
            } else {
                setError(data.message || 'Invalid verification code');
            }
        } catch (error) {
            setError('Failed to verify email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (!otp) {
                sendEmailOtp();
            } else {
                verifyEmailOtp();
            }
        }
    };

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
                        width={96}
                        height={96}
                        className="object-cover w-full h-full"
                    />
                    <span className="text-lg font-semibold text-black dark:text-white tracking-wide">Email Verification</span>
                </div>
                {/* Success State */}
                {success ? (
                    <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-500">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2563eb]/30 to-[#22c55e]/30 flex items-center justify-center mb-2 shadow-lg animate-bounce">
                            <CheckCircle className="w-8 h-8 text-[#22c55e]" />
                        </div>
                        <p className="text-lg font-semibold text-[#22c55e] dark:text-[#4ade80]">{message}</p>
                        <p className="text-gray-700 dark:text-gray-300">Redirecting you to dashboard...</p>
                    </div>
                ) : (
                    <CardContent className="space-y-4 w-full">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-white">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Enter your email address"
                                disabled={loading || sending}
                                className="bg-[#1e293b] text-white border-white/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="otp" className="text-white">Verification Code</Label>
                            <Input
                                id="otp"
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                onKeyPress={handleKeyPress}
                                placeholder="Enter 4-digit code"
                                maxLength={4}
                                disabled={loading || sending}
                                className="text-center text-2xl tracking-widest bg-[#1e293b] text-white border-white/20"
                            />
                        </div>
                        {error && (
                            <Alert variant="destructive" className="bg-[#fee2e2]/80 border-[#ef4444]/40 text-[#ef4444]">
                                <XCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        {message && (
                            <Alert className="bg-[#bbf7d0]/80 border-[#22c55e]/40 text-[#166534]">
                                <CheckCircle className="h-4 w-4" />
                                <AlertDescription>{message}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-3">
                            {!otp ? (
                                <Button
                                    onClick={sendEmailOtp}
                                    disabled={sending || !email || countdown > 0}
                                    className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white"
                                >
                                    {sending ? 'Sending...' : countdown > 0 ? `Wait ${countdown}s` : 'Send Verification Code'}
                                </Button>
                            ) : (
                                <Button
                                    onClick={verifyEmailOtp}
                                    disabled={loading || !otp || otp.length !== 4}
                                    className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white"
                                >
                                    {loading ? 'Verifying...' : 'Verify Email'}
                                </Button>
                            )}
                            {otp && (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setOtp('');
                                        sendEmailOtp();
                                    }}
                                    disabled={sending || countdown > 0}
                                    className="w-full border-[#2563eb] text-[#2563eb] hover:bg-[#2563eb]/10"
                                >
                                    {countdown > 0 ? (
                                        <>
                                            <Clock className="h-4 w-4 mr-2" />
                                            Resend in {countdown}s
                                        </>
                                    ) : (
                                        'Resend Code'
                                    )}
                                </Button>
                            )}
                        </div>
                        <div className="text-center">
                            <Alert className="border-yellow-200 bg-yellow-50/80">
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                <AlertDescription className="text-yellow-800">
                                    <strong>Important:</strong> The verification code expires in 1 hour. 
                                    Please verify your email within this time frame.
                                </AlertDescription>
                            </Alert>
                        </div>
                    </CardContent>
                )}
                <CardFooter className="justify-center w-full mt-4">
                    <p className="text-sm text-gray-300">
                        Need help?{' '}
                        <Button variant="link" className="p-0 h-auto text-sm text-[#2563eb]" onClick={() => router.push('/support')}>
                            Contact Support
                        </Button>
                    </p>
                </CardFooter>
            </div>
            {/* Footer */}
            <footer className="mt-8 text-xs text-white dark:text-white z-10">
                &copy; {new Date().getFullYear()} Genfity. All rights reserved.
            </footer>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyEmailContent />
        </Suspense>
    );
}
