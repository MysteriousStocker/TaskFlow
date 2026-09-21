import { TaskEvent } from '../types';

export interface SocketController {
  deactivate: () => void;
  onConnect?: () => void;
  onWebSocketClose?: () => void;
}

export function connectTaskSocket(userId: string, onEvent: (event: TaskEvent) => void): SocketController {
  let isDeactivated = false;
  let ws: WebSocket | null = null;
  let eventSource: EventSource | null = null;
  let reconnectTimer: any = null;

  const controller: SocketController = {
    deactivate: () => {
      isDeactivated = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        ws.onclose = null;
        ws.onerror = null;
        ws.close();
      }
      if (eventSource) {
        eventSource.close();
      }
      controller.onWebSocketClose?.();
    },
  };

  function tryWebSocket() {
    if (isDeactivated) return;

    try {
      const isSecure = window.location.protocol === 'https:';
      const wsProto = isSecure ? 'wss:' : 'ws:';
      const wsUrl = `${wsProto}//${window.location.host}/ws?userId=${encodeURIComponent(userId)}`;

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (isDeactivated) {
          ws?.close();
          return;
        }
        controller.onConnect?.();
        // Subscribe message in case query string was missed
        ws?.send(JSON.stringify({ type: 'subscribe', userId }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onEvent(data);
        } catch (err) {
          console.error('Failed to parse WebSocket message', err);
        }
      };

      ws.onclose = () => {
        if (isDeactivated) return;
        controller.onWebSocketClose?.();
        // Try fallback to EventSource or retry WS in 3s
        tryEventSource();
      };

      ws.onerror = () => {
        // Will trigger onclose and fallback
      };
    } catch {
      tryEventSource();
    }
  }

  function tryEventSource() {
    if (isDeactivated) return;
    if (eventSource) return;

    try {
      eventSource = new EventSource(`/api/events?userId=${encodeURIComponent(userId)}`);

      eventSource.onopen = () => {
        if (isDeactivated) {
          eventSource?.close();
          return;
        }
        controller.onConnect?.();
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onEvent(data);
        } catch (err) {
          console.error('Failed to parse SSE message', err);
        }
      };

      eventSource.onerror = () => {
        if (isDeactivated) return;
        controller.onWebSocketClose?.();
        eventSource?.close();
        eventSource = null;
        // Retry connection after 5 seconds
        reconnectTimer = setTimeout(() => {
          tryWebSocket();
        }, 5000);
      };
    } catch {
      reconnectTimer = setTimeout(() => {
        tryWebSocket();
      }, 5000);
    }
  }

  tryWebSocket();

  return controller;
}
