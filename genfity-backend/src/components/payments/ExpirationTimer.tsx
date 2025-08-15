'use client';

import { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ExpirationTimerProps {
  expiresAt: Date | string | null;
  status: string;
  type?: 'payment' | 'transaction';
  variant?: 'compact' | 'full';
}

export function ExpirationTimer({ 
  expiresAt, 
  status, 
  type = 'payment',
  variant = 'compact' 
}: ExpirationTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    if (!expiresAt || status !== 'pending') {
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const expiry = new Date(expiresAt);
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (type === 'payment') {
        // Payment: warn when less than 2 hours remaining
        setIsWarning(hours < 2);
        if (hours > 0) {
          setTimeRemaining(`${hours}h ${minutes}m`);
        } else if (minutes > 0) {
          setTimeRemaining(`${minutes}m ${seconds}s`);
        } else {
          setTimeRemaining(`${seconds}s`);
        }
      } else {
        // Transaction: show in days/hours, warn when less than 1 day
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        setIsWarning(days < 1);
        
        if (days > 0) {
          setTimeRemaining(`${days}d ${hours % 24}h`);
        } else if (hours > 0) {
          setTimeRemaining(`${hours}h ${minutes}m`);
        } else {
          setTimeRemaining(`${minutes}m`);
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, status, type]);

  if (!expiresAt || status !== 'pending') {
    return null;
  }

  if (variant === 'compact') {
    return (
      <Badge 
        variant={isExpired ? 'destructive' : isWarning ? 'secondary' : 'outline'}
        className="gap-1"
      >
        {isExpired ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
        {timeRemaining}
      </Badge>
    );
  }

  return (
    <div className={`flex items-center gap-2 p-2 rounded-md ${
      isExpired 
        ? 'bg-red-50 text-red-700 border border-red-200'
        : isWarning 
          ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
          : 'bg-blue-50 text-blue-700 border border-blue-200'
    }`}>
      {isExpired ? (
        <AlertTriangle className="h-4 w-4" />
      ) : (
        <Clock className="h-4 w-4" />
      )}
      <div className="flex-1">
        <div className="font-medium">
          {isExpired 
            ? `${type === 'payment' ? 'Payment' : 'Transaction'} Expired`
            : `${timeRemaining} remaining`
          }
        </div>
        {!isExpired && (
          <div className="text-xs opacity-75">
            {type === 'payment' 
              ? 'Payment expires after 24 hours'
              : 'Transaction expires after 7 days'
            }
          </div>
        )}
      </div>
    </div>
  );
}

interface ExpirationInfoProps {
  paymentExpiresAt?: Date | string | null;
  transactionExpiresAt?: Date | string | null;
  paymentStatus?: string;
  transactionStatus?: string;
}

export function ExpirationInfo({ 
  paymentExpiresAt, 
  transactionExpiresAt, 
  paymentStatus = 'pending',
  transactionStatus = 'pending'
}: ExpirationInfoProps) {
  return (
    <div className="space-y-2">
      {paymentExpiresAt && paymentStatus === 'pending' && (
        <ExpirationTimer 
          expiresAt={paymentExpiresAt} 
          status={paymentStatus}
          type="payment"
          variant="full"
        />
      )}      {transactionExpiresAt && ['created', 'pending'].includes(transactionStatus) && (
        <ExpirationTimer 
          expiresAt={transactionExpiresAt} 
          status={transactionStatus}
          type="transaction"
          variant="full"
        />
      )}
    </div>
  );
}
