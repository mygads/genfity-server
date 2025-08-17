// WhatsApp Management Page
'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, RefreshCw, Plus, Code, Trash2, Settings, Activity, CheckCircle, AlertCircle, Star, MessageSquare, Clock, Play, Pause } from 'react-feather';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Session {
  sessionId: string;
  sessionName?: string | null;
  status?: string | null;
  message?: string | null;
  qr?: string | null;
  userId?: string;
  userName?: string;
  userApiKey?: string | null;
  createdAt?: string;
  updatedAt?: string;
  isConnected?: boolean;
  needsQR?: boolean;
  isLoading?: boolean;
  hasError?: boolean;
  isStopped?: boolean;
  qrImage?: string;
}

export default function WhatsAppManagementPage() {  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [newSessionId, setNewSessionId] = useState('');
  const [newSessionName, setNewSessionName] = useState('');
  const [notificationSession, setNotificationSession] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [rootSessionId, setRootSessionId] = useState<string | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrSessionId, setQrSessionId] = useState<string | null>(null);  const [showQrModal, setShowQrModal] = useState(false);
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);
  
  // Session monitoring states
  const [sessionMonitorStats, setSessionMonitorStats] = useState({
    monitoredSessions: 0,
    lastCheck: null as string | null,
    autoMonitorEnabled: false
  });const [sessionStats, setSessionStats] = useState({
    total: 0,
    connected: 0,
    disconnected: 0,
    needsQR: 0,
    loading: 0,
    stopped: 0,
    error: 0
  });// New function to fetch real-time session data using webhook endpoints
  const fetchRealtimeSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/session/list-realtime');
      const data = await res.json();
      
      if (data.success) {
        setSessions(data.data || []);        setSessionStats(data.summary || {
          total: 0,
          connected: 0,
          disconnected: 0,
          needsQR: 0,
          loading: 0,
          stopped: 0,
          error: 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch real-time sessions:', error);
      // Fallback to old endpoint if real-time fails
      fetchSessions();
    }
  }, []);

  useEffect(() => {
    // Ambil session utama dari .env (dari public env agar bisa diakses FE)
    setRootSessionId(process.env.NEXT_PUBLIC_WHATSAPP_SESSION_ID || null);
    fetchSessions();

    // Set up real-time updates using the new webhook endpoints
    let interval: NodeJS.Timeout | null = null;
    if (realTimeUpdates) {
      interval = setInterval(fetchRealtimeSessions, 3000); // Poll every 3 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [realTimeUpdates, fetchRealtimeSessions]);
  async function fetchSessions() {
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp/session/listAll');
      const data = await res.json();
      // Ensure we always get fresh data from database
      setSessions(Array.isArray(data.sessions) ? data.sessions : Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }  async function handleCreateSession() {
    if (!newSessionId) return;
    
    try {
      // For admin sessions, sessionName defaults to sessionId if not provided
      const finalSessionName = newSessionName || newSessionId;
      
      const response = await fetch(`/api/whatsapp/session/admin/start/${newSessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: 'admin',
          sessionName: finalSessionName
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Failed to start session:', result.error);
        alert(`Failed to start session: ${result.error}`);
        return;
      }
      
      console.log('Session started successfully:', result);
      
      // Clear inputs
      setNewSessionId('');
      setNewSessionName('');
      
      // Immediately fetch fresh data from database
      await fetchSessions();
    } catch (error) {
      console.error('Error starting session:', error);
      alert(`Error starting session: ${error}`);
    }
  }
  async function handleRestart(sessionId: string) {
    try {
      await fetch(`/api/whatsapp/session/restart/${sessionId}`, { method: 'POST' });
      // Immediately fetch fresh data from database
      await fetchSessions();
    } catch (error) {
      console.error('Error restarting session:', error);
    }
  }  async function handleTerminate(sessionId: string) {
    try {
      await fetch(`/api/whatsapp/session/terminate/${sessionId}`, { method: 'POST' });
      // Immediately fetch fresh data from database - this ensures DB is source of truth
      await fetchSessions();
    } catch (error) {
      console.error('Error terminating session:', error);
    }
  }

  async function handleStopSession(sessionId: string) {
    try {
      const response = await fetch(`/api/whatsapp/session/stop/${sessionId}`, { method: 'POST' });
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Failed to stop session:', result.error);
        alert(`Failed to stop session: ${result.error}`);
        return;
      }
      
      console.log('Session stopped successfully:', result);
      // Immediately fetch fresh data from database
      await fetchSessions();
    } catch (error) {
      console.error('Error stopping session:', error);
      alert(`Error stopping session: ${error}`);
    }
  }
  async function handleStartStoppedSession(sessionId: string) {
    try {
      const response = await fetch(`/api/whatsapp/session/start/${sessionId}`, { method: 'POST' });
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Failed to start session:', result.error);
        alert(`Failed to start session: ${result.error}`);
        return;
      }
      
      console.log('Session started successfully:', result);
      // Immediately fetch fresh data from database
      await fetchSessions();
    } catch (error) {
      console.error('Error starting session:', error);
      alert(`Error starting session: ${error}`);
    }
  }

  async function handleStartSession(sessionId: string) {
    try {
      const response = await fetch(`/api/whatsapp/session/start/${sessionId}`, { method: 'POST' });
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Failed to start session:', result.error);
        alert(`Failed to start session: ${result.error}`);
        return;
      }
      
      console.log('Session started successfully:', result);
      // Immediately fetch fresh data from database
      await fetchSessions();
    } catch (error) {
      console.error('Error starting session:', error);
      alert(`Error starting session: ${error}`);
    }
  }async function handleViewQr(sessionId: string) {
    setQrImage(null);
    setQrSessionId(sessionId);
    setShowQrModal(true);
    
    try {
      // Use the new streaming QR image endpoint
      const imageUrl = `/api/whatsapp/session/qr/${sessionId}/image`;
      setQrImage(imageUrl);
      
      // Refresh session data to get latest status from database
      await fetchSessions();
    } catch (error) {
      console.error('Failed to load QR code:', error);
      setQrImage(null);
    }
  }

  async function handleRefreshQr(sessionId: string) {
    setQrImage(null);
    
    try {
      // Trigger QR refresh by calling the WhatsApp service
      const res = await fetch(`/api/whatsapp/session/qr/${sessionId}`, { 
        method: 'POST' 
      });
      
      if (res.ok) {
        // Wait a moment for QR to be generated, then update the image
        setTimeout(() => {
          const imageUrl = `/api/whatsapp/session/qr/${sessionId}/image?t=${Date.now()}`;
          setQrImage(imageUrl);
        }, 1000);
      }
      
      // Immediately fetch fresh data from database
      await fetchSessions();
    } catch (error) {
      console.error('Failed to refresh QR code:', error);
    }
  }

  async function handleSetNotification(sessionId: string) {
    try {
      await fetch('/api/whatsapp/session/setNotification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      setNotificationSession(sessionId);
      // Immediately fetch fresh data from database
      await fetchSessions();
    } catch (error) {
      console.error('Error setting notification:', error);
    }
  }
  async function handleBulkTerminate() {
    try {
      await fetch('/api/whatsapp/session/admin/terminateAll', { method: 'POST' });
      // Immediately fetch fresh data from database
      await fetchSessions();
    } catch (error) {
      console.error('Error bulk terminating sessions:', error);
    }
  }

  // Session monitor functions
  async function handleSessionMonitor() {
    try {
      const response = await fetch('/api/whatsapp/session/monitor', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Failed to trigger session monitor:', result.error);
        alert(`Failed to trigger session monitor: ${result.error}`);
        return;
      }
      
      console.log('Session monitor triggered successfully:', result);      // Update monitor stats with the result
      setSessionMonitorStats(prev => ({
        ...prev,
        monitoredSessions: result.sessionsStopped || 0, // Use the correct field name
        lastCheck: new Date().toISOString()
      }));
      
      // Refresh sessions to see any stopped sessions
      await fetchSessions();
    } catch (error) {
      console.error('Error triggering session monitor:', error);
      alert(`Error triggering session monitor: ${error}`);
    }
  }

  async function fetchMonitorStats() {
    try {
      const response = await fetch('/api/whatsapp/session/monitor');
      const result = await response.json();
      
      if (response.ok && result.success) {
        setSessionMonitorStats(prev => ({
          ...prev,
          monitoredSessions: result.monitoredSessions || 0,
          lastCheck: result.lastCheck || prev.lastCheck
        }));
      }
    } catch (error) {
      console.error('Error fetching monitor stats:', error);
    }
  }

  // Fetch monitor stats when sessions change
  useEffect(() => {
    if (sessions.length > 0) {
      fetchMonitorStats();
    }
  }, [sessions]);
  
  const filteredSessions = sessions.map(session => ({
    ...session,
    status: session.message || session.status || ''
  })).filter(session => {
    const searchLower = search.toLowerCase();
    const matchesSearch = session.sessionId.toLowerCase().includes(searchLower) ||
                         (session.sessionName && session.sessionName.toLowerCase().includes(searchLower));
    return (
      matchesSearch &&
      (statusFilter === 'all' || session.status === statusFilter)
    );
  }).sort((a, b) => {
    // Primary session always goes first
    const aIsPrimary = rootSessionId && a.sessionId === rootSessionId;
    const bIsPrimary = rootSessionId && b.sessionId === rootSessionId;
    
    if (aIsPrimary && !bIsPrimary) return -1;
    if (!aIsPrimary && bIsPrimary) return 1;
    
    // Sort by creation date (oldest first)
    const aCreated = new Date(a.createdAt || 0).getTime();
    const bCreated = new Date(b.createdAt || 0).getTime();
    return aCreated - bCreated;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
          WhatsApp Session Management
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Create, monitor, and manage WhatsApp API sessions for seamless communication
        </p>
      </div>      {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg dark:shadow-gray-900/20 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sessions</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{sessionStats.total || sessions.length}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg dark:shadow-gray-900/20 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Connected</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {sessionStats.connected || sessions.filter(s => s.isConnected || s.status === 'session_connected').length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg dark:shadow-gray-900/20 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Needs QR</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {sessionStats.needsQR || sessions.filter(s => s.needsQR || s.status === 'qr_generated').length}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                  <Code className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg dark:shadow-gray-900/20 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Disconnected</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {sessionStats.disconnected || sessions.filter(s => s.status === 'session_not_connected' || s.status === 'terminated').length}
                  </p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>{/* Main Management Card */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg dark:shadow-gray-900/20">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-800 dark:text-gray-200">Session Management</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">Create and manage WhatsApp API sessions</CardDescription>
                </div>
              </div>              <div className="flex items-center gap-2">
                <Input
                  placeholder="Session ID (required)"
                  value={newSessionId}
                  onChange={e => setNewSessionId(e.target.value)}
                  className="w-40 border-gray-200 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <Input
                  placeholder="Session Name (optional)"
                  value={newSessionName}
                  onChange={e => setNewSessionName(e.target.value)}
                  className="w-40 border-gray-200 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  title="If not provided, will use Session ID as name"
                />                <Button 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white shadow-lg" 
                  onClick={handleCreateSession}
                >
                  <Plus className="h-4 w-4 mr-2" /> 
                  New Session
                </Button>
                <Button
                  variant={realTimeUpdates ? "default" : "outline"}
                  onClick={() => setRealTimeUpdates(!realTimeUpdates)}
                  className="ml-2"
                >
                  <Activity className={`h-4 w-4 mr-2 ${realTimeUpdates ? 'animate-pulse' : ''}`} />
                  Real-time {realTimeUpdates ? 'ON' : 'OFF'}
                </Button>
              </div>
            </div>
          </CardHeader>          <CardContent className="p-6">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />                <Input
                  type="search"
                  placeholder="Search sessions by ID or name..."
                  className="pl-10 border-gray-200 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] border-gray-200 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <SelectItem value="all" className="text-gray-900 dark:text-gray-100">All Statuses</SelectItem>
                    <SelectItem value="session_connected" className="text-gray-900 dark:text-gray-100">Connected</SelectItem>
                    <SelectItem value="session_not_connected" className="text-gray-900 dark:text-gray-100">Disconnected</SelectItem>
                    <SelectItem value="pending" className="text-gray-900 dark:text-gray-100">Pending</SelectItem>
                    <SelectItem value="started" className="text-gray-900 dark:text-gray-100">Started</SelectItem>
                    <SelectItem value="starting" className="text-gray-900 dark:text-gray-100">Starting</SelectItem>
                    <SelectItem value="terminated" className="text-gray-900 dark:text-gray-100">Terminated</SelectItem>
                    <SelectItem value="error" className="text-gray-900 dark:text-gray-100">Error</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="shrink-0 border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 bg-white dark:bg-gray-700" 
                  onClick={fetchSessions}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
                  <span className="sr-only">Refresh</span>
                </Button>              </div>
            </div>
            {/* Sessions Table */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/80 dark:bg-gray-700/80">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Session Info</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User & API Key</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Updated</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredSessions.map((session) => (
                      <tr key={session.sessionId} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{session.sessionId}</span>
                            {rootSessionId && session.sessionId === rootSessionId && (
                              <Badge className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                                <Star className="w-3 h-3 mr-1" />
                                Primary
                              </Badge>
                            )}
                          </div>
                          {session.sessionName && session.sessionName !== session.sessionId && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Name: {session.sessionName}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">                        <div className="flex flex-col gap-1">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            User: {session.userName || 'Unknown'}
                          </div>
                          {session.userApiKey && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                              API: {session.userApiKey.substring(0, 12)}...
                            </div>
                          )}                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">                          
                          <Badge
                            className={
                              session.isConnected || session.status === 'session_connected'
                                ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700'
                                : session.isStopped || session.status === 'stopped'
                                ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-700'
                                : session.needsQR || session.status === 'qr_generated'
                                ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700'
                                : session.isLoading || session.status === 'loading' || session.status === 'connecting'
                                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700'
                                : session.hasError || session.status === 'auth_failure' || session.status === 'error'
                                ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700'
                                : session.status === 'session_not_connected' || session.status === 'disconnected'
                                ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700'
                                : session.status === 'terminated'
                                ? 'bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                                : 'bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                            }
                          >
                            {session.isConnected || session.status === 'session_connected' ? (
                              <><CheckCircle className="w-3 h-3 mr-1" />Connected</>
                            ) : session.isStopped || session.status === 'stopped' ? (
                              <><Clock className="w-3 h-3 mr-1" />Stopped</>
                            ) : session.needsQR || session.status === 'qr_generated' ? (
                              <><Code className="w-3 h-3 mr-1" />Needs QR</>
                            ) : session.isLoading || session.status === 'loading' || session.status === 'connecting' ? (
                              <><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Loading</>
                            ) : session.hasError || session.status === 'auth_failure' ? (
                              <><AlertCircle className="w-3 h-3 mr-1" />Auth Failed</>
                            ) : session.status === 'session_not_connected' || session.status === 'disconnected' ? (
                              <><Clock className="w-3 h-3 mr-1" />Disconnected</>
                            ) : session.status === 'terminated' ? (
                              <><AlertCircle className="w-3 h-3 mr-1" />Terminated</>
                            ) : (
                              <>{session.status || 'Unknown'}</>
                            )}
                          </Badge>
                          {session.message && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 max-w-32 truncate" title={session.message}>
                              {session.message}
                            </span>                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {session.updatedAt ? new Date(session.updatedAt).toLocaleString() : 'Unknown'}                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Show QR button only if session needs QR and is not connected/stopped */}
                          {(session.needsQR || session.qr) && 
                           !session.isConnected && 
                           session.status !== 'session_connected' && 
                           session.status !== 'stopped' && 
                           !session.isStopped && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewQr(session.sessionId)}
                              className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                            >
                              <Code className="h-4 w-4 mr-1" />
                              QR
                            </Button>
                          )}                          {/* Show Status/QR button - but for connected sessions, show status info only */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewQr(session.sessionId)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          >
                            <Activity className="h-4 w-4 mr-1" />
                            {session.isConnected || session.status === 'session_connected' ? 'Info' : 'Status'}
                          </Button>
                          
                          {/* Conditional Stop/Start Buttons */}
                          {session.status === 'stopped' || session.isStopped ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStartStoppedSession(session.sessionId)}
                              className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Start
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStopSession(session.sessionId)}
                                className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                              >
                                <Pause className="h-4 w-4 mr-1" />
                                Stop
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRestart(session.sessionId)}
                                className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                              >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Restart
                              </Button>
                            </>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTerminate(session.sessionId)}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Terminate
                          </Button>
                        </div>                      </td>
                    </tr>
                  ))}
</tbody>
                </table>
                {filteredSessions.length === 0 && (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No sessions found</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Create a new session to get started</p>
                  </div>                )}
              </div>
            </div>
            {/* Footer Stats */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing <strong>{filteredSessions.length}</strong> of <strong>{sessions.length}</strong> sessions
              </div>
              <div className="flex items-center gap-2">
                {notificationSession && (
                  <Badge className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
                    Notifications: {notificationSession}
                  </Badge>
                )}
              </div>            </div>
          </CardContent>
        </Card>
        
      {/* Session Auto-Monitor Card */}
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg dark:shadow-gray-900/20">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>                <CardTitle className="text-lg text-gray-800 dark:text-gray-200">Session Auto-Monitor</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Automatically stops sessions that fail to connect within 10 minutes (can be restarted)
                </CardDescription>
              </div>
            </div>
            <Button 
              onClick={handleSessionMonitor}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 dark:from-purple-500 dark:to-pink-500 dark:hover:from-purple-600 dark:hover:to-pink-600 text-white shadow-lg"
            >
              <Play className="h-4 w-4 mr-2" />
              Run Monitor Now
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Terminated</p>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {sessionMonitorStats.monitoredSessions}
                  </p>
                </div>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Check</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {sessionMonitorStats.lastCheck 
                      ? new Date(sessionMonitorStats.lastCheck).toLocaleTimeString()
                      : 'Never'
                    }
                  </p>
                </div>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between">                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Auto-Monitor</p>
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                    Enabled (10min terminate)
                  </p>
                </div>
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
          </div>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>How it works:</strong> The monitor automatically checks for sessions stuck in connecting states 
              (qr_generated, loading, connecting, disconnected) for more than 10 minutes and completely terminates them from the WhatsApp server to free up resources.
            </p>
          </div>
        </CardContent>
      </Card>
        
        {/* QR Code Modal */}
        <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
          <DialogContent className="max-w-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-center text-gray-900 dark:text-gray-100">Session Status & QR Code</DialogTitle>
              <p className="text-center text-sm text-gray-600 dark:text-gray-400 font-mono">{qrSessionId}</p>
            </DialogHeader>
            <div className="flex flex-col items-center space-y-4">
              {/* Session Status Info */}
              {qrSessionId && (
          <div className="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            {(() => {
              const session = sessions.find(s => s.sessionId === qrSessionId);
              if (!session) return <p className="text-sm text-gray-500">Session not found</p>;
              
              return (
                <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status:</span>
              <Badge className={
                session.isConnected ? 'bg-green-100 text-green-800' :
                session.needsQR ? 'bg-orange-100 text-orange-800' :
                session.isLoading ? 'bg-blue-100 text-blue-800' :
                session.hasError ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }>
                {session.isConnected ? 'Connected' :
                 session.needsQR ? 'Needs QR' :
                 session.isLoading ? 'Loading' :
                 session.hasError ? 'Error' :
                 session.status || 'Unknown'}
              </Badge>
            </div>
            {session.message && (
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Message:</span>
                <span className="text-sm text-gray-800 dark:text-gray-200 text-right max-w-48">{session.message}</span>
              </div>
            )}
            {session.updatedAt && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Updated:</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{new Date(session.updatedAt).toLocaleString()}</span>
              </div>
            )}
                </div>
              );
            })()}
          </div>
              )}              {/* QR Code Display & Actions: Only show if not connected and not stopped */}
              {(() => {
          const session = sessions.find(s => s.sessionId === qrSessionId);
          if (session?.isConnected || session?.status === 'session_connected') {
            return (
              <div className="w-full text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-2" />
                <p className="text-lg font-semibold text-green-700 dark:text-green-300">Session Connected</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">No QR code needed.</p>
              </div>
            );
          }
          
          if (session?.status === 'stopped' || session?.isStopped) {
            return (
              <div className="w-full text-center">
                <Clock className="w-16 h-16 text-purple-500 mx-auto mb-2" />
                <p className="text-lg font-semibold text-purple-700 dark:text-purple-300">Session Stopped</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Use Start button to restart the session.</p>
              </div>
            );
          }
          
          return (
            <>
              {qrImage ? (
                <div className="p-4 bg-white dark:bg-gray-700 rounded-lg shadow-lg">
            <Image
              src={qrImage}
              alt="QR Code"
              width={256}
              height={256}
              className="w-64 h-64 border rounded"
            />
                </div>
              ) : (
                <div className="w-64 h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2 animate-spin" />
              <p className="text-gray-500 dark:text-gray-400">Loading QR Code...</p>
            </div>
                </div>
              )}
              {/* QR Actions */}
              <div className="flex gap-2">
                <Button
            variant="outline"
            size="sm"
            onClick={() => qrSessionId && handleRefreshQr(qrSessionId)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh QR
                </Button>
                <Button
            variant="outline"
            size="sm"
            onClick={() => qrSessionId && fetchSessions()}
            className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                >
            <Activity className="w-4 h-4 mr-1" />
            Refresh Status
                </Button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-xs">
                Scan this QR code with your WhatsApp mobile app to connect this session.
              </p>
            </>
          );
              })()}
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
}
