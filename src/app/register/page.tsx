"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useUser, UserProvider } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { Wind, Mail, Lock, User, ArrowRight, Sparkles } from "lucide-react";
import Script from "next/script";

function RegisterPageContent() {
  const { login, isAuthenticated } = useUser();
  const router = useRouter();
  const [captchaSiteKey, setCaptchaSiteKey] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  // Fetch Turnstile site key on mount
  useEffect(() => {
    fetch("/api/auth/captcha")
      .then((res) => res.json())
      .then((data) => setCaptchaSiteKey(data.siteKey))
      .catch(() => setError("Failed to load security challenge"));
  }, []);

  const pendingSubmitRef = useRef(false);

  const handleSubmitImpl = async () => {
    if (!turnstileToken) {
      setError("Please complete the security verification.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
          turnstileToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.");
        setTurnstileToken("");
        return;
      }

      login(data.user);
      router.push("/");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Turnstile widget when site key and the turnstile global are available
  useEffect(() => {
    if (!captchaSiteKey || !turnstileRef.current) return;

    // @ts-expect-error - Turnstile global from Cloudflare script
    if (typeof window.turnstile === "undefined") return;

    // @ts-expect-error - Turnstile render API
    widgetIdRef.current = window.turnstile.render(turnstileRef.current!, {
      sitekey: captchaSiteKey,
      size: "invisible",
      callback: (token: string) => {
        setTurnstileToken(token);
        if (pendingSubmitRef.current) {
          pendingSubmitRef.current = false;
          handleSubmitImpl();
        }
      },
      "error-callback": () => {
        setTurnstileToken("");
        setError("Captcha verification failed. Please try again.");
        pendingSubmitRef.current = false;
      },
      "expired-callback": () => {
        setTurnstileToken("");
        pendingSubmitRef.current = false;
      },
    });
  }, [captchaSiteKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !email || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Execute Turnstile to get a token
    // @ts-expect-error - Turnstile global
    if (widgetIdRef.current && typeof window.turnstile !== "undefined") {
      pendingSubmitRef.current = true;
      // @ts-expect-error - Turnstile execute API
      window.turnstile.execute(widgetIdRef.current);
      return;
    }

    if (!turnstileToken) {
      setError("Please complete the security verification.");
      return;
    }

    await handleSubmitImpl();
  };

  const handleGoogleSignIn = () => {
    router.push("/api/auth/google/start");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-abyss-950">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1419242106518-fc609a8f624d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] opacity-10 blur-[40px] animate-pulse" />
      <div className="relative z-10 w-full max-w-md px-6 py-12">
        <div className="flex flex-col items-center space-y-4 mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-600 via-sky-400 to-emerald-400 p-2 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Wind className="w-8 h-8 text-cyan-100" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black text-white tracking-tight">Join the Winds</h1>
            <p className="text-slate-400 text-sm">
              Create your account to start your journey in the Blessed Winds sanctuary
            </p>
          </div>
        </div>

        {/* Turnstile script */}
        {captchaSiteKey && (
          <Script
            src={`https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit`}
            strategy="afterInteractive"
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-5 bg-slate-900/60 border border-slate-700/50 p-6 rounded-3xl shadow-2xl shadow-slate-900/50 backdrop-blur-xl">
          {error && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-rose-300 text-sm flex items-center space-x-2">
              <span className="text-rose-400">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Turnstile invisible widget container */}
          {captchaSiteKey && turnstileRef && (
            <div ref={turnstileRef} />
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="zephyr_traveler"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-base shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-300 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-5 h-5 fill-current" />
            <span>{isSubmitting ? "Creating Account..." : "Enter the Sanctuary"}</span>
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center space-x-3">
          <div className="w-full h-[1px] bg-slate-800" />
          <span className="px-2 text-xs text-slate-500">Or continue with</span>
          <div className="w-full h-[1px] bg-slate-800" />
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full py-3.5 rounded-xl border border-slate-600 bg-slate-900/50 text-slate-300 font-semibold text-sm flex items-center justify-center space-x-2 hover:bg-slate-800 hover:border-cyan-500/50 hover:text-white transition-all"
        >
          <Lock className="w-5 h-5" />
          <span>Continue with Google</span>
        </button>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-cyan-400 font-semibold hover:text-cyan-300 transition-colors"
            >
              Sign in
            </a>
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center space-x-3">
          <div className="w-full h-[1px] bg-slate-800" />
          <span className="px-2 text-xs text-slate-500">Play free — no real money</span>
          <div className="w-full h-[1px] bg-slate-800" />
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <UserProvider>
      <RegisterPageContent />
    </UserProvider>
  );
}
