"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Conversation = {
  id: string;
  company_id: string;
  candidate_id: string;
  updated_at: string;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

type Company = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type Profile = {
  full_name: string | null;
  role: string | null;
  avatar_url: string | null;
};

const navigation = [
  { name: "Overview", href: "/dashboard", icon: "⌂" },
  { name: "Challenges", href: "/challenges", icon: "◇" },
  { name: "Opportunities", href: "/opportunities", icon: "◈" },
  { name: "Skill Passport", href: "/dashboard#skills", icon: "◆" },
  { name: "Applications", href: "/applications", icon: "↗" },
  { name: "Messages", href: "/messages", icon: "◌" },
  { name: "Notifications", href: "/dashboard#notifications", icon: "♢" },
  { name: "Saved", href: "/saved", icon: "♡" },
];

const accountNavigation = [
  { name: "Profile", href: "/profile", icon: "◎" },
  { name: "Settings", href: "/settings", icon: "⚙" },
];

export default function MessagesPage() {
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [companies, setCompanies] = useState<Record<string, Company>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [selectedConversation, setSelectedConversation] =
    useState<string | null>(null);

  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

  async function loadMessages() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/auth";
      return;
    }

    setCurrentUserId(user.id);

    const [profileResult, conversationResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, role, avatar_url")
        .eq("id", user.id)
        .maybeSingle(),

      supabase
        .from("conversations")
        .select("id, company_id, candidate_id, updated_at")
        .eq("candidate_id", user.id)
        .order("updated_at", { ascending: false }),
    ]);

    setProfile(profileResult.data);

    if (conversationResult.error) {
      console.error(
        "PROOF conversations error:",
        conversationResult.error
      );
      setLoading(false);
      return;
    }

    const loadedConversations = conversationResult.data ?? [];
    setConversations(loadedConversations);

    if (loadedConversations.length === 0) {
      setLoading(false);
      return;
    }

    const conversationIds = loadedConversations.map((item) => item.id);
    const companyIds = loadedConversations.map((item) => item.company_id);

    const [messagesResult, companiesResult] = await Promise.all([
      supabase
        .from("messages")
        .select(
          "id, conversation_id, sender_id, message, is_read, created_at"
        )
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: true }),

      supabase
        .from("companies")
        .select("id, name, logo_url")
        .in("id", companyIds),
    ]);

    if (messagesResult.error) {
      console.error("PROOF messages error:", messagesResult.error);
    }

    if (companiesResult.error) {
      console.error(
        "PROOF companies error:",
        companiesResult.error
      );
    }

    setMessages(messagesResult.data ?? []);

    const companyMap: Record<string, Company> = {};

    (companiesResult.data ?? []).forEach((company) => {
      companyMap[company.id] = {
        id: company.id,
        full_name: company.name ?? null,
        avatar_url: company.logo_url ?? null,
      };
    });

    setCompanies(companyMap);

    setSelectedConversation(loadedConversations[0].id);
    setLoading(false);
  }

  async function sendReply() {
    const text = replyText.trim();

    if (!text || !selectedConversation || !currentUserId || sending) {
      return;
    }

    setSending(true);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: selectedConversation,
        sender_id: currentUserId,
        message: text,
        is_read: false,
      })
      .select(
        "id, conversation_id, sender_id, message, is_read, created_at"
      )
      .single();

    if (error) {
      console.error("PROOF send message error:", error);
      setSending(false);
      return;
    }

    if (data) {
      setMessages((current) => [...current, data]);
      setReplyText("");

      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", selectedConversation);
    }

    setSending(false);
  }

  async function markConversationRead(conversationId: string) {
    if (!currentUserId) return;

    const unreadMessages = messages.filter(
      (message) =>
        message.conversation_id === conversationId &&
        message.sender_id !== currentUserId &&
        !message.is_read
    );

    if (unreadMessages.length === 0) return;

    const unreadIds = unreadMessages.map((message) => message.id);

    const { error } = await supabase
      .from("messages")
      .update({ is_read: true })
      .in("id", unreadIds);

    if (!error) {
      setMessages((current) =>
        current.map((message) =>
          unreadIds.includes(message.id)
            ? { ...message, is_read: true }
            : message
        )
      );
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const selectedMessages = messages.filter(
    (message) => message.conversation_id === selectedConversation
  );

  const selectedCompanyId = conversations.find(
    (conversation) => conversation.id === selectedConversation
  )?.company_id;

  const selectedCompany = selectedCompanyId
    ? companies[selectedCompanyId]
    : null;

  const unreadCount = messages.filter(
    (message) =>
      message.sender_id !== currentUserId && !message.is_read
  ).length;

  function openConversation(id: string) {
    setSelectedConversation(id);
    setShowChat(true);
    markConversationRead(id);
  }

  return (
    <main
      style={{ backgroundImage: "none" }}
      className="min-h-screen bg-[#050507] text-white"
    >
      <div className="flex min-h-screen">

        {/* SIDEBAR */}
        <aside className="hidden w-[250px] shrink-0 border-r border-white/[0.07] bg-[#08080c] lg:flex lg:flex-col">
          <div className="px-7 pb-8 pt-8">
            <Link href="/" className="group">
              <div className="text-2xl font-black tracking-[-0.06em]">
                PROOF<span className="text-cyan-400">.</span>
              </div>

              <div className="mt-1 flex items-center gap-2 text-[9px] font-bold tracking-[0.22em] text-zinc-500">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                SKILL-FIRST NETWORK
              </div>
            </Link>
          </div>

          <div className="px-4">
            <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.2em] text-zinc-600">
              WORKSPACE
            </p>

            <nav className="space-y-1">
              {navigation.map((item) => {
                const active = item.name === "Messages";

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                      active
                        ? "bg-white/[0.09] text-white shadow-[inset_3px_0_0_#22d3ee]"
                        : "text-zinc-500 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`w-5 text-center text-base ${
                          active
                            ? "text-cyan-400"
                            : "text-zinc-400 group-hover:text-cyan-400"
                        }`}
                      >
                        {item.icon}
                      </span>
                      {item.name}
                    </span>

                    {item.name === "Messages" && unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-400 px-1.5 text-[9px] font-black text-black">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-8 px-4">
            <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.2em] text-zinc-600">
              ACCOUNT
            </p>

            <nav className="space-y-1">
              {accountNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-zinc-500 transition hover:bg-white/[0.05] hover:text-white"
                >
                  <span className="w-5 text-center text-base text-zinc-400 group-hover:text-cyan-400">
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-auto p-4">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4">
              <div className="mb-3 flex items-center gap-3">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 text-sm font-bold text-black">
                    {profile?.full_name?.charAt(0) ?? "N"}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-white">
                    {profile?.full_name ?? "Candidate"}
                  </p>
                  <p className="truncate text-[10px] text-zinc-500">
                    {profile?.role ?? "candidate"}
                  </p>
                </div>
              </div>

              <button
                onClick={signOut}
                className="w-full rounded-lg border border-white/[0.07] py-2 text-xs text-zinc-500 transition hover:border-red-400/20 hover:text-red-300"
              >
                Sign out
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <section className="min-w-0 flex-1">

          {/* MOBILE HEADER */}
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4 lg:hidden">
            <Link
              href="/"
              className="text-xl font-black tracking-[-0.05em]"
            >
              PROOF<span className="text-cyan-400">.</span>
            </Link>

            {showChat ? (
              <button
                onClick={() => setShowChat(false)}
                className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-medium text-white"
              >
                ← Back
              </button>
            ) : (
              <span className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-2 text-xs font-medium text-cyan-300">
                Messages
              </span>
            )}
          </div>

          <div className="mx-auto max-w-[1250px] px-5 py-7 sm:px-8 lg:px-10 lg:py-10">

            {/* HEADER */}
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] px-3 py-1.5 text-[10px] font-bold tracking-[0.16em] text-cyan-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                  PROOF COMMUNICATION
                </div>

                <h1 className="text-4xl font-black tracking-[-0.045em]">
                  Messages
                </h1>

                <p className="mt-3 text-sm text-zinc-500">
                  Direct communication with companies about your opportunities.
                </p>
              </div>

              {unreadCount > 0 && (
                <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
                  {unreadCount} unread
                </div>
              )}
            </div>

            {loading ? (
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-10 text-sm text-white/40">
                Loading messages...
              </div>
            ) : conversations.length === 0 ? (
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-2xl">
                  ✦
                </div>

                <h2 className="mt-5 text-xl font-semibold">
                  No company conversations yet
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/40">
                  When a company contacts you about an opportunity,
                  the conversation will appear here.
                </p>
              </div>
            ) : (
              <div className="grid min-h-[650px] overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.02] lg:grid-cols-[320px_1fr]">

                {/* CONVERSATIONS */}
                <aside
                  className={`border-white/10 lg:border-r ${
                    showChat ? "hidden lg:block" : "block"
                  }`}
                >
                  <div className="border-b border-white/10 px-5 py-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">
                          Conversations
                        </p>
                        <p className="mt-1 text-[11px] text-zinc-600">
                          {conversations.length} active
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-white/[0.06]">
                    {conversations.map((conversation) => {
                      const company = companies[conversation.company_id];
                      const active =
                        conversation.id === selectedConversation;

                      const conversationMessages = messages.filter(
                        (message) =>
                          message.conversation_id === conversation.id
                      );

                      const lastMessage =
                        conversationMessages[
                          conversationMessages.length - 1
                        ];

                      const hasUnread = conversationMessages.some(
                        (message) =>
                          message.sender_id !== currentUserId &&
                          !message.is_read
                      );

                      return (
                        <button
                          key={conversation.id}
                          onClick={() => openConversation(conversation.id)}
                          className={`w-full px-5 py-4 text-left transition ${
                            active
                              ? "bg-cyan-400/[0.07]"
                              : "hover:bg-white/[0.035]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.05] text-sm font-semibold text-cyan-200">
                              {company?.avatar_url ? (
                                <img
                                  src={company.avatar_url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                company?.full_name?.charAt(0) ?? "C"
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-sm font-medium">
                                  {company?.full_name ?? "Company"}
                                </p>

                                {hasUnread && (
                                  <span className="h-2 w-2 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                                )}
                              </div>

                              <p className="mt-1 truncate text-xs text-white/35">
                                {lastMessage?.message ??
                                  "No messages yet"}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </aside>

                {/* CHAT */}
                <section
                  className={`min-h-[650px] flex-col ${
                    showChat
                      ? "flex"
                      : "hidden lg:flex"
                  }`}
                >
                  <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4 sm:px-6 sm:py-5">

                    <button
                      onClick={() => setShowChat(false)}
                      className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-zinc-300 transition hover:border-cyan-400/30 hover:text-white lg:hidden"
                    >
                      ←
                    </button>

                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-cyan-400/20 bg-cyan-400/[0.07] text-sm font-semibold text-cyan-200">
                      {selectedCompany?.avatar_url ? (
                        <img
                          src={selectedCompany.avatar_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        selectedCompany?.full_name?.charAt(0) ?? "C"
                      )}
                    </div>

                    <div>
                      <p className="font-semibold">
                        {selectedCompany?.full_name ?? "Company"}
                      </p>
                      <p className="text-xs text-white/35">
                        Company conversation
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
                    {selectedMessages.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-sm text-white/30">
                        No messages in this conversation yet.
                      </div>
                    ) : (
                      selectedMessages.map((message) => {
                        const isMine =
                          message.sender_id === currentUserId;

                        return (
                          <div
                            key={message.id}
                            className={`flex ${
                              isMine
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[85%] rounded-[1.4rem] border px-5 py-4 ${
                                isMine
                                  ? "rounded-br-md border-violet-400/20 bg-violet-400/[0.10]"
                                  : "rounded-bl-md border-cyan-400/20 bg-cyan-400/[0.06]"
                              }`}
                            >
                              <p className="text-sm leading-6 text-white/75">
                                {message.message}
                              </p>

                              <p className="mt-2 text-[10px] text-white/25">
                                {new Date(
                                  message.created_at
                                ).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="border-t border-white/10 p-4 sm:p-5">
                    <div className="flex gap-3">
                      <textarea
                        value={replyText}
                        onChange={(event) =>
                          setReplyText(event.target.value)
                        }
                        rows={2}
                        placeholder="Write a message..."
                        className="min-h-[52px] flex-1 resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-cyan-400/40"
                      />

                      <button
                        onClick={sendReply}
                        disabled={!replyText.trim() || sending}
                        className="self-end rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {sending ? "Sending..." : "Send"}
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
