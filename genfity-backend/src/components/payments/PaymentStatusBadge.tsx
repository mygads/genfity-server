'use client';

import { Badge } from '@/components/ui/badge';
import { ExpirationTimer } from './ExpirationTimer';
import { CheckCircle, Clock, XCircle, AlertCircle, Minus } from 'lucide-react';

interface PaymentStatusBadgeProps {
  status: string;
  expiresAt?: Date | string | null;
  showTimer?: boolean;
}

export function PaymentStatusBadge({ 
  status, 
  expiresAt, 
  showTimer = false 
}: PaymentStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
        return {
          variant: 'default' as const,
          icon: CheckCircle,
          label: 'Paid',
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'pending':
        return {
          variant: 'secondary' as const,
          icon: Clock,
          label: 'Pending',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
      case 'failed':
        return {
          variant: 'destructive' as const,
          icon: XCircle,
          label: 'Failed',
          className: 'bg-red-100 text-red-800 border-red-200'
        };
      case 'expired':
        return {
          variant: 'destructive' as const,
          icon: AlertCircle,
          label: 'Expired',
          className: 'bg-red-100 text-red-800 border-red-200'
        };
      case 'cancelled':
        return {
          variant: 'outline' as const,
          icon: Minus,
          label: 'Cancelled',
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        };
      default:
        return {
          variant: 'outline' as const,
          icon: Clock,
          label: status,
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <Badge variant={config.variant} className={`gap-1 ${config.className}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
      {showTimer && status === 'pending' && expiresAt && (
        <ExpirationTimer 
          expiresAt={expiresAt} 
          status={status}
          type="payment"
          variant="compact"
        />
      )}
    </div>
  );
}

interface TransactionStatusBadgeProps {
  status: string;
  expiresAt?: Date | string | null;
  showTimer?: boolean;
}

export function TransactionStatusBadge({ 
  status, 
  expiresAt, 
  showTimer = false 
}: TransactionStatusBadgeProps) {  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'created':
        return {
          variant: 'outline' as const,
          icon: Clock,
          label: 'Created',
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        };
      case 'pending':
        return {
          variant: 'secondary' as const,
          icon: Clock,
          label: 'Payment Pending',
          className: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'in-progress':
        return {
          variant: 'default' as const,
          icon: Clock,
          label: 'In Progress',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
      case 'success':
        return {
          variant: 'default' as const,
          icon: CheckCircle,
          label: 'Completed',
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'cancelled':
        return {
          variant: 'outline' as const,
          icon: Minus,
          label: 'Cancelled',
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        };
      case 'expired':
        return {
          variant: 'destructive' as const,
          icon: AlertCircle,
          label: 'Expired',
          className: 'bg-red-100 text-red-800 border-red-200'
        };
      // Legacy statuses for backward compatibility
      case 'paid':
        return {
          variant: 'default' as const,
          icon: CheckCircle,
          label: 'Completed',
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'failed':
        return {
          variant: 'destructive' as const,
          icon: XCircle,
          label: 'Failed',
          className: 'bg-red-100 text-red-800 border-red-200'
        };
      default:
        return {
          variant: 'outline' as const,
          icon: Clock,
          label: status,
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <Badge variant={config.variant} className={`gap-1 ${config.className}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
      {showTimer && status === 'pending' && expiresAt && (
        <ExpirationTimer 
          expiresAt={expiresAt} 
          status={status}
          type="transaction"
          variant="compact"
        />
      )}
    </div>
  );
}
