"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  message: string;
  read: boolean;
  created_at: string;
  company_id: string;
  sender_id: string;
  companies:
    | { name: string; logo_url: string | null }
    | { name: string; logo_url: string | null }[]
    | null;
};

export default function MessagesPage() {
  const supabase = createClient();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [sendingReply, setSendingReply] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadMessages() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      const { data } = await supabase
        .from("candidate_messages")
        .select(
          "id, message, read, created_at, company_id, sender_id, companies(name, logo_url)"
        )
        .eq("candidate_id", user.id)
        .order("created_at", { ascending: false });

      setMessages(data ?? []);
      setLoading(false);
    }

    loadMessages();
  }, [supabase]);

  async function markAsRead(messageId: string) {
    const target = messages.find((message) => message.id === messageId);

    if (!target || target.read) return;

    const { error } = await supabase
      .from("candidate_messages")
      .update({ read: true })
      .eq("id", messageId);

    if (!error) {
      setMessages((current) =>
        current.map((item) =>
          item.id === messageId ? { ...item, read: true } : item
        )
      );
    }
  }

  async function sendReply(message: Message) {
    const text = replyText.trim();
    if (!text || sendingReply) return;

    setSendingReply(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSendingReply(false);
      return;
    }

    const { data, error } = await supabase
      .from("candidate_messages")
      .insert({
        company_id: message.company_id,
        candidate_id: user.id,
        sender_id: user.id,
        message: text,
      })
      .select(
        "id, message, read, created_at, company_id, sender_id, companies(name, logo_url)"
      )
      .single();

    if (!error && data) {
      setMessages((current) => [data, ...current]);
      setReplyText("");
      setReplyingTo(null);
    }

    setSendingReply(false);
  }

  const unreadCount = messages.filter(
    (message) => message.sender_id !== currentUserId && !message.read
  ).length;

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <div className="mx-auto max-w-5xl px-6 py-12 sm:px-8">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/60">
            PROOF communication
          </p>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight">
                Messages
              </h1>
              <p className="mt-3 text-sm text-white/40">
                Direct communication with companies about your opportunities.
              </p>
            </div>

            {unreadCount > 0 && (
              <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
                {unreadCount} unread
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-8 text-sm text-white/40">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-2xl">
              ✦
            </div>
            <h2 className="mt-5 text-xl font-semibold">
              No messages yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/40">
              When a company contacts you about an opportunity, their message
              will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              const company = Array.isArray(message.companies)
                ? message.companies[0]
                : message.companies;

              const isMine = message.sender_id === currentUserId;

              return (
                <div
                  key={message.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex max-w-[85%] items-end gap-3 ${
                      isMine ? "flex-row-reverse" : ""
                    }`}
                  >
                    {!isMine && (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-sm">
                        {company?.name?.charAt(0) ?? "C"}
                      </div>
                    )}

                    <div
                      className={`rounded-[1.5rem] border px-5 py-4 ${
                        isMine
                          ? "rounded-br-md border-violet-400/20 bg-violet-400/[0.10]"
                          : !message.read
                            ? "rounded-bl-md border-cyan-400/25 bg-cyan-400/[0.07]"
                            : "rounded-bl-md border-white/10 bg-white/[0.025]"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span
                          className={`text-xs font-medium ${
                            isMine ? "text-violet-200" : "text-cyan-200"
                          }`}
                        >
                          {isMine ? "You" : company?.name ?? "Company"}
                        </span>

                        <span className="text-[11px] text-white/25">
                          {new Date(message.created_at).toLocaleString()}
                        </span>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-white/70">
                        {message.message}
                      </p>

                      {!isMine && !message.read && (
                        <span className="mt-3 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] text-cyan-200">
                          New
                        </span>
                      )}

                      {!isMine && (
                        <div className="mt-4">
                          {replyingTo === message.id ? (
                            <div className="space-y-3">
                              <textarea
                                value={replyText}
                                onChange={(event) =>
                                  setReplyText(event.target.value)
                                }
                                rows={3}
                                placeholder="Write a reply to the company..."
                                className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-cyan-400/40"
                              />

                              <div className="flex gap-3">
                                <button
                                  onClick={() => sendReply(message)}
                                  disabled={!replyText.trim() || sendingReply}
                                  className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  {sendingReply ? "Sending..." : "Send reply"}
                                </button>

                                <button
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyText("");
                                  }}
                                  className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/60 transition hover:bg-white/5"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setReplyingTo(message.id);
                                markAsRead(message.id);
                              }}
                              className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-2 text-sm font-medium text-cyan-200 transition hover:border-cyan-400/40 hover:bg-cyan-400/10"
                            >
                              Reply to company
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
