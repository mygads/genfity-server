'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MessageSquare, 
  Activity,
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  RefreshCw,
  Plus,
  XCircle,
  QrCode,
  CheckCircle,
  Zap,
  Settings,
  Phone,
  Smartphone,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { SessionManager } from '@/lib/storage';

// Available webhook events
const WEBHOOK_EVENTS = [
  "Receipt",
  "GroupInfo", 
  "JoinedGroup",
  "Picture",
  "BlocklistChange",
  "Blocklist",
  "Connected",
  "Disconnected",
  "ConnectFailure",
  "KeepAliveRestored",
  "KeepAliveTimeout",
  "LoggedOut",
  "ClientOutdated",
  "TemporaryBan",
  "StreamError",
  "StreamReplaced",
  "PairSuccess",
  "PairError",
  "QR",
  "QRScannedWithoutMultidevice",
  "PrivacySettings",
  "PushNameSetting",
  "UserAbout",
  "AppState",
  "AppStateSyncComplete",
  "HistorySync",
  "OfflineSyncCompleted",
  "OfflineSyncPreview",
  "IdentityChange",
  "CATRefreshError",
  "NewsletterJoin",
  "NewsletterLeave",
  "NewsletterMuteChange",
  "NewsletterLiveUpdate",
  "FBMessage"
];

