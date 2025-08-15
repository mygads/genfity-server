"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  RefreshCw, 
  MessageSquare, 
  User, 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  PlayCircle,
  Users
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SessionStats {
  totalMessagesSent: number;
  totalMessagesFailed: number;
  totalMessages: number;
  successRate: string;
  lastMessageSentAt: string | null;
  lastMessageFailedAt: string | null;
}

interface WhatsAppSession {
  sessionId: string;
  sessionName: string | null;
  status: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    phone: string | null;
  };
  stats?: {
    totalMessagesSent: number;
    totalMessagesFailed: number;
    totalMessages: number;
    successRate: string;
    lastMessageSentAt: string | null;
    lastMessageFailedAt: string | null;
  };
}

interface MessageTest {
  id: string;
  timestamp: string;
  sessionId: string;
  sessionName: string | null;
  to: string;
  message: string;
  status: 'sending' | 'sent' | 'failed';
  response?: any;
  error?: string;
}

export default function WhatsAppPlaygroundPage() {
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Message form state
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('text');
  const [sending, setSending] = useState(false);
  
  // Test history
  const [testHistory, setTestHistory] = useState<MessageTest[]>([]);

  // Phone number normalization function
  const normalizePhoneNumber = (phoneNumber: string) => {
    // Remove all non-digit characters
    let normalized = phoneNumber.replace(/\D/g, '');
    
    // Handle different Indonesian phone number formats
    if (normalized.startsWith('08')) {
      // Convert 08xxx to 628xxx
      normalized = '62' + normalized.substring(1);
    } else if (normalized.startsWith('8') && normalized.length >= 9) {
      // Convert 8xxx to 628xxx (assuming Indonesian number)
      normalized = '62' + normalized;
    } else if (normalized.startsWith('62')) {
      // Already in correct format
      normalized = normalized;
    } else if (normalized.startsWith('0')) {
      // Remove leading 0 and add 62
      normalized = '62' + normalized.substring(1);
    }
    
    return normalized;
  };
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/whatsapp/playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_sessions' })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }
      
      const result = await response.json();
      setSessions(result.data || []);
      
      // Auto-select first connected session
      const connectedSession = (result.data || []).find((s: WhatsAppSession) => s.status.toLowerCase() === 'connected');
      if (connectedSession && !selectedSessionId) {
        setSelectedSessionId(connectedSession.sessionId);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [selectedSessionId]);

  const sendTestMessage = async () => {
    if (!selectedSessionId || !phoneNumber || !message) {
      setError('Please fill all required fields');
      return;
    }

    // Normalize phone number
    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
    
    // Validate normalized phone number
    if (!normalizedPhoneNumber.startsWith('62') || normalizedPhoneNumber.length < 10) {
      setError('Please enter a valid Indonesian phone number (e.g., 08123456789, +6281234567890, or 6281234567890)');
      return;
    }

    const testId = `test_${Date.now()}`;
    const newTest: MessageTest = {
      id: testId,
      timestamp: new Date().toISOString(),
      sessionId: selectedSessionId,
      sessionName: sessions.find(s => s.sessionId === selectedSessionId)?.sessionName || null,
      to: normalizedPhoneNumber,
      message,
      status: 'sending',
    };

    setTestHistory(prev => [newTest, ...prev]);
    setSending(true);
    setError(null);    try {
      const response = await fetch('/api/admin/whatsapp/playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          phoneNumber: normalizedPhoneNumber,
          message,
          sessionId: selectedSessionId,
        }),
      });

      const result = await response.json();      if (response.ok && result.success) {
        // Update test history with success
        setTestHistory(prev => 
          prev.map(test => 
            test.id === testId 
              ? { ...test, status: 'sent', response: result.data }
              : test
          )
        );
        
        // Clear form
        setPhoneNumber('');
        setMessage('');
        
        // Refresh sessions to get updated stats
        fetchSessions();
          } else {
        throw new Error(result.message || 'Failed to send message');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      
      // Update test history with failure
      setTestHistory(prev => 
        prev.map(test => 
          test.id === testId 
            ? { ...test, status: 'failed', error: errorMessage }
            : test
        )
      );
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'disconnected':
        return 'bg-red-100 text-red-800';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTestStatusIcon = (status: string) => {
    switch (status) {
      case 'sending':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="text-lg">Loading WhatsApp Playground...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <PlayCircle className="h-8 w-8 mr-3 text-blue-600" />
            WhatsApp Playground
          </h1>          <p className="text-muted-foreground mt-2">
            Test WhatsApp sessions and send real messages to WhatsApp numbers
          </p>
        </div>
        <Button onClick={fetchSessions} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Sessions
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Sessions List and Message Form */}
        <div className="space-y-6">
          {/* Sessions Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Available Sessions ({sessions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {sessions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No sessions available</p>
                ) : (
                  sessions.map((session) => (
                    <div 
                      key={session.sessionId} 
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedSessionId === session.sessionId 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedSessionId(session.sessionId)}
                    >
                      <div className="flex items-center justify-between">                        <div>
                          <p className="font-medium">
                            {session.sessionName || session.sessionId}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Owner: {session.user.name || session.user.phone}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Messages: {session.stats?.totalMessagesSent || 0} sent / {session.stats?.totalMessagesFailed || 0} failed
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <Badge className={getStatusColor(session.status)}>
                            {session.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Message Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Send className="h-5 w-5 mr-2" />
                Send Test Message
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Selected Session</label>
                <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a session" />
                  </SelectTrigger>
                  <SelectContent>                  {sessions
                      .filter(s => s.status.toLowerCase() === 'connected')
                      .map((session) => (
                        <SelectItem key={session.sessionId} value={session.sessionId}>
                          {session.sessionName || session.sessionId} ({session.user?.name || session.user?.phone})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Phone Number</label>
                <Input
                  placeholder="e.g., 08123456789, +6281234567890, 6281234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Supports formats: 08xx, +62xx, 62xx, or 8xx
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Message Type</label>
                <Select value={messageType} onValueChange={setMessageType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  placeholder="Enter your test message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                onClick={sendTestMessage} 
                disabled={sending || !selectedSessionId || !phoneNumber || !message}
                className="w-full"
              >
                {sending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {sending ? 'Sending...' : 'Send Test Message'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Test History */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Test History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {testHistory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No tests performed yet</p>
                ) : (
                  testHistory.map((test) => (
                    <div key={test.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            {getTestStatusIcon(test.status)}
                            <span className="font-medium">
                              {test.sessionName || test.sessionId}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              → {test.to}
                            </span>
                          </div>
                          <p className="text-sm mt-1 text-muted-foreground">
                            {test.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(test.timestamp).toLocaleString()}
                          </p>
                            {test.status === 'sent' && test.response && (
                            <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                              <p className="text-green-800">
                                ✓ Message sent successfully to WhatsApp
                              </p>
                              <p className="text-green-600">
                                Sent at: {test.response.sentAt ? new Date(test.response.sentAt).toLocaleString() : 'Unknown'}
                              </p>
                            </div>
                          )}
                          
                          {test.status === 'failed' && test.error && (
                            <div className="mt-2 p-2 bg-red-50 rounded text-xs">
                              <p className="text-red-800">
                                ✗ {test.error}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Session Statistics */}
      {selectedSessionId && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Session Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const session = sessions.find(s => s.sessionId === selectedSessionId);
              if (!session) return <p>Session not found</p>;
              
              return (                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{session.stats?.totalMessagesSent || 0}</p>
                    <p className="text-sm text-muted-foreground">Messages Sent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{session.stats?.totalMessagesFailed || 0}</p>
                    <p className="text-sm text-muted-foreground">Messages Failed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{(session.stats?.totalMessagesSent || 0) + (session.stats?.totalMessagesFailed || 0)}</p>
                    <p className="text-sm text-muted-foreground">Total Messages</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {(() => {
                        const total = (session.stats?.totalMessagesSent || 0) + (session.stats?.totalMessagesFailed || 0);
                        const successRate = total > 0 ? ((session.stats?.totalMessagesSent || 0) / total * 100).toFixed(2) : '0.00';
                        return successRate;
                      })()}%
                    </p>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}      {/* Integration Notice */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-green-800">Live WhatsApp Integration</h3>
              <p className="text-sm text-green-700 mt-1">
                This playground is connected to your WhatsApp server and will send real messages to WhatsApp numbers. 
                Messages will be tracked and statistics will be updated in real-time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
