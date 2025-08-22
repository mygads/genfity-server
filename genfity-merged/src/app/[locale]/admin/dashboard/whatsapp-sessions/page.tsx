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
  ShieldCheck,
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
  createdAt: string;
  updatedAt: string;
}

interface SessionStats {
  totalSessions: number;
  connectedSessions: number;
  disconnectedSessions: number;
  qrRequiredSessions: number;
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
  const [selectedSession, setSelectedSession] = useState<WhatsAppSession | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<WhatsAppSession | null>(null);
  
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
    </div>
  );
}
