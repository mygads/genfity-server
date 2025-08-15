'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, MessageSquare, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface UserStats {
  totalMessagesSent: number;
  totalMessagesFailed: number;
  totalMessages: number;
  successRate: string;
  lastMessageSentAt: string | null;
  lastMessageFailedAt: string | null;
}

interface SessionStats {
  totalMessagesSent: number;
  totalMessagesFailed: number;
  totalMessages: number;
  successRate: string;
  lastMessageSentAt: string | null;
  lastMessageFailedAt: string | null;
}

interface SessionListItem {
  sessionId: string;
  sessionName: string | null;
  sessionStatus: string;
  isTerminated: boolean;
  sessionCreatedAt: string;
  totalMessagesSent: number;
  totalMessagesFailed: number;
  totalMessages: number;
  successRate: string;
  lastMessageSentAt: string | null;
  lastMessageFailedAt: string | null;
  lastActivity: string;
}

interface MessageStats {
  userStats: UserStats;
  sessionStats?: SessionStats;
  sessionsList: SessionListItem[];
}

interface Props {
  sessionId?: string;
}

export default function WhatsAppMessageStats({ sessionId }: Props) {
  const [stats, setStats] = useState<MessageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (sessionId) params.append('sessionId', sessionId);
      
      const response = await fetch(`/api/whatsapp/message-stats?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch message statistics');
      }
      
      const data = await response.json();
      setStats(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const resetSessionCounters = async () => {
    if (!sessionId) return;
    
    try {
      const response = await fetch('/api/whatsapp/session/reset-counters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to reset session counters');
      }
      
      // Refresh stats after reset
      fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset counters');
    }
  };
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const getStatusColor = (status: string) => {
    switch (status) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading message statistics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchStats} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!stats) {
    return <div className="p-4 text-center">No data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* User Total Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages Sent</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.userStats.totalMessagesSent}</div>
            <p className="text-xs text-muted-foreground">
              Success Rate: {stats.userStats.successRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Messages</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.userStats.totalMessagesFailed}</div>
            <p className="text-xs text-muted-foreground">
              Total failures across all sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Message</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {stats.userStats.lastMessageSentAt 
                ? new Date(stats.userStats.lastMessageSentAt).toLocaleString()
                : 'No messages sent'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session Statistics (if sessionId provided) */}
      {sessionId && stats.sessionStats && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Current Session Statistics</h3>
            <Button onClick={resetSessionCounters} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Session Counters
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Session Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.sessionStats.totalMessagesSent}</div>
                <p className="text-xs text-muted-foreground">
                  Success Rate: {stats.sessionStats.successRate}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Session Failures</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.sessionStats.totalMessagesFailed}</div>
                <p className="text-xs text-muted-foreground">
                  This session only
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Session Message</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {stats.sessionStats.lastMessageSentAt 
                    ? new Date(stats.sessionStats.lastMessageSentAt).toLocaleString()
                    : 'No messages in this session'
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* All Sessions List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">All Sessions</CardTitle>
          <Button onClick={fetchStats} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.sessionsList.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No sessions found</p>
            ) : (
              stats.sessionsList.map((session) => (
                <div key={session.sessionId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="font-medium">
                        {session.sessionName || session.sessionId}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(session.sessionCreatedAt).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Last Activity: {new Date(session.lastActivity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {session.totalMessagesSent} sent / {session.totalMessagesFailed} failed
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Success Rate: {session.successRate}%
                      </p>
                    </div>
                    
                    <div className="flex flex-col space-y-1">
                      <Badge className={getStatusColor(session.sessionStatus)}>
                        {session.sessionStatus}
                      </Badge>
                      {session.isTerminated && (
                        <Badge variant="destructive">
                          Terminated
                        </Badge>
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
  );
}
