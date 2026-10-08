import { useEffect, useRef, useState, useCallback } from 'react';
import { Notification, Role } from '../types';
import { notificationService } from '../services/notificationService';

export type ConnectionStatus =
  | 'connecting'
  | 'open'
  | 'closing'
  | 'closed'
  | 'polling';

export interface UseRealtimeNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  connectionStatus: ConnectionStatus;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const MAX_FAILS_BEFORE_POLLING = 3;
const MAX_BACKOFF_MS = 15000;
const POLLING_INTERVAL_MS = 15000;
const HIDDEN_BACKOFF_MS = 60000;

function getWsUrl(userId: string): string | null {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  if (!apiBase) return null;
  const httpBase = apiBase.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
  if (httpBase.startsWith('https://')) {
    return `wss://${httpBase.slice(8)}/ws/notifications/${encodeURIComponent(userId)}`;
  }
  if (httpBase.startsWith('http://')) {
    return `ws://${httpBase.slice(7)}/ws/notifications/${encodeURIComponent(userId)}`;
  }
  return `ws://localhost:8000/ws/notifications/${encodeURIComponent(userId)}`;
}

export function useRealtimeNotifications(
  userId: string,
  userRole: Role,
  enabled: boolean = true,
): UseRealtimeNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('closed');

  const wsRef = useRef<WebSocket | null>(null);
  const failCountRef = useRef<number>(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const pollingTimerRef = useRef<number | null>(null);
  const destroyedRef = useRef<boolean>(false);
  const userIdRef = useRef<string>(userId);
  const userRoleRef = useRef<Role>(userRole);

  useEffect(() => {
    userIdRef.current = userId;
    userRoleRef.current = userRole;
  }, [userId, userRole]);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const clearPollingTimer = useCallback(() => {
    if (pollingTimerRef.current !== null) {
      window.clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    clearPollingTimer();
    setConnectionStatus('polling');
    failCountRef.current = MAX_FAILS_BEFORE_POLLING;
    const tick = async () => {
      if (destroyedRef.current || document.hidden) return;
      try {
        const list = await notificationService.getNotifications(userIdRef.current, userRoleRef.current);
        setNotifications(list || []);
        setUnreadCount((list || []).filter((n) => !n.read).length);
      } catch (err) {
        // ignore
      }
    };
    tick();
    pollingTimerRef.current = window.setInterval(() => {
      void tick();
    }, POLLING_INTERVAL_MS);
  }, [clearPollingTimer]);

  const refresh = useCallback(async () => {
    try {
      const list = await notificationService.getNotifications(userIdRef.current, userRoleRef.current);
      setNotifications(list || []);
      setUnreadCount((list || []).filter((n) => !n.read).length);
    } catch (err) {
      // ignore
    }
  }, []);

  const tryConnectWs = useCallback(() => {
    if (destroyedRef.current || !enabled) return;
    if (pollingTimerRef.current !== null) return;
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const url = getWsUrl(userIdRef.current);
    if (!url) {
      startPolling();
      return;
    }

    setConnectionStatus('connecting');
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(url);
    } catch (err) {
      failCountRef.current += 1;
      scheduleReconnect();
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => {
      if (destroyedRef.current) return;
      failCountRef.current = 0;
      setConnectionStatus('open');
      void refresh();
    };

    ws.onmessage = (ev) => {
      if (destroyedRef.current || typeof ev.data !== 'string') return;
      try {
        const msg = JSON.parse(ev.data);
        if (!msg || typeof msg !== 'object') return;
        if (msg.type === 'hello') {
          if (typeof msg.unread_count === 'number') {
            setUnreadCount(msg.unread_count);
          }
          void refresh();
          return;
        }
        if (msg.type === 'ping') {
          try { ws?.send(JSON.stringify({ type: 'pong' })); } catch (_) { /* noop */ }
          return;
        }
        if (msg.type === 'new_notification' && msg.notification) {
          const incoming = msg.notification as Notification;
          setNotifications((prev) => {
            if (prev.some((n) => n.id === incoming.id)) return prev;
            return [incoming, ...prev];
          });
          setUnreadCount((prev) => prev + 1);
        }
      } catch (err) {
        // ignore parse errors
      }
    };

    ws.onerror = () => {
      failCountRef.current += 1;
    };

    ws.onclose = () => {
      if (destroyedRef.current) return;
      setConnectionStatus((cur) => (cur === 'open' ? 'closing' : cur));
      scheduleReconnect();
    };
  }, [enabled, refresh, startPolling]);

  const scheduleReconnect = useCallback(() => {
    clearReconnectTimer();
    if (destroyedRef.current || !enabled) return;
    if (failCountRef.current >= MAX_FAILS_BEFORE_POLLING) {
      startPolling();
      return;
    }
    const backoff = Math.min(MAX_BACKOFF_MS, 1000 * Math.pow(3, failCountRef.current));
    const hidden = typeof document !== 'undefined' && document.hidden;
    const delay = hidden ? Math.max(backoff, HIDDEN_BACKOFF_MS) : backoff;
    setConnectionStatus('closed');
    reconnectTimerRef.current = window.setTimeout(() => {
      void tryConnectWs();
    }, delay);
  }, [clearReconnectTimer, enabled, startPolling, tryConnectWs]);

  useEffect(() => {
    destroyedRef.current = false;
    if (!enabled) {
      return () => { /* noop */ };
    }
    void refresh();
    void tryConnectWs();

    const onVisibility = () => {
      if (document.hidden) {
        if (pollingTimerRef.current !== null) {
          clearPollingTimer();
          startPolling();
        }
        return;
      }
      if (failCountRef.current < MAX_FAILS_BEFORE_POLLING) {
        clearPollingTimer();
        void tryConnectWs();
      } else {
        void refresh();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      destroyedRef.current = true;
      document.removeEventListener('visibilitychange', onVisibility);
      clearReconnectTimer();
      clearPollingTimer();
      try {
        wsRef.current?.close();
      } catch (_) { /* noop */ }
      wsRef.current = null;
    };
  }, [enabled, tryConnectWs, clearPollingTimer, clearReconnectTimer, refresh, startPolling]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      // ignore
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead(userIdRef.current);
      setNotifications((prev) => prev.map((n) => (n.userId === userIdRef.current ? { ...n, read: true } : n)));
      setUnreadCount(0);
    } catch (err) {
      // ignore
    }
  }, []);

  return {
    notifications,
    unreadCount,
    connectionStatus,
    markAsRead,
    markAllAsRead,
    refresh,
  };
}

export default useRealtimeNotifications;
