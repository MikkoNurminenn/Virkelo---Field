"use client";

import { createContext, useContext, useEffect, useEffectEvent, useRef, useState } from "react";
import { toast } from "sonner";

import type { LiveNotificationPreview } from "@/lib/notification-preview";

type LiveNotificationSnapshot = {
  unreadCount: number;
  latestNotification: LiveNotificationPreview | null;
};

type NotificationLiveProviderProps = LiveNotificationSnapshot & {
  children: React.ReactNode;
};

const POLL_INTERVAL_MS = 15_000;

const NotificationLiveContext = createContext<LiveNotificationSnapshot>({
  unreadCount: 0,
  latestNotification: null,
});

const getAudioContextConstructor = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    window.AudioContext ??
    (window as Window & {
      webkitAudioContext?: typeof AudioContext;
    }).webkitAudioContext ??
    null
  );
};

export function NotificationLiveProvider({
  children,
  unreadCount,
  latestNotification,
}: NotificationLiveProviderProps) {
  const [snapshot, setSnapshot] = useState<LiveNotificationSnapshot>({
    unreadCount,
    latestNotification,
  });
  const audioContextRef = useRef<AudioContext | null>(null);
  const snapshotRef = useRef<LiveNotificationSnapshot>({
    unreadCount,
    latestNotification,
  });

  const unlockAudio = useEffectEvent(async () => {
    const AudioContextConstructor = getAudioContextConstructor();

    if (!AudioContextConstructor) {
      return;
    }

    const audioContext = audioContextRef.current ?? new AudioContextConstructor();
    audioContextRef.current = audioContext;

    if (audioContext.state === "suspended") {
      try {
        await audioContext.resume();
      } catch {
        return;
      }
    }
  });

  const playNotificationSound = useEffectEvent(() => {
    const audioContext = audioContextRef.current;

    if (!audioContext || audioContext.state !== "running") {
      return;
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const startAt = audioContext.currentTime;

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(880, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(640, startAt + 0.16);

    gainNode.gain.setValueAtTime(0.0001, startAt);
    gainNode.gain.exponentialRampToValueAtTime(0.05, startAt + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.22);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + 0.24);
  });

  const alertForNotification = useEffectEvent((notification: LiveNotificationPreview) => {
    playNotificationSound();
    navigator.vibrate?.([50, 30, 50]);
    toast.info(notification.title, {
      description: notification.body,
      duration: 5000,
    });
  });

  const syncUnreadNotifications = useEffectEvent(async () => {
    const response = await fetch("/api/notifications/unread", {
      cache: "no-store",
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      return;
    }

    const nextSnapshot = (await response.json()) as LiveNotificationSnapshot;
    const currentSnapshot = snapshotRef.current;
    const hasNewLatestNotification =
      Boolean(nextSnapshot.latestNotification) &&
      (!currentSnapshot.latestNotification ||
        nextSnapshot.latestNotification!.createdAt > currentSnapshot.latestNotification.createdAt);

    snapshotRef.current = nextSnapshot;
    setSnapshot(nextSnapshot);

    if (hasNewLatestNotification && nextSnapshot.latestNotification) {
      alertForNotification(nextSnapshot.latestNotification);
    }
  });

  useEffect(() => {
    const handleInteraction = () => {
      void unlockAudio();
    };

    window.addEventListener("pointerdown", handleInteraction, {
      passive: true,
    });
    window.addEventListener("keydown", handleInteraction);

    return () => {
      window.removeEventListener("pointerdown", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        return;
      }

      void syncUnreadNotifications();
    }, POLL_INTERVAL_MS);

    const handleFocus = () => {
      void syncUnreadNotifications();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncUnreadNotifications();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <NotificationLiveContext.Provider value={snapshot}>
      {children}
    </NotificationLiveContext.Provider>
  );
}

export const useLiveNotifications = () => useContext(NotificationLiveContext);
