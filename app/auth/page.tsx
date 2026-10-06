"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthPage() {
  const supabase = createClient();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      } else {
        window.location.href = "/dashboard";
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        setMessage(error.message);
      } else if (data.user) {
        setMessage(
          "Account created. Check your email to verify your account."
        );
      }
    }

    setLoading(false);
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage(error.message);
      setGoogleLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#050509] text-white">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[8%] top-[10%] h-72 w-72 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute right-[8%] top-[35%] h-96 w-96 rounded-full bg-violet-500/10 blur-[140px]" />
        <div className="absolute bottom-[-10%] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-blue-500/8 blur-[120px]" />
      </div>

      {/* Back */}
      <a
        href="/"
        className="absolute left-6 top-6 z-20 text-sm text-white/40 transition hover:text-white"
      >
        ← Back to PROOF
      </a>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-center px-6 py-24">
        <div className="grid w-full items-center gap-16 lg:grid-cols-2">
          
          {/* Left */}
          <div className="hidden lg:block">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-2 text-sm text-cyan-300">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
              The proof-first hiring network
            </div>

            <h1 className="mt-7 text-6xl font-semibold leading-[0.95] tracking-[-0.04em]">
              Your skills
              <br />
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                deserve proof.
              </span>
            </h1>

            <p className="mt-7 max-w-lg text-lg leading-8 text-white/40">
              Build your Skill Passport, prove what you can do, and connect
              with opportunities that match your actual ability.
            </p>

            <div className="mt-10 flex gap-8 text-sm">
              <div>
                <p className="text-xl font-semibold">Practical</p>
                <p className="mt-1 text-white/30">Skill challenges</p>
              </div>

              <div>
                <p className="text-xl font-semibold">Verified</p>
                <p className="mt-1 text-white/30">Skill evidence</p>
              </div>

              <div>
                <p className="text-xl font-semibold">Direct</p>
                <p className="mt-1 text-white/30">Real opportunities</p>
              </div>
            </div>
          </div>

          {/* Auth Card */}
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 text-center lg:text-left">
              <a
                href="/"
                className="text-3xl font-bold tracking-tight lg:hidden"
              >
                PROOF<span className="text-cyan-400">.</span>
              </a>

              <h2 className="mt-6 text-3xl font-semibold tracking-tight">
                {isLogin ? "Welcome back." : "Create your account."}
              </h2>

              <p className="mt-2 text-sm text-white/40">
                {isLogin
                  ? "Continue building your proof."
                  : "Start building your Skill Passport."}
              </p>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/[0.035] p-7 shadow-2xl backdrop-blur-2xl">
              
              {/* Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3.5 font-medium transition hover:border-white/20 hover:bg-white/[0.08] disabled:opacity-50"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-black">
                  G
                </span>

                {googleLoading ? "Connecting..." : "Continue with Google"}
              </button>

              {/* Divider */}
              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-white/8" />
                <span className="text-xs text-white/25">OR</span>
                <div className="h-px flex-1 bg-white/8" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="mb-2 block text-xs text-white/45">
                      Full name
                    </label>

                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your name"
                      required
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 outline-none transition placeholder:text-white/20 focus:border-cyan-400/40 focus:bg-white/[0.04]"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-xs text-white/45">
                    Email
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 outline-none transition placeholder:text-white/20 focus:border-cyan-400/40 focus:bg-white/[0.04]"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs text-white/45">
                      Password
                    </label>

                    {isLogin && (
                      <button
                        type="button"
                        className="text-xs text-cyan-300 transition hover:text-cyan-200"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 pr-16 outline-none transition placeholder:text-white/20 focus:border-cyan-400/40 focus:bg-white/[0.04]"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/35 transition hover:text-white"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full rounded-2xl bg-white px-5 py-3.5 font-semibold text-black transition duration-300 hover:scale-[1.01] hover:shadow-[0_0_35px_rgba(255,255,255,0.12)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Please wait..."
                    : isLogin
                      ? "Sign in"
                      : "Create account"}
                </button>
              </form>

              {message && (
                <div className="mt-5 rounded-2xl border border-cyan-400/10 bg-cyan-400/5 p-4 text-sm leading-6 text-cyan-200">
                  {message}
                </div>
              )}

              <div className="mt-7 border-t border-white/8 pt-6 text-center text-sm text-white/40">
                {isLogin
                  ? "Don't have an account?"
                  : "Already have an account?"}

                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setMessage("");
                  }}
                  className="ml-2 font-medium text-cyan-300 transition hover:text-cyan-200"
                >
                  {isLogin ? "Create one" : "Sign in"}
                </button>
              </div>
            </div>

            <p className="mt-6 text-center text-xs leading-5 text-white/20">
              By continuing, you agree to PROOF&apos;s Terms and Privacy
              Policy.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