// Types based on database WhatsAppSession model + computed fields
interface WhatsAppSession {
  id: string;
  name: string;
  token: string;
  webhook: string | null;
  events: string | null;
  expiration: number;
  connected: boolean;
  loggedIn: boolean;
  jid: string | null;
  qrcode: string | null;
  proxy_config: {
    enabled: boolean;
    proxy_url: string | null;
  };
  s3_config: {
    enabled: boolean;
    endpoint: string | null;
    region: string | null;
    bucket: string | null;
    access_key: string | null;
    path_style: boolean;
    public_url: string | null;
    media_delivery: string | null;
    retention_days: number;
  };
  // Database computed fields
  isSystemSession: boolean;
  label: string;
  statusDisplay: string;
  userName: string;
  userRole: string;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SessionStats {
  totalSessions: number;
  connectedSessions: number;
  disconnectedSessions: number;
  qrRequiredSessions: number;
}

interface TransferUser {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  _count: {
    whatsAppSessions: number;
  };
}

interface CreateSessionForm {
  name: string;
  token: string;
  webhook: string;
  events: string;
  proxyConfig: {
    enabled: boolean;
    proxyURL: string;
  };
  s3Config: {
    enabled: boolean;
    endpoint: string;
    region: string;
    bucket: string;
    accessKey: string;
    secretKey: string;
    pathStyle: boolean;
    publicURL: string;
    mediaDelivery: string;
    retentionDays: number;
  };
}

export default function WhatsAppSessionsPage() {
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [stats, setStats] = useState<SessionStats>({
    totalSessions: 0,
    connectedSessions: 0,
    disconnectedSessions: 0,
    qrRequiredSessions: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [showPairPhoneDialog, setShowPairPhoneDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<WhatsAppSession | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<WhatsAppSession | null>(null);
  const [sessionToTransfer, setSessionToTransfer] = useState<WhatsAppSession | null>(null);
  const [sessionToControl, setSessionToControl] = useState<WhatsAppSession | null>(null);
  
  // Form states
  const [createForm, setCreateForm] = useState<CreateSessionForm>({
    name: '',
    token: '',
    webhook: '',
    events: 'All',
    proxyConfig: {
      enabled: false,
      proxyURL: ''
    },
    s3Config: {
      enabled: false,
      endpoint: '',
      region: '',
      bucket: '',
      accessKey: '',
      secretKey: '',
      pathStyle: false,
      publicURL: '',
      mediaDelivery: 'base64',
      retentionDays: 30
    }
  });
  
  // Events selection state
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isAllEvents, setIsAllEvents] = useState(true);
  
  // Transfer states
  const [transferUsers, setTransferUsers] = useState<TransferUser[]>([]);
  const [selectedTransferUserId, setSelectedTransferUserId] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  // Session control states
  const [connectForm, setConnectForm] = useState({
    Subscribe: [] as string[],
    Immediate: true
  });
  const [pairPhoneForm, setPairPhoneForm] = useState({
    Phone: ''
  });
  const [sessionStatus, setSessionStatus] = useState<any>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [linkingCode, setLinkingCode] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isGettingStatus, setIsGettingStatus] = useState(false);
  const [isGettingQR, setIsGettingQR] = useState(false);
  const [isPairingPhone, setIsPairingPhone] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [statusPolling, setStatusPolling] = useState<NodeJS.Timeout | null>(null);
  const [qrPolling, setQrPolling] = useState<NodeJS.Timeout | null>(null);
  
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  // Helper functions for events management
  const handleEventToggle = (event: string, checked: boolean) => {
    if (checked) {
      const newSelected = [...selectedEvents, event];
      setSelectedEvents(newSelected);
      
      // Check if all events are selected
      if (newSelected.length === WEBHOOK_EVENTS.length) {
        setIsAllEvents(true);
        setCreateForm(prev => ({ ...prev, events: 'All' }));
      } else {
        setIsAllEvents(false);
        setCreateForm(prev => ({ ...prev, events: newSelected.join(',') }));
      }
    } else {
      const newSelected = selectedEvents.filter(e => e !== event);
      setSelectedEvents(newSelected);
      setIsAllEvents(false);
      
      if (newSelected.length === 0) {
        setCreateForm(prev => ({ ...prev, events: 'All' }));
        setIsAllEvents(true);
      } else {
        setCreateForm(prev => ({ ...prev, events: newSelected.join(',') }));
      }
    }
  };

  const handleAllEventsToggle = (checked: boolean) => {
    if (checked) {
      setIsAllEvents(true);
      setSelectedEvents([]);
      setCreateForm(prev => ({ ...prev, events: 'All' }));
    } else {
      setIsAllEvents(false);
      setSelectedEvents([]);
      setCreateForm(prev => ({ ...prev, events: '' }));
    }
  };

  // Reset form when dialog closes
  const handleCloseCreateDialog = () => {
    setShowCreateDialog(false);
    setCreateForm({
      name: '',
      token: '',
      webhook: '',
      events: 'All',
      proxyConfig: {
        enabled: false,
        proxyURL: ''
      },
      s3Config: {
        enabled: false,
        endpoint: '',
        region: '',
        bucket: '',
        accessKey: '',
        secretKey: '',
        pathStyle: false,
        publicURL: '',
        mediaDelivery: 'base64',
        retentionDays: 30
      }
    });
    setSelectedEvents([]);
    setIsAllEvents(true);
  };

  // Fetch sessions data
  const fetchSessions = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const token = SessionManager.getToken();
      if (!token) {
        router.push('/signin');
        return;
      }

      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/admin/whatsapp/sessions?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        SessionManager.clearSession();
        router.push('/signin');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const data = await response.json();
      if (data.success) {
        setSessions(data.data.sessions);
        
        // Calculate stats from the sessions
        const totalSessions = data.data.sessions.length;
        const connectedSessions = data.data.sessions.filter((s: WhatsAppSession) => 
          s.connected && s.loggedIn
        ).length;
        const disconnectedSessions = data.data.sessions.filter((s: WhatsAppSession) => 
          !s.connected
        ).length;
        const qrRequiredSessions = data.data.sessions.filter((s: WhatsAppSession) => 
          !s.loggedIn && !s.connected
        ).length;

        setStats({
          totalSessions,
          connectedSessions,
          disconnectedSessions,
          qrRequiredSessions
        });
      } else {
        throw new Error(data.error || 'Failed to fetch sessions');
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch WhatsApp sessions',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, router, toast]);

  // Create new session
  const handleCreateSession = async () => {
    try {
      setIsCreating(true);
      const token = SessionManager.getToken();
      if (!token) {
        SessionManager.clearSession();
        router.push('/signin');
        return;
      }

      const response = await fetch('/api/admin/whatsapp/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createForm)
      });

      if (response.status === 401) {
        SessionManager.clearSession();
        router.push('/signin');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create session');
      }

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'WhatsApp session created successfully',
        });
        setShowCreateDialog(false);
        // Reset form and events state
        setCreateForm({
          name: '',
          token: '',
          webhook: '',
          events: 'All',
          proxyConfig: {
            enabled: false,
            proxyURL: ''
          },
          s3Config: {
            enabled: false,
            endpoint: '',
            region: '',
            bucket: '',
            accessKey: '',
            secretKey: '',
            pathStyle: false,
            publicURL: '',
            mediaDelivery: 'base64',
            retentionDays: 30
          }
        });
        setSelectedEvents([]);
        setIsAllEvents(true);
        fetchSessions();
      } else {
        throw new Error(data.error || 'Failed to create session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create WhatsApp session',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Delete session
  const handleDeleteClick = (session: WhatsAppSession) => {
    setSessionToDelete(session);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!sessionToDelete) return;
    
    try {
      setIsDeleting(true);
      const token = SessionManager.getToken();
      if (!token) {
        SessionManager.clearSession();
        router.push('/signin');
        return;
      }

      const response = await fetch(`/api/admin/whatsapp/sessions/${sessionToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        SessionManager.clearSession();
        router.push('/signin');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to delete session');
      }

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'WhatsApp session deleted successfully',
        });
        fetchSessions();
        setShowDeleteDialog(false);
        setSessionToDelete(null);
      } else {
        throw new Error(data.error || 'Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete WhatsApp session',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // View session details
  const handleViewDetails = (session: WhatsAppSession) => {
    setSelectedSession(session);
    setShowDetailsDialog(true);
  };

  // Fetch available users for transfer
  const fetchTransferUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const token = SessionManager.getToken();
      if (!token) {
        SessionManager.clearSession();
        router.push('/signin');
        return;
      }

      const response = await fetch('/api/admin/whatsapp/sessions/transfer-users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        SessionManager.clearSession();
        router.push('/signin');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTransferUsers(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching transfer users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users list',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Handle transfer session
  const handleTransferSession = (session: WhatsAppSession) => {
    if (session.isSystemSession) {
      toast({
        title: 'Cannot Transfer',
        description: 'System sessions cannot be transferred to users',
        variant: 'destructive',
      });
      return;
    }
    
    setSessionToTransfer(session);
    
    // Set default selection based on current ownership
    if (session.userId) {
      // Session is currently assigned to a user
      setSelectedTransferUserId(session.userId);
    } else {
      // Session is currently admin-owned (unassigned)
      setSelectedTransferUserId('unassign');
    }
    
    setShowTransferDialog(true);
    fetchTransferUsers();
  };

  // Execute session transfer
  const handleConfirmTransfer = async () => {
    if (!sessionToTransfer) return;

    setIsTransferring(true);
    try {
      const token = SessionManager.getToken();
      if (!token) {
        SessionManager.clearSession();
        router.push('/signin');
        return;
      }

      const response = await fetch(`/api/admin/whatsapp/sessions/${sessionToTransfer.id}/transfer`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedTransferUserId === 'unassign' ? null : selectedTransferUserId || null
        }),
      });

      if (response.status === 401) {
        SessionManager.clearSession();
        router.push('/signin');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to transfer session');
      }

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: data.message || 'Session transferred successfully',
        });
        fetchSessions();
        setShowTransferDialog(false);
        setSessionToTransfer(null);
        setSelectedTransferUserId('');
      } else {
        throw new Error(data.error || 'Failed to transfer session');
      }
    } catch (error) {
      console.error('Error transferring session:', error);
      toast({
        title: 'Error',
        description: 'Failed to transfer WhatsApp session',
        variant: 'destructive',
      });
    } finally {
      setIsTransferring(false);
    }
  };

  // Close transfer dialog
  const handleCloseTransferDialog = () => {
    setShowTransferDialog(false);
    setSessionToTransfer(null);
    setSelectedTransferUserId('');
    setTransferUsers([]);
  };

  // Session Control Functions
  
  // Connect Session
  const handleConnectSession = (session: WhatsAppSession) => {
    setSessionToControl(session);
    
    // Prepare Subscribe events from session's webhook events
    let subscribeEvents: string[] = [];
    
    if (session.events === 'All' || !session.events) {
      // If "All" events, use empty array (server understands this as all events)
      subscribeEvents = [];
    } else {
      // Parse webhook events from database
      const sessionEvents = session.events.split(',').map(e => e.trim()).filter(e => e);
      subscribeEvents = [...sessionEvents];
      
      // Add "Message" only if not already present
      if (!subscribeEvents.includes('Message')) {
        subscribeEvents.push('Message');
      }
      
      // Don't automatically add ReadReceipt - only use what's in webhook events
    }
    
    setConnectForm({
      Subscribe: subscribeEvents,
      Immediate: true
    });
    
    // Only show Connect dialog first
    setShowConnectDialog(true);
  };

  const handleConfirmConnect = async () => {
    if (!sessionToControl) return;

    setIsConnecting(true);
    try {
      const token = SessionManager.getToken();
      if (!token) {
        SessionManager.clearSession();
        router.push('/signin');
        return;
      }

      const response = await fetch(`/api/admin/whatsapp/sessions/${sessionToControl.id}/connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(connectForm),
      });

      if (response.status === 401) {
        SessionManager.clearSession();
        router.push('/signin');
        return;
      }

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Session connected successfully. QR code is now available for authentication.',
        });
        
        // Close Connect dialog
        setShowConnectDialog(false);
        
        // Refresh sessions list
        fetchSessions();
        
        // NOW show QR dialog and start polling after successful connection
        setQrCode('');
        setSessionStatus(null);
        setShowQrDialog(true);
        
        // Start QR polling after connection success
        await fetchQRCode(sessionToControl.id);
        await fetchSessionStatus(sessionToControl.id);
        
        // Status polling every 1 second
        const statusInterval = setInterval(async () => {
          await fetchSessionStatus(sessionToControl.id);
        }, 1000);
        setStatusPolling(statusInterval);
        
        // QR code polling every 2 seconds
        const qrInterval = setInterval(async () => {
          await fetchQRCode(sessionToControl.id);
        }, 2000);
        setQrPolling(qrInterval);
        
      } else {
        throw new Error(data.error || 'Failed to connect session');
      }
    } catch (error) {
      console.error('Error connecting session:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to connect session',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Get Session Status
  const handleGetStatus = (session: WhatsAppSession) => {
    setSessionToControl(session);
    setSessionStatus(null);
    setQrCode('');
    setShowStatusDialog(true);
    fetchSessionStatus(session.id);
    
    // Start polling for status updates every 3 seconds
    const interval = setInterval(() => {
      fetchSessionStatus(session.id);
    }, 3000);
    setStatusPolling(interval);
  };

  const fetchSessionStatus = async (sessionId: string) => {
    try {
      setIsGettingStatus(true);
      const token = SessionManager.getToken();
      if (!token) return;

      const response = await fetch(`/api/admin/whatsapp/sessions/${sessionId}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSessionStatus(data.data);
          setQrCode(data.data.qrcode || '');
          
          // Stop both status and QR polling if logged in
          if (data.data.loggedIn) {
            if (statusPolling) {
              clearInterval(statusPolling);
              setStatusPolling(null);
            }
            if (qrPolling) {
              clearInterval(qrPolling);
              setQrPolling(null);
            }
            
            // Refresh sessions list to update UI
            fetchSessions();
            
            // Show success message
            toast({
              title: 'Success',
              description: 'WhatsApp session successfully authenticated!',
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    } finally {
      setIsGettingStatus(false);
    }
  };

  // Get QR Code
  const handleGetQR = async (session: WhatsAppSession) => {
    setSessionToControl(session);
    setQrCode('');
    setSessionStatus(null);
    setShowQrDialog(true);
    
    // Initial fetch
    await fetchQRCode(session.id);
    await fetchSessionStatus(session.id);
    
    // Status polling every 1 second
    const statusInterval = setInterval(async () => {
      await fetchSessionStatus(session.id);
    }, 1000);
    setStatusPolling(statusInterval);
    
    // QR code polling every 2 seconds
    const qrInterval = setInterval(async () => {
      await fetchQRCode(session.id);
    }, 2000);
    setQrPolling(qrInterval);
  };

  const fetchQRCode = async (sessionId: string) => {
    try {
      setIsGettingQR(true);
      const token = SessionManager.getToken();
      if (!token) {
        SessionManager.clearSession();
        router.push('/signin');
        return;
      }

      const response = await fetch(`/api/admin/whatsapp/sessions/${sessionId}/qr`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setQrCode(data.data.QRCode || '');
      } else {
        console.error('Failed to get QR:', data.error);
      }
    } catch (error) {
      console.error('Error getting QR:', error);
    } finally {
      setIsGettingQR(false);
    }
  };

  // Pair Phone
  const handlePairPhone = (session: WhatsAppSession) => {
    setSessionToControl(session);
    setPairPhoneForm({ Phone: '' });
    setLinkingCode('');
    setShowPairPhoneDialog(true);
  };

  const handleConfirmPairPhone = async () => {
    if (!sessionToControl || !pairPhoneForm.Phone) return;

    setIsPairingPhone(true);
    try {
      const token = SessionManager.getToken();
      if (!token) {
        SessionManager.clearSession();
        router.push('/signin');
        return;
      }

      const response = await fetch(`/api/admin/whatsapp/sessions/${sessionToControl.id}/pairphone`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pairPhoneForm),
      });

      const data = await response.json();
      if (data.success) {
        setLinkingCode(data.data.LinkingCode || '');
        toast({
          title: 'Success',
          description: 'Linking code generated successfully',
        });
      } else {
        throw new Error(data.error || 'Failed to generate pairing code');
      }
    } catch (error) {
      console.error('Error pairing phone:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate pairing code',
        variant: 'destructive',
      });
    } finally {
      setIsPairingPhone(false);
    }
  };

  // Disconnect Session
  const handleDisconnectSession = async (session: WhatsAppSession) => {
    setIsDisconnecting(true);
    try {
      const token = SessionManager.getToken();
      if (!token) {
        SessionManager.clearSession();
        router.push('/signin');
        return;
      }

      const response = await fetch(`/api/admin/whatsapp/sessions/${session.id}/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: data.data.message || 'Session disconnected successfully',
        });
      } else {
        toast({
          title: 'Warning',
          description: data.error || 'Disconnect feature has some issues but local status updated',
          variant: 'destructive',
        });
      }
      fetchSessions();
    } catch (error) {
      console.error('Error disconnecting session:', error);
      toast({
        title: 'Error',
        description: 'Failed to disconnect session',
        variant: 'destructive',
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Logout Session
  const handleLogoutSession = async (session: WhatsAppSession) => {
    setIsLoggingOut(true);
    try {
      const token = SessionManager.getToken();
      if (!token) {
        SessionManager.clearSession();
        router.push('/signin');
        return;
      }

      const response = await fetch(`/api/admin/whatsapp/sessions/${session.id}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: data.data.message || 'Successfully logged out from WhatsApp',
        });
        fetchSessions();
      } else {
        throw new Error(data.error || 'Failed to logout');
      }
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: 'Error',
        description: 'Failed to logout from WhatsApp',
        variant: 'destructive',
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Close dialogs and cleanup
  const handleCloseStatusDialog = () => {
    setShowStatusDialog(false);
    setSessionToControl(null);
    setSessionStatus(null);
    setQrCode('');
    if (statusPolling) {
      clearInterval(statusPolling);
      setStatusPolling(null);
    }
  };

  const handleCloseQrDialog = () => {
    setShowQrDialog(false);
    setSessionToControl(null);
    setQrCode('');
    setSessionStatus(null);
    if (qrPolling) {
      clearInterval(qrPolling);
      setQrPolling(null);
    }
  };

  const handleClosePairPhoneDialog = () => {
    setShowPairPhoneDialog(false);
    setSessionToControl(null);
    setPairPhoneForm({ Phone: '' });
    setLinkingCode('');
  };

  const handleCloseConnectDialog = () => {
    setShowConnectDialog(false);
    setSessionToControl(null);
    setConnectForm({
      Subscribe: [],
      Immediate: true
    });
  };

  // Get status badge variant
  const getStatusBadge = (session: WhatsAppSession) => {
    if (session.connected && session.loggedIn) {
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Connected
      </Badge>;
    } else if (!session.connected) {
      return <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
        <XCircle className="w-3 h-3 mr-1" />
        Disconnected
      </Badge>;
    } else if (!session.loggedIn) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
        <QrCode className="w-3 h-3 mr-1" />
        QR Required
      </Badge>;
    } else {
      return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Apply filters
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = !searchTerm || 
      session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (session.jid && session.jid.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !statusFilter || statusFilter === 'all' ||
      (statusFilter === 'connected' && session.connected && session.loggedIn) ||
      (statusFilter === 'disconnected' && !session.connected) ||
      (statusFilter === 'qr_required' && !session.loggedIn && !session.connected);
    
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (statusPolling) {
        clearInterval(statusPolling);
      }
      if (qrPolling) {
        clearInterval(qrPolling);
      }
    };
  }, [statusPolling, qrPolling]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp Sessions</h1>
          <p className="text-muted-foreground">
            Manage WhatsApp sessions synced from your WhatsApp Go service. Sessions are stored in database and can be assigned to users.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => fetchSessions()} disabled={isLoading} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Session
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              All registered sessions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.connectedSessions}</div>
            <p className="text-xs text-muted-foreground">
              Currently connected
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disconnected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.disconnectedSessions}</div>
            <p className="text-xs text-muted-foreground">
              Not connected
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QR Required</CardTitle>
            <QrCode className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.qrRequiredSessions}</div>
            <p className="text-xs text-muted-foreground">
              Need QR scan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Sessions</CardTitle>
          <CardDescription>
            Sessions synced from WhatsApp Go service and stored in database. System sessions (marked with 🔧) are used for Genfity app operations. User sessions are owned by admins.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sessions by name, ID, or phone number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="connected">Connected</SelectItem>
                <SelectItem value="disconnected">Disconnected</SelectItem>
                <SelectItem value="qr_required">QR Required</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">Loading sessions...</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2">No sessions found matching your criteria.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>WhatsApp Number</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Webhook</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{session.name}</div>
                        {session.isSystemSession && (
                          <div className="flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3 text-amber-600" />
                            <span className="text-xs text-amber-600 font-medium">
                              System Session (Genfity App)
                            </span>
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground font-mono">
                          ID: {session.id.substring(0, 8)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{session.userName}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {session.userRole}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm text-muted-foreground">
                        {session.token.substring(0, 8)}...
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(session)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {session.jid ? (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-green-600" />
                            {session.jid.split('@')[0]}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Not connected</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {session.events || 'All'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {session.webhook ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            Configured
                          </span>
                        ) : (
                          <span className="text-muted-foreground">- None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(session)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          
                          {/* Session Control Actions */}
                          {!session.connected && (
                            <DropdownMenuItem onClick={() => handleConnectSession(session)}>
                              <Zap className="mr-2 h-4 w-4" />
                              Connect Session
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem onClick={() => handleGetStatus(session)}>
                            <Activity className="mr-2 h-4 w-4" />
                            Monitor Status
                          </DropdownMenuItem>
                          
                          {session.connected && !session.loggedIn && (
                            <>
                              <DropdownMenuItem onClick={() => handleGetQR(session)}>
                                <QrCode className="mr-2 h-4 w-4" />
                                Show QR Code
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePairPhone(session)}>
                                <Phone className="mr-2 h-4 w-4" />
                                Pair Phone
                              </DropdownMenuItem>
                            </>
                          )}
                          
                          {session.connected && (
                            <DropdownMenuItem 
                              onClick={() => handleDisconnectSession(session)}
                              disabled={isDisconnecting}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                            </DropdownMenuItem>
                          )}
                          
                          {session.loggedIn && (
                            <DropdownMenuItem 
                              onClick={() => handleLogoutSession(session)}
                              disabled={isLoggingOut}
                            >
                              <Settings className="mr-2 h-4 w-4" />
                              {isLoggingOut ? 'Logging out...' : 'Logout WhatsApp'}
                            </DropdownMenuItem>
                          )}
                          
                          {/* Admin Actions */}
                          {!session.isSystemSession && (
                            <DropdownMenuItem onClick={() => handleTransferSession(session)}>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Transfer Session
                            </DropdownMenuItem>
                          )}
                          {!session.isSystemSession && (
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(session)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Session
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Session Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={handleCloseCreateDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New WhatsApp Session</DialogTitle>
            <DialogDescription>
              Add a new WhatsApp session to your WhatsApp Go service.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Session Name *</Label>
                <Input
                  id="name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., customer-session-1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="token">Session Token *</Label>
                <Input
                  id="token"
                  value={createForm.token}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, token: e.target.value }))}
                  placeholder="Enter unique token"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="webhook">Webhook URL</Label>
              <Input
                id="webhook"
                value={createForm.webhook}
                onChange={(e) => setCreateForm(prev => ({ ...prev, webhook: e.target.value }))}
                placeholder="https://example.com/webhook"
              />
            </div>
            
            <div className="space-y-3">
              <Label>Webhook Events</Label>
              <div className="border rounded-lg p-4 space-y-3 max-h-48 overflow-y-auto">
                {/* All Events Toggle */}
                <div className="flex items-center space-x-2 pb-2 border-b">
                  <Checkbox 
                    id="all-events"
                    checked={isAllEvents}
                    onCheckedChange={handleAllEventsToggle}
                  />
                  <Label htmlFor="all-events" className="text-sm font-medium">
                    All Events {isAllEvents && `(${WEBHOOK_EVENTS.length} events)`}
                  </Label>
                </div>
                
                {/* Individual Events (shown only when not "All") */}
                {!isAllEvents && (
                  <div className="grid grid-cols-2 gap-2">
                    {WEBHOOK_EVENTS.map((event) => (
                      <div key={event} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`event-${event}`}
                          checked={selectedEvents.includes(event)}
                          onCheckedChange={(checked) => handleEventToggle(event, !!checked)}
                        />
                        <Label htmlFor={`event-${event}`} className="text-xs">
                          {event}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Selected count when not all */}
                {!isAllEvents && selectedEvents.length > 0 && (
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Selected: {selectedEvents.length} of {WEBHOOK_EVENTS.length} events
                  </div>
                )}
              </div>
            </div>

            {/* Proxy Configuration */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="proxy-enabled"
                  checked={createForm.proxyConfig.enabled}
                  onCheckedChange={(checked) => 
                    setCreateForm(prev => ({ 
                      ...prev, 
                      proxyConfig: { ...prev.proxyConfig, enabled: !!checked }
                    }))
                  }
                />
                <Label htmlFor="proxy-enabled" className="text-sm font-medium">
                  Enable Proxy Configuration
                </Label>
              </div>
              {createForm.proxyConfig.enabled && (
                <div className="space-y-2">
                  <Label htmlFor="proxy-url">Proxy URL</Label>
                  <Input
                    id="proxy-url"
                    value={createForm.proxyConfig.proxyURL}
                    onChange={(e) => setCreateForm(prev => ({ 
                      ...prev, 
                      proxyConfig: { ...prev.proxyConfig, proxyURL: e.target.value }
                    }))}
                    placeholder="socks5://user:pass@host:port"
                  />
                </div>
              )}
            </div>

            {/* S3 Configuration */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="s3-enabled"
                  checked={createForm.s3Config.enabled}
                  onCheckedChange={(checked) => 
                    setCreateForm(prev => ({ 
                      ...prev, 
                      s3Config: { ...prev.s3Config, enabled: !!checked }
                    }))
                  }
                />
                <Label htmlFor="s3-enabled" className="text-sm font-medium">
                  Enable S3 Storage Configuration
                </Label>
              </div>
              {createForm.s3Config.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="s3-endpoint">S3 Endpoint</Label>
                    <Input
                      id="s3-endpoint"
                      value={createForm.s3Config.endpoint}
                      onChange={(e) => setCreateForm(prev => ({ 
                        ...prev, 
                        s3Config: { ...prev.s3Config, endpoint: e.target.value }
                      }))}
                      placeholder="https://s3.amazonaws.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="s3-region">Region</Label>
                    <Input
                      id="s3-region"
                      value={createForm.s3Config.region}
                      onChange={(e) => setCreateForm(prev => ({ 
                        ...prev, 
                        s3Config: { ...prev.s3Config, region: e.target.value }
                      }))}
                      placeholder="us-east-1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="s3-bucket">Bucket</Label>
                    <Input
                      id="s3-bucket"
                      value={createForm.s3Config.bucket}
                      onChange={(e) => setCreateForm(prev => ({ 
                        ...prev, 
                        s3Config: { ...prev.s3Config, bucket: e.target.value }
                      }))}
                      placeholder="my-bucket"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="s3-access-key">Access Key</Label>
                    <Input
                      id="s3-access-key"
                      value={createForm.s3Config.accessKey}
                      onChange={(e) => setCreateForm(prev => ({ 
                        ...prev, 
                        s3Config: { ...prev.s3Config, accessKey: e.target.value }
                      }))}
                      placeholder="AKIAIOSFODNN7EXAMPLE"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseCreateDialog}>
              Cancel
            </Button>
            <Button onClick={handleCreateSession} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Session'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Session Details</DialogTitle>
            <DialogDescription>
              Comprehensive information about the WhatsApp session.
            </DialogDescription>
          </DialogHeader>
          {selectedSession && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Session Name</Label>
                  <p className="text-sm text-muted-foreground">{selectedSession.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedSession)}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Connected</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedSession.connected ? '✅ Yes' : '❌ No'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Logged In</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedSession.loggedIn ? '✅ Yes' : '❌ No'}
                  </p>
                </div>
              </div>

              {selectedSession.jid && (
                <div>
                  <Label className="text-sm font-medium">WhatsApp Number</Label>
                  <p className="text-sm text-muted-foreground font-mono">{selectedSession.jid}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Session Type</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedSession.isSystemSession ? '🔧 System Session (Genfity App)' : '👤 User Session'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Owner</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedSession.userName} ({selectedSession.userRole})
                  </p>
                </div>
              </div>

              {selectedSession.webhook && (
                <div>
                  <Label className="text-sm font-medium">Webhook URL</Label>
                  <p className="text-sm text-muted-foreground break-all">{selectedSession.webhook}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Events</Label>
                <p className="text-sm text-muted-foreground">{selectedSession.events || 'All'}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Session Token</Label>
                <p className="text-sm text-muted-foreground font-mono">
                  {selectedSession.token.substring(0, 16)}...
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">Session ID</Label>
                <p className="text-sm text-muted-foreground font-mono">{selectedSession.id}</p>
              </div>

              {/* Proxy Config */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Proxy Configuration</Label>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Enabled: {selectedSession.proxy_config.enabled ? '✅ Yes' : '❌ No'}
                  </p>
                  {selectedSession.proxy_config.enabled && selectedSession.proxy_config.proxy_url && (
                    <p className="text-sm text-muted-foreground">
                      URL: {selectedSession.proxy_config.proxy_url}
                    </p>
                  )}
                </div>
              </div>

              {/* S3 Config */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">S3 Storage Configuration</Label>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Enabled: {selectedSession.s3_config.enabled ? '✅ Yes' : '❌ No'}
                  </p>
                  {selectedSession.s3_config.enabled && (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Endpoint: {selectedSession.s3_config.endpoint}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Bucket: {selectedSession.s3_config.bucket}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Media Delivery: {selectedSession.s3_config.media_delivery}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Transfer Session Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={handleCloseTransferDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Transfer Session</DialogTitle>
            <DialogDescription>
              Transfer the WhatsApp session &ldquo;{sessionToTransfer?.name}&rdquo; to a customer. 
              The customer will gain full control and ownership of this session.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Current Session Info */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <Label className="text-sm font-medium">Session to Transfer</Label>
              <div className="mt-2 space-y-1">
                <p className="text-sm font-medium">{sessionToTransfer?.name}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  ID: {sessionToTransfer?.id}
                </p>
                <p className="text-xs text-muted-foreground">
                  Current Owner: {sessionToTransfer?.userName || 'Admin (Unassigned)'}
                </p>
              </div>
            </div>

            {/* User Selection */}
            <div className="space-y-2">
              <Label htmlFor="transfer-user">Select Customer</Label>
              <Select 
                value={selectedTransferUserId} 
                onValueChange={setSelectedTransferUserId}
                disabled={isLoadingUsers}
              >
                <SelectTrigger id="transfer-user">
                  <SelectValue placeholder={
                    isLoadingUsers ? "Loading customers..." : "Choose a customer to transfer to"
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassign">
                    🏢 Admin (Remove assignment)
                  </SelectItem>
                  {transferUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <span className="font-medium">
                            {user.name || user.email}
                          </span>
                          {user.name && (
                            <span className="text-xs text-muted-foreground ml-2">
                              {user.email}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({user._count.whatsAppSessions} sessions)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {transferUsers.length === 0 && !isLoadingUsers && (
                <p className="text-xs text-muted-foreground">
                  No customers available for transfer. Only users with &apos;customer&apos; role can receive sessions.
                </p>
              )}
            </div>

            {/* Warning Note */}
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">
                    Important Notice
                  </h3>
                  <div className="mt-1 text-sm text-amber-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>The customer will gain full control of this session</li>
                      <li>The session will appear in their customer dashboard</li>
                      <li>This action can be reversed by transferring back to admin</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseTransferDialog}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmTransfer} 
              disabled={isTransferring || !selectedTransferUserId}
            >
              {isTransferring ? 'Transferring...' : 'Transfer Session'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the WhatsApp session
              {sessionToDelete && ` "${sessionToDelete.name}"`} from your WhatsApp Go service and remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              variant="destructive"
            >
              {isDeleting ? 'Deleting...' : 'Delete Session'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Connect Session Dialog */}
      <Dialog open={showConnectDialog} onOpenChange={handleCloseConnectDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Connect WhatsApp Session
            </DialogTitle>
            <DialogDescription>
              Connect &ldquo;{sessionToControl?.name}&rdquo; to WhatsApp server. After connection, QR code will be available for authentication.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Current Session Info */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <Label className="text-sm font-medium">Session Configuration</Label>
              <div className="mt-2 space-y-1 text-sm">
                <div>
                  <span className="text-muted-foreground">Webhook Events:</span>
                  <span className="ml-2 font-medium">
                    {sessionToControl?.events || 'All'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Subscribe Events:</span>
                  <span className="ml-2 font-medium">
                    {connectForm.Subscribe.length === 0 ? 'All (default)' : connectForm.Subscribe.join(', ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Connection Options */}
            <div className="space-y-3">
              <Label>Connection Options</Label>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="immediate-connect"
                  checked={connectForm.Immediate}
                  onCheckedChange={(checked) => setConnectForm(prev => ({ ...prev, Immediate: !!checked }))}
                />
                <Label htmlFor="immediate-connect" className="text-sm">Immediate Connection</Label>
              </div>
              
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Subscribe events are automatically configured from your webhook settings</p>
                <p>• QR code will be available immediately after connection</p>
                <p>• Connection consumes server resources until disconnected</p>
              </div>
            </div>

            {/* Next Steps Preview */}
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800 text-sm font-medium mb-1">
                <QrCode className="h-4 w-4" />
                Next: QR Code Authentication
              </div>
              <p className="text-blue-700 text-xs">
                After connecting, scan the QR code with WhatsApp to complete authentication
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseConnectDialog}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmConnect} 
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Connect & Show QR
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Monitor Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={handleCloseStatusDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Session Status Monitor</DialogTitle>
            <DialogDescription>
              Real-time status for &ldquo;{sessionToControl?.name}&rdquo; - Updates every 3 seconds
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {isGettingStatus && !sessionStatus && (
              <div className="text-center py-8">
                <RefreshCw className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Loading status...</p>
              </div>
            )}
            
            {sessionStatus && (
              <div className="space-y-4">
                {/* Status Overview */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Connection Status</Label>
                    <div className="flex items-center gap-2">
                      {sessionStatus.connected ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3 mr-1" />
                          Disconnected
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Login Status</Label>
                    <div className="flex items-center gap-2">
                      {sessionStatus.loggedIn ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Logged In
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          <QrCode className="w-3 h-3 mr-1" />
                          Login Required
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* WhatsApp Number */}
                {sessionStatus.jid && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">WhatsApp Number</Label>
                    <p className="text-sm font-mono bg-muted p-2 rounded">
                      {sessionStatus.jid}
                    </p>
                  </div>
                )}

                {/* QR Code Display */}
                {sessionStatus.qrcode && !sessionStatus.loggedIn && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">QR Code - Scan with WhatsApp</Label>
                    <div className="flex justify-center p-4 bg-white rounded-lg border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={sessionStatus.qrcode} 
                        alt="WhatsApp QR Code" 
                        className="max-w-[200px] max-h-[200px]"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      QR code updates automatically. Scan with WhatsApp to login.
                    </p>
                  </div>
                )}

                {/* Success Message */}
                {sessionStatus.loggedIn && (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
                    <CheckCircle className="mx-auto h-8 w-8 text-green-600 mb-2" />
                    <p className="text-green-800 font-medium">WhatsApp Connected Successfully!</p>
                    <p className="text-green-600 text-sm">Session is ready to use.</p>
                  </div>
                )}

                {/* Connection Required */}
                {!sessionStatus.connected && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-center">
                    <XCircle className="mx-auto h-8 w-8 text-amber-600 mb-2" />
                    <p className="text-amber-800 font-medium">Session Disconnected</p>
                    <p className="text-amber-600 text-sm">Connect the session first to get QR code.</p>
                  </div>
                )}

                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Events</Label>
                    <p className="text-sm">{sessionStatus.events}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Session ID</Label>
                    <p className="text-sm font-mono">{sessionStatus.id}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseStatusDialog}>
              Close Monitor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={showQrDialog} onOpenChange={handleCloseQrDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              WhatsApp QR Authentication
            </DialogTitle>
            <DialogDescription>
              Scan QR code or use phone pairing to authenticate &ldquo;{sessionToControl?.name}&rdquo;
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {/* Session Status */}
            {sessionStatus && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Session Status</Label>
                  {isGettingStatus && (
                    <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Connected:</span>
                    <span className={`ml-2 font-medium ${sessionStatus.connected ? 'text-green-600' : 'text-red-600'}`}>
                      {sessionStatus.connected ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Logged In:</span>
                    <span className={`ml-2 font-medium ${sessionStatus.loggedIn ? 'text-green-600' : 'text-orange-600'}`}>
                      {sessionStatus.loggedIn ? 'Yes' : 'Pending'}
                    </span>
                  </div>
                </div>
                {sessionStatus.loggedIn && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                    ✅ WhatsApp authentication successful! You can close this dialog.
                  </div>
                )}
              </div>
            )}

            {/* QR Code Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">QR Code Authentication</Label>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <RefreshCw className="h-3 w-3" />
                  QR: every 2s, Status: every 1s
                </div>
              </div>
              
              {qrCode ? (
                <div className="space-y-4">
                  <div className="flex justify-center p-6 bg-white rounded-lg border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={qrCode} 
                      alt="WhatsApp QR Code" 
                      className="max-w-[280px] max-h-[280px]"
                    />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium">📱 Scan with WhatsApp</p>
                    <p className="text-xs text-muted-foreground">
                      Open WhatsApp → Settings → Linked Devices → Link a Device
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground border rounded-lg">
                  {isGettingQR ? (
                    <>
                      <RefreshCw className="mx-auto h-8 w-8 animate-spin mb-2" />
                      <p>Loading QR code...</p>
                    </>
                  ) : (
                    <>
                      <QrCode className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2" />
                      <p>QR code not available</p>
                      <p className="text-xs">Session might not be ready for authentication</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Alternative: Phone Pairing */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-sm font-medium">Alternative: Phone Pairing</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleCloseQrDialog();
                    if (sessionToControl) {
                      handlePairPhone(sessionToControl);
                    }
                  }}
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Use Phone Pairing
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                If QR scanning doesn&rsquo;t work, you can use phone number pairing instead
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseQrDialog}>
              Close
            </Button>
            {sessionStatus?.loggedIn && (
              <Button onClick={() => {
                handleCloseQrDialog();
                fetchSessions();
              }}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pair Phone Dialog */}
      <Dialog open={showPairPhoneDialog} onOpenChange={handleClosePairPhoneDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Pair Phone Number</DialogTitle>
            <DialogDescription>
              Link WhatsApp account for &ldquo;{sessionToControl?.name}&rdquo; using phone number
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="phone-number">Phone Number</Label>
              <Input
                id="phone-number"
                value={pairPhoneForm.Phone}
                onChange={(e) => setPairPhoneForm(prev => ({ ...prev, Phone: e.target.value }))}
                placeholder="6281233784490"
                maxLength={15}
              />
              <p className="text-xs text-muted-foreground">
                Enter phone number with country code (e.g., 62 for Indonesia). Do not include leading zero or + symbol.
              </p>
            </div>
            
            {linkingCode && (
              <div className="space-y-3 bg-green-50 border border-green-200 p-4 rounded-lg">
                <Label className="text-sm font-medium text-green-800">Linking Code Generated</Label>
                <div className="text-center">
                  <p className="text-2xl font-mono font-bold text-green-800 tracking-wider">
                    {linkingCode}
                  </p>
                </div>
                <div className="space-y-2 text-sm text-green-700">
                  <p className="font-medium">Instructions:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Open WhatsApp on your phone</li>
                    <li>Go to Settings → Linked Devices</li>
                    <li>Tap &ldquo;Link a Device&rdquo;</li>
                    <li>Tap &ldquo;Link with Phone Number Instead&rdquo;</li>
                    <li>Enter the linking code above</li>
                  </ol>
                </div>
                <p className="text-xs text-green-600 italic">
                  Note: This code can only be used once. Generate a new one if it fails.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClosePairPhoneDialog}>
              Close
            </Button>
            <Button 
              onClick={handleConfirmPairPhone} 
              disabled={isPairingPhone || !pairPhoneForm.Phone}
            >
              {isPairingPhone ? 'Generating...' : 'Generate Code'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
