// Session Monitor - Auto-terminate sessions that fail to connect within timeout
// This monitor terminates sessions from WhatsApp server but keeps database records
// so sessions can be restarted without creating new records
// 
// IMPORTANT: Uses createdAt for timeout calculation, not updatedAt, because
// QR webhook updates constantly reset updatedAt which would prevent timeout detection
import { prisma } from '@/lib/prisma';
import { waFetch } from '@/lib/whatsapp-services';

interface SessionToMonitor {
  sessionId: string;
  status: string;
  updatedAt: Date;
  createdAt: Date;
}

const TIMEOUT_MINUTES = 1;
const TIMEOUT_MS = TIMEOUT_MINUTES * 60 * 1000; // 1 minutes in milliseconds

/**
 * Check and terminate sessions that have been waiting for connection too long
 * This function terminates sessions from WhatsApp server but preserves database records
 * so the sessions can be restarted later without creating new session IDs
 * 
 * Logic: Uses createdAt instead of updatedAt because QR webhook updates constantly 
 * reset updatedAt, preventing proper timeout detection. We want to timeout sessions
 * that don't connect within X minutes from initial session creation, regardless 
 * of QR code updates from webhooks.
 */
export async function monitorAndStopStaleSessions(): Promise<{
  checked: number;
  stopped: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let checked = 0;
  let stopped = 0;
  try {
    // Get sessions that might need to be stopped
    // Use createdAt instead of updatedAt because QR webhook updates reset updatedAt
    const cutoffTime = new Date(Date.now() - TIMEOUT_MS);
      const staleSessions = await prisma.whatsAppSession.findMany({
      where: {
        OR: [
          // Sessions that are stuck in connecting states and need to be stopped
          {
            status: 'qr_generated',
            createdAt: {
              lt: cutoffTime
            }
          },
          {
            status: 'loading',
            createdAt: {
              lt: cutoffTime
            }
          },
          {
            status: 'connecting',
            createdAt: {
              lt: cutoffTime
            }
          },
          {
            status: 'session_not_connected',
            createdAt: {
              lt: cutoffTime
            }
          },
          {
            status: 'disconnected',
            createdAt: {
              lt: cutoffTime
            }
          },          // Include sessions that are 'stopped' but not yet terminated from server
          {
            status: 'stopped',
            createdAt: {
              lt: cutoffTime
            },
            // Only include stopped sessions that haven't been terminated from server yet
            isTerminated: false
          }
        ],
        // Exclude only connected or final error states
        NOT: {
          status: {
            in: ['session_connected', 'auth_failure', 'error', 'terminated']
          }
        }
      },
      select: {        sessionId: true,
        status: true,
        updatedAt: true,
        createdAt: true,
        sessionName: true,
        isTerminated: true,
        message: true
      }
    });

    checked = staleSessions.length;
    console.log(`[SESSION_MONITOR] Found ${staleSessions.length} stale sessions to check`);    for (const session of staleSessions) {
      try {
        const timeElapsed = Date.now() - session.createdAt.getTime();
        const minutesElapsed = Math.floor(timeElapsed / 60000);
          // Handle sessions that are already stopped in database differently
        if (session.status === 'stopped') {
          // Check if this session was already terminated from server
          if (session.isTerminated) {
            console.log(`[SESSION_MONITOR] Session ${session.sessionId} already terminated from server - skipping`);
            continue;
          }
          
          console.log(`[SESSION_MONITOR] Session ${session.sessionId} stopped in DB but not server-terminated - attempting server termination`);
          
          // For stopped sessions, try to terminate from WhatsApp server and mark as terminated
          try {
            await waFetch(`/session/terminate/${session.sessionId}`, 'GET');
            console.log(`[SESSION_MONITOR] Successfully terminated stopped session ${session.sessionId} from WhatsApp server`);
            
            // Update isTerminated to prevent future redundant calls
            await prisma.whatsAppSession.update({
              where: { sessionId: session.sessionId },
              data: {
                isTerminated: true,
                message: `${session.message || 'Session stopped'} (server terminated)`,
                updatedAt: new Date()
              }
            });
            
          } catch (waError) {
            console.warn(`[SESSION_MONITOR] WhatsApp service terminate failed for stopped session ${session.sessionId}:`, waError);
            // Still mark as terminated to avoid repeated tries (WhatsApp service might be down)
            await prisma.whatsAppSession.update({
              where: { sessionId: session.sessionId },
              data: {
                isTerminated: true,
                message: `${session.message || 'Session stopped'} (terminate failed but marked to prevent retry)`,
                updatedAt: new Date()
              }
            });
          }
          stopped++;
          continue;
        }
        
        console.log(`[SESSION_MONITOR] Stopping stale session ${session.sessionId} (status: ${session.status}, elapsed since creation: ${minutesElapsed}m)`);
          // Try to terminate the session via WhatsApp service first (free up server resources)
        try {
          await waFetch(`/session/terminate/${session.sessionId}`, 'GET');
          console.log(`[SESSION_MONITOR] Successfully terminated session ${session.sessionId} via WhatsApp service`);
          
          // Always update database status to 'stopped' and mark as terminated
          await prisma.whatsAppSession.update({
            where: { sessionId: session.sessionId },
            data: {
              status: 'stopped',
              isTerminated: true, // Mark as terminated to prevent redundant calls
              message: `Auto-stopped after ${minutesElapsed} minutes since session creation - session can be restarted`,
              qr: null, // Clear QR code
              updatedAt: new Date()
            }
          });
          
          console.log(`[SESSION_MONITOR] Session ${session.sessionId} terminated from server and marked as stopped in database`);        } catch (waError) {
          console.warn(`[SESSION_MONITOR] WhatsApp service terminate failed for ${session.sessionId}:`, waError);
          
          // If WhatsApp service fails, still mark as stopped and terminated in database
          await prisma.whatsAppSession.update({
            where: { sessionId: session.sessionId },
            data: {
              status: 'stopped',
              isTerminated: true, // Mark as terminated to prevent repeated attempts
              message: `Auto-stopped after ${minutesElapsed} minutes since session creation (WhatsApp service may be unavailable) - session can be restarted`,
              qr: null, // Clear QR code
              updatedAt: new Date()
            }
          });
          
          console.log(`[SESSION_MONITOR] Marked session ${session.sessionId} as stopped and terminated in database`);
        }
        
        stopped++;
        console.log(`[SESSION_MONITOR] Successfully processed session ${session.sessionId} - terminated from server and marked as stopped (can be restarted)`);
        
      } catch (sessionError) {
        const errorMsg = `Failed to process session ${session.sessionId}: ${sessionError}`;
        console.error(`[SESSION_MONITOR] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    console.log(`[SESSION_MONITOR] Monitor completed - Checked: ${checked}, Stopped: ${stopped}, Errors: ${errors.length}`);
    
  } catch (error) {
    const errorMsg = `Session monitor failed: ${error}`;
    console.error(`[SESSION_MONITOR] ${errorMsg}`);
    errors.push(errorMsg);
  }

  return {
    checked,
    stopped,
    errors
  };
}

/**
 * Get sessions that are currently being monitored (potentially stale)
 */
export async function getMonitoredSessions(): Promise<SessionToMonitor[]> {
  const cutoffTime = new Date(Date.now() - TIMEOUT_MS);
  
  return await prisma.whatsAppSession.findMany({
    where: {
      OR: [
        {
          status: 'qr_generated',
          createdAt: { lt: cutoffTime }
        },
        {
          status: 'loading',
          createdAt: { lt: cutoffTime }
        },
        {
          status: 'connecting',
          createdAt: { lt: cutoffTime }
        },
        {
          status: 'session_not_connected',
          createdAt: { lt: cutoffTime }
        },
        {
          status: 'disconnected',
          createdAt: { lt: cutoffTime }
        },
        // Include stopped sessions that haven't been terminated yet
        {
          status: 'stopped',
          createdAt: { lt: cutoffTime },
          isTerminated: false
        }
      ],
      NOT: {
        status: {
          in: ['session_connected', 'auth_failure', 'error', 'terminated']
        }
      }
    },
    select: {
      sessionId: true,
      status: true,
      updatedAt: true,
      createdAt: true
    }
  });
}

const sessionMonitor = {
  monitorAndStopStaleSessions,
  getMonitoredSessions,
  TIMEOUT_MINUTES
};

export default sessionMonitor;
