"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const WS_ENDPOINT = "/ws";

export interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnectDelay?: number;
  debug?: boolean;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  subscribe: (topic: string, callback: (message: unknown) => void) => StompSubscription | null;
  unsubscribe: (subscription: StompSubscription) => void;
}

interface PendingSubscription {
  topic: string;
  callback: (message: unknown) => void;
  resolve: (sub: StompSubscription | null) => void;
}

type ConnectionListener = (connected: boolean) => void;

let sharedClient: Client | null = null;
let sharedConnected = false;
let sharedConnectPromise: Promise<void> | null = null;
let activeHookCount = 0;
const connectionListeners = new Set<ConnectionListener>();

function notifyConnectionState(connected: boolean) {
  sharedConnected = connected;
  connectionListeners.forEach((listener) => listener(connected));
}

async function fetchWsToken(): Promise<string | null> {
  try {
    const response = await fetch(`/api/v1/internal/auth/ws-token`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.token || null;
  } catch {
    return null;
  }
}

function teardownSharedClient() {
  if (!sharedClient) {
    notifyConnectionState(false);
    return;
  }

  const client = sharedClient;
  sharedClient = null;
  notifyConnectionState(false);
  void client.deactivate();
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const { autoConnect = true, reconnectDelay = 5000, debug = false } = options;

  const [isConnected, setIsConnected] = useState(sharedConnected);
  const subscriptionsRef = useRef<Map<string, StompSubscription>>(new Map());
  const pendingSubscriptionsRef = useRef<PendingSubscription[]>([]);

  const log = useCallback(
    (message: string, ...args: unknown[]) => {
      if (debug) {
        console.log(`[WebSocket] ${message}`, ...args);
      }
    },
    [debug]
  );

  // Process any pending subscriptions once connected
  const processPendingSubscriptions = useCallback(() => {
    const client = sharedClient;
    if (!client?.connected) return;

    const pending = [...pendingSubscriptionsRef.current];
    pendingSubscriptionsRef.current = [];

    pending.forEach(({ topic, callback, resolve }) => {
      log(`Processing pending subscription to ${topic}`);
      try {
        const subscription = client.subscribe(topic, (message: IMessage) => {
          try {
            const parsed = JSON.parse(message.body);
            callback(parsed);
          } catch (e) {
            console.error("[WebSocket] Failed to parse message:", e);
            callback(message.body);
          }
        });
        subscriptionsRef.current.set(topic, subscription);
        resolve(subscription);
      } catch (e) {
        console.error("[WebSocket] Failed to process pending subscription:", e);
        resolve(null);
      }
    });
  }, [log]);

  const connect = useCallback(async () => {
    if (sharedClient?.active || sharedClient?.connected) {
      log("Already connected or connecting");
      return;
    }

    if (sharedConnectPromise) {
      await sharedConnectPromise;
      return;
    }

    sharedConnectPromise = (async () => {
      const token = await fetchWsToken();
      if (!token) {
        log("No WS token available, cannot connect");
        return;
      }

      const wsUrl = `${WS_ENDPOINT}?token=${token}`;

      const client = new Client({
        webSocketFactory: () => {
          return new SockJS(wsUrl, null, {
            timeout: 5000,
          }) as unknown as WebSocket;
        },
        reconnectDelay,
        debug: debug ? (msg) => console.log(`[STOMP] ${msg}`) : () => {},
        onConnect: () => {
          log("Connected to WebSocket");
          notifyConnectionState(true);
        },
        onDisconnect: () => {
          log("Disconnected from WebSocket");
          notifyConnectionState(false);
        },
        onStompError: (frame) => {
          console.error("[WebSocket] STOMP error:", frame.headers.message);
          notifyConnectionState(false);
        },
        onWebSocketError: (event) => {
          console.error("[WebSocket] WebSocket error:", event);
        },
      });

      sharedClient = client;
      client.activate();
    })().finally(() => {
      sharedConnectPromise = null;
    });

    await sharedConnectPromise;
  }, [reconnectDelay, debug, log]);

  const cleanupLocalSubscriptions = useCallback(() => {
    pendingSubscriptionsRef.current.forEach(({ resolve }) => resolve(null));
    pendingSubscriptionsRef.current = [];

    subscriptionsRef.current.forEach((sub) => {
      try {
        sub.unsubscribe();
      } catch {
        // Ignore errors during cleanup
      }
    });
    subscriptionsRef.current.clear();
  }, []);

  const disconnect = useCallback(() => {
    cleanupLocalSubscriptions();
    if (activeHookCount <= 1) {
      teardownSharedClient();
      log("Disconnected");
    }
  }, [cleanupLocalSubscriptions, log]);

  const subscribe = useCallback(
    (topic: string, callback: (message: unknown) => void): StompSubscription | null => {
      const client = sharedClient;

      // Check if client is actually connected (not just active)
      if (!client?.connected) {
        log(`Client not connected yet, queueing subscription to ${topic}`);

        // Queue the subscription to be processed when connected
        // For now, return null and the caller should rely on the useEffect re-running
        // when isConnected changes
        let resolvedSub: StompSubscription | null = null;
        const pendingSub: PendingSubscription = {
          topic,
          callback,
          resolve: (sub) => {
            resolvedSub = sub;
          },
        };
        pendingSubscriptionsRef.current.push(pendingSub);
        return resolvedSub;
      }

      log(`Subscribing to ${topic}`);

      try {
        const subscription = client.subscribe(topic, (message: IMessage) => {
          try {
            const parsed = JSON.parse(message.body);
            callback(parsed);
          } catch (e) {
            console.error("[WebSocket] Failed to parse message:", e);
            callback(message.body);
          }
        });

        subscriptionsRef.current.set(topic, subscription);
        return subscription;
      } catch (e) {
        console.error("[WebSocket] Failed to subscribe:", e);
        return null;
      }
    },
    [log, processPendingSubscriptions]
  );

  const unsubscribe = useCallback(
    (subscription: StompSubscription) => {
      try {
        subscription.unsubscribe();
        // Remove from map
        subscriptionsRef.current.forEach((sub, key) => {
          if (sub === subscription) {
            subscriptionsRef.current.delete(key);
          }
        });
        log("Unsubscribed");
      } catch (e) {
        console.error("[WebSocket] Error unsubscribing:", e);
      }
    },
    [log]
  );

  // Auto-connect on mount
  useEffect(() => {
    activeHookCount += 1;
    const listener: ConnectionListener = (connected) => {
      setIsConnected(connected);
    };
    connectionListeners.add(listener);
    setIsConnected(sharedConnected);

    if (autoConnect) {
      void connect();
    }

    return () => {
      cleanupLocalSubscriptions();
      connectionListeners.delete(listener);
      activeHookCount = Math.max(0, activeHookCount - 1);
      if (activeHookCount === 0) {
        teardownSharedClient();
      }
    };
  }, [autoConnect, connect, cleanupLocalSubscriptions]);

  useEffect(() => {
    if (isConnected) {
      processPendingSubscriptions();
    }
  }, [isConnected, processPendingSubscriptions]);

  return {
    isConnected,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
  };
}
