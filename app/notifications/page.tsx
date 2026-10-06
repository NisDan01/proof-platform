"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

type Notification = {
  id: string;
  application_id: string | null;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

export default function NotificationsPage() {
  const supabase = createClient();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNotifications() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/auth";
        return;
      }

      const { data, error } = await supabase
        .from("notifications")
        .select(
          "id, application_id, type, title, message, read, created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("PROOF notifications error:", error);
      }

      setNotifications(data ?? []);
      setLoading(false);
    }

    loadNotifications();
  }, []);

  async function markAsRead(id: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);

    if (error) {
      console.error("PROOF notification update error:", error);
      return;
    }

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  }

  async function markAllAsRead() {
    const unreadIds = notifications
      .filter((notification) => !notification.read)
      .map((notification) => notification.id);

    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", unreadIds);

    if (error) {
      console.error("PROOF mark all read error:", error);
      return;
    }

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  function formatDate(date: string) {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030407] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-32 top-20 h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-[140px]"
          animate={{
            x: [0, 80, -20, 0],
            y: [0, 40, -30, 0],
            scale: [1, 1.12, 0.92, 1],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.div
          className="absolute right-[-120px] top-[35%] h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[160px]"
          animate={{
            x: [0, -70, 30, 0],
            y: [0, -40, 50, 0],
            scale: [1, 0.9, 1.12, 1],
          }}
          transition={{
            duration: 17,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:70px_70px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-8 lg:px-8">
        <motion.header
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link
            href="/dashboard"
            className="text-2xl font-bold tracking-tight transition hover:scale-105"
          >
            PROOF<span className="text-cyan-400">.</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm text-white/70 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
            >
              Dashboard
            </Link>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] px-5 py-2.5 text-sm text-cyan-300 transition hover:bg-cyan-400/[0.12]"
              >
                Mark all read
              </button>
            )}
          </div>
        </motion.header>

        <motion.section
          className="mt-16"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/60">
            PROOF Activity
          </p>

          <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-5xl font-semibold tracking-[-0.04em]">
                Notifications
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-6 text-white/40">
                Stay updated on your applications, hiring progress and new
                proof activity.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-4">
              <p className="text-xs uppercase tracking-widest text-white/30">
                Unread
              </p>
              <p className="mt-1 text-2xl font-semibold text-cyan-300">
                {unreadCount}
              </p>
            </div>
          </div>
        </motion.section>

        <section className="mt-10 space-y-3">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />
            </div>
          ) : notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-white/10 bg-white/[0.035] p-12 text-center backdrop-blur-xl"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-2xl">
                ♧
              </div>

              <h2 className="mt-5 text-xl font-semibold">
                You're all caught up
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/35">
                Application updates and important PROOF activity will appear
                here.
              </p>
            </motion.div>
          ) : (
            notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`group rounded-3xl border p-5 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 ${
                  notification.read
                    ? "border-white/10 bg-white/[0.025]"
                    : "border-cyan-400/20 bg-cyan-400/[0.045] shadow-[0_0_40px_rgba(34,211,238,0.04)]"
                }`}
              >
                <div className="flex gap-4">
                  <div
                    className={`mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
                      notification.read
                        ? "border-white/10 bg-white/[0.04] text-white/40"
                        : "border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
                    }`}
                  >
                    <span className="text-lg">•</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-medium">
                            {notification.title}
                          </h2>

                          {!notification.read && (
                            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
                          )}
                        </div>

                        <p className="mt-2 text-sm leading-6 text-white/45">
                          {notification.message}
                        </p>
                      </div>

                      <span className="shrink-0 text-xs text-white/25">
                        {formatDate(notification.created_at)}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      {notification.application_id && (
                        <Link
                          href="/applications"
                          className="text-xs font-medium text-cyan-300 transition hover:text-cyan-200"
                        >
                          View application →
                        </Link>
                      )}

                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs text-white/35 transition hover:text-white"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
