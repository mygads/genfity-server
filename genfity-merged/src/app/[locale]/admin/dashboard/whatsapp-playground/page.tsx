"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Send, 
  RefreshCw,
  Activity,
  CheckCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  Smartphone,
  Search,
  FileSpreadsheet,
  Settings,
  Zap,
  XCircle,
  QrCode,
  Phone
} from "lucide-react";
import { SessionManager } from '@/lib/storage';

interface PlaygroundSession {
  sessionId: string;
  sessionName: string;
  status: string;
  connected: boolean;
  loggedIn: boolean;
  jid: string | null; // WhatsApp phone number when logged in
  user?: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  // Database computed fields
  userName: string;
  userRole: string;
  userId: string | null;
  updatedAt: string;
  stats: {
    totalMessagesSent: number;
    totalMessagesFailed: number;
    totalMessages: number;
    successRate: string;
    lastMessageSentAt: string | null;
    lastMessageFailedAt: string | null;
  };
}

interface PlaygroundStats {
  totalSessions: number;
  connectedSessions: number;
  disconnectedSessions: number;
  qrRequiredSessions: number;
  totalMessages: number;
  totalSuccessfulMessages: number;
  totalFailedMessages: number;
  averageSuccessRate: number;
}

interface MessageTestResult {
  success: boolean;
  phoneNumber?: string;
  message?: string;
  sentAt?: string;
  sessionId?: string;
  error?: string;
}

export default function WhatsAppPlaygroundPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<PlaygroundSession[]>([]);
  const [stats, setStats] = useState<PlaygroundStats>({
    totalSessions: 0,
    connectedSessions: 0,
    disconnectedSessions: 0,
    qrRequiredSessions: 0,
    totalMessages: 0,
    totalSuccessfulMessages: 0,
    totalFailedMessages: 0,
    averageSuccessRate: 0
  });
  
  // UI States
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  // Message Test States
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [testPhoneNumber, setTestPhoneNumber] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<MessageTestResult | null>(null);

  // Fetch playground sessions data
  const fetchPlaygroundSessions = useCallback(async () => {
    setLoading(true);
    try {
      const token = SessionManager.getToken();
      if (!token) {
        router.push('/signin');
        return;
      }
      
      const res = await fetch("/api/admin/whatsapp/playground", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (res.status === 401) {
        SessionManager.clearSession();
        router.push('/signin');
        return;
      }
      
      const data = await res.json();
      
      if (data.success) {
        const sessionData = data.data || [];
        setSessions(sessionData);
        
        // Calculate stats
        const totalSessions = sessionData.length;
        const connectedSessions = sessionData.filter((s: PlaygroundSession) => s.connected && s.loggedIn).length;
        const disconnectedSessions = sessionData.filter((s: PlaygroundSession) => !s.connected).length;
        const qrRequiredSessions = sessionData.filter((s: PlaygroundSession) => !s.loggedIn && !s.connected).length;
        const totalMessages = sessionData.reduce((sum: number, s: PlaygroundSession) => sum + s.stats.totalMessages, 0);
        const totalSuccessful = sessionData.reduce((sum: number, s: PlaygroundSession) => sum + s.stats.totalMessagesSent, 0);
        const totalFailed = sessionData.reduce((sum: number, s: PlaygroundSession) => sum + s.stats.totalMessagesFailed, 0);
        const averageSuccessRate = sessionData.length > 0 
          ? sessionData.reduce((sum: number, s: PlaygroundSession) => sum + parseFloat(s.stats.successRate), 0) / sessionData.length
          : 0;
        
        setStats({
          totalSessions,
          connectedSessions,
          disconnectedSessions,
          qrRequiredSessions,
          totalMessages,
          totalSuccessfulMessages: totalSuccessful,
          totalFailedMessages: totalFailed,
          averageSuccessRate: Math.round(averageSuccessRate * 100) / 100
        });
      } else {
        console.error("Error fetching playground sessions:", data.error);
      }
    } catch (error) {
      console.error("Error fetching playground sessions:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Send test message
  const sendTestMessage = async () => {
    if (!selectedSessionId || !testPhoneNumber || !testMessage) {
      setLastTestResult({
        success: false,
        error: "Please fill in all fields"
      });
      return;
    }

    setSendingMessage(true);
    try {
      const token = SessionManager.getToken();
      if (!token) {
        router.push('/signin');
        return;
      }
      
      const res = await fetch("/api/admin/whatsapp/playground", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          phoneNumber: testPhoneNumber,
          message: testMessage
        })
      });
      
      if (res.status === 401) {
        SessionManager.clearSession();
        router.push('/signin');
        return;
      }
      
      const data = await res.json();
      setLastTestResult(data);
      
      if (data.success) {
        // Clear form on success
        setTestPhoneNumber("");
        setTestMessage("");
        // Refresh sessions to update stats
        fetchPlaygroundSessions();
      }
    } catch (error) {
      console.error("Error sending test message:", error);
      setLastTestResult({
        success: false,
        error: "Failed to send message"
      });
    } finally {
      setSendingMessage(false);
    }
  };

  // Initial load and auto refresh effects
  useEffect(() => {
    fetchPlaygroundSessions();
  }, [fetchPlaygroundSessions]);

  // Auto refresh functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchPlaygroundSessions, 10000); // Refresh every 10 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, fetchPlaygroundSessions]);

  // Export function
  const exportSessions = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Session ID,Session Name,Connected,Logged In,Owner Name,Owner Role,WhatsApp Number,Messages Sent,Messages Failed,Success Rate,Last Updated\n" +
      filteredSessions.map(s => 
        `${s.sessionId},"${s.sessionName}",${s.connected},${s.loggedIn},"${s.userName}",${s.userRole},"${s.jid || 'Not connected'}",${s.stats.totalMessagesSent},${s.stats.totalMessagesFailed},${s.stats.successRate}%,${s.updatedAt}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `whatsapp_playground_sessions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.sessionName.toLowerCase().includes(search.toLowerCase()) || 
                         session.sessionId.toLowerCase().includes(search.toLowerCase()) ||
                         (session.userName && session.userName.toLowerCase().includes(search.toLowerCase())) ||
                         (session.jid && session.jid.toLowerCase().includes(search.toLowerCase()));
    
    // Filter by status
    let matchesStatus = true;
    if (statusFilter !== "all") {
      if (statusFilter === "connected") {
        matchesStatus = session.connected && session.loggedIn;
      } else if (statusFilter === "disconnected") {
        matchesStatus = !session.connected;
      } else if (statusFilter === "qr_required") {
        matchesStatus = !session.loggedIn && !session.connected;
      }
    }
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (session: PlaygroundSession) => {
    if (session.connected && session.loggedIn) {
      return (
        <Badge className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700">
          <CheckCircle className="w-3 h-3 mr-1" />
          Connected
        </Badge>
      );
    } else if (!session.connected) {
      return (
        <Badge className="bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700">
          <XCircle className="w-3 h-3 mr-1" />
          Disconnected
        </Badge>
      );
    } else if (!session.loggedIn) {
      return (
        <Badge className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700">
          <QrCode className="w-3 h-3 mr-1" />
          QR Required
        </Badge>
      );
    } else {
      return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">WhatsApp Playground</h1>
        <p className="text-muted-foreground">
          Test WhatsApp sessions and send messages for debugging purposes
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Total Sessions</p>
                <p className="text-2xl font-bold">{stats.totalSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-4 w-4 text-green-600" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Connected</p>
                <p className="text-2xl font-bold text-green-600">{stats.connectedSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-4 w-4 text-red-600" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Disconnected</p>
                <p className="text-2xl font-bold text-red-600">{stats.disconnectedSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <QrCode className="h-4 w-4 text-blue-600" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">QR Required</p>
                <p className="text-2xl font-bold text-blue-600">{stats.qrRequiredSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <CardTitle>Session Testing</CardTitle>
          <CardDescription>
            Monitor sessions and test message sending functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sessions by name, ID, owner, or WhatsApp number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="connected">Connected</SelectItem>
                  <SelectItem value="disconnected">Disconnected</SelectItem>
                  <SelectItem value="qr_required">QR Required</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportSessions}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button
                onClick={() => setShowTestDialog(true)}
                disabled={filteredSessions.length === 0}
              >
                <Send className="mr-2 h-4 w-4" />
                Test Message
              </Button>
            </div>
          </div>

          {/* Sessions Table */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Loading sessions...</span>
              </div>
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
                  <TableHead>Status</TableHead>
                  <TableHead>WhatsApp Number</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Success Rate</TableHead>
                  <TableHead>Last Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((session) => (
                  <TableRow key={session.sessionId}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{session.sessionName}</div>
                        <div className="text-xs text-muted-foreground font-mono">{session.sessionId}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{session.userName}</div>
                        <div className="text-xs text-muted-foreground capitalize">{session.userRole}</div>
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
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="text-green-600">{session.stats.totalMessagesSent}</span>
                          <span className="text-muted-foreground"> / </span>
                          <span className="text-red-600">{session.stats.totalMessagesFailed}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Total: {session.stats.totalMessages}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{session.stats.successRate}%</div>
                        <div className="text-xs text-muted-foreground">
                          {session.stats.lastMessageSentAt 
                            ? `Last: ${new Date(session.stats.lastMessageSentAt).toLocaleDateString()}`
                            : 'No messages'
                          }
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{new Date(session.updatedAt).toLocaleString()}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Footer Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 pt-6 border-t">
            <div className="text-sm text-muted-foreground">
              Showing <strong>{filteredSessions.length}</strong> of <strong>{sessions.length}</strong> sessions
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-muted-foreground">
                Success: <span className="font-semibold text-green-600">
                  {stats.totalSuccessfulMessages}
                </span>
              </div>
              <div className="text-muted-foreground">
                Failed: <span className="font-semibold text-red-600">
                  {stats.totalFailedMessages}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message Test Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Test WhatsApp Message
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Session Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Select Session</label>
              <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a session to test" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.filter(s => s.connected).map((session) => (
                    <SelectItem key={session.sessionId} value={session.sessionId}>
                      {session.sessionName} ({session.userName} - {session.userRole})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Phone Number Input */}
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <Input
                type="tel"
                placeholder="628123456789 (Indonesian format)"
                value={testPhoneNumber}
                onChange={(e) => setTestPhoneNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use Indonesian format starting with 628
              </p>
            </div>

            {/* Message Input */}
            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <Textarea
                placeholder="Enter your test message here..."
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={4}
              />
            </div>

            {/* Last Test Result */}
            {lastTestResult && (
              <div className={`p-4 rounded-lg border ${
                lastTestResult.success 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center gap-2 text-sm">
                  {lastTestResult.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="font-medium">
                    {lastTestResult.success ? 'Message Sent Successfully!' : 'Failed to Send Message'}
                  </span>
                </div>
                {lastTestResult.error && (
                  <p className="text-sm mt-1 text-red-600 dark:text-red-400">
                    {lastTestResult.error}
                  </p>
                )}
                {lastTestResult.success && lastTestResult.sentAt && (
                  <p className="text-xs mt-1 text-muted-foreground">
                    Sent at: {new Date(lastTestResult.sentAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTestDialog(false);
                  setLastTestResult(null);
                  setTestPhoneNumber("");
                  setTestMessage("");
                  setSelectedSessionId("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={sendTestMessage}
                disabled={sendingMessage || !selectedSessionId || !testPhoneNumber || !testMessage}
              >
                {sendingMessage ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Test Message
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
