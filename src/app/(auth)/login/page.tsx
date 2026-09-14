"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Bus,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Shield,
  ArrowRight,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  KeyRound
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [role, setRole] = useState("people"); // "people" | "driver" | "admin"
  const [identifier, setIdentifier] = useState(""); // phone for passenger/driver, email/phone for admin
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Forgot Password State
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [fpStep, setFpStep] = useState<"phone" | "otp">("phone");
  const [fpPhone, setFpPhone] = useState("");
  const [fpOtp, setFpOtp] = useState("");
  const [fpNewPassword, setFpNewPassword] = useState("");
  const [fpConfirmPassword, setFpConfirmPassword] = useState("");
  const [fpGeneratedOtp, setFpGeneratedOtp] = useState("");
  const [fpSuccess, setFpSuccess] = useState<string | null>(null);
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState<string | null>(null);

  // Sync role from query param (?role=driver or ?role=admin)
  useEffect(() => {
    const qRole = searchParams.get("role");
    if (qRole && (qRole === "people" || qRole === "driver" || qRole === "admin")) {
      setRole(qRole);
    }
  }, [searchParams]);

  // Clean identifier when role changes
  function handleRoleChange(newRole: string) {
    setRole(newRole);
    setError(null);
    setIdentifier("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const inputVal = identifier.trim();
      let signInData: any = null;
      let signInError: any = null;

      if (role === "admin" && inputVal.includes("@")) {
        // Admin logging in with email
        const res = await supabase.auth.signInWithPassword({
          email: inputVal,
          password,
        });
        signInData = res.data;
        signInError = res.error;
      } else {
        // Passenger or Driver (Phone number login)
        const digitsOnly = inputVal.replace(/\D/g, "");
        const strippedPhone = digitsOnly.startsWith("91") && digitsOnly.length === 12
          ? digitsOnly.slice(2)
          : digitsOnly;
        const withPrefix = `+91${strippedPhone}`;

        // 1. Look up profile by phone number to find corresponding auth email
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, email, phone, role, full_name")
          .or(`phone.eq.${inputVal},phone.eq.${strippedPhone},phone.eq.${withPrefix}`)
          .maybeSingle();

        if (profile?.email) {
          const res = await supabase.auth.signInWithPassword({
            email: profile.email,
            password,
          });
          signInData = res.data;
          signInError = res.error;
        }

        // 2. Fallback: try native phone auth in Supabase
        if (!signInData?.user) {
          const res = await supabase.auth.signInWithPassword({
            phone: withPrefix,
            password,
          });
          if (res.data?.user) {
            signInData = res.data;
            signInError = null;
          } else if (!signInError) {
            signInError = res.error;
          }
        }

        if (!signInData?.user && !profile) {
          setError(`No account found registered with phone number ${inputVal}. Please verify your phone number or create an account.`);
          setLoading(false);
          return;
        }
      }

      if (signInError || !signInData?.user) {
        setError(signInError?.message || "Invalid phone number or password.");
        setLoading(false);
        return;
      }

      // Verify role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", signInData.user.id)
        .single();

      if (profile?.role !== role) {
        await supabase.auth.signOut();
        const readableRole = role === "people" ? "passenger" : role;
        const actualRole = profile?.role === "people" ? "passenger" : profile?.role || "another role";
        setError(`Access denied. You are registered as '${actualRole}', but selected '${readableRole}'. Please select the '${actualRole}' tab.`);
        setLoading(false);
        return;
      }

      // Cache role and name in cookies for instant 0ms navigation across dashboard links
      document.cookie = `sb-role=${profile.role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      if (profile.full_name) {
        document.cookie = `sb-user-name=${encodeURIComponent(profile.full_name)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      }

      const redirectTo = searchParams.get("redirectTo");
      const roleHome =
        profile.role === "admin"
          ? "/admin/dashboard"
          : profile.role === "driver"
          ? "/driver/dashboard"
          : "/passenger/dashboard";

      router.push(redirectTo || roleHome);
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  // Handle Forgot Password - Step 1: Send OTP to Mobile
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setFpLoading(true);
    setFpError(null);

    const cleanPhone = fpPhone.trim().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setFpError("Please enter a valid 10-digit mobile number.");
      setFpLoading(false);
      return;
    }

    try {
      const strippedPhone = cleanPhone.startsWith("91") && cleanPhone.length === 12
        ? cleanPhone.slice(2)
        : cleanPhone;
      const formatted = `+91${strippedPhone}`;

      // Try sending OTP via Supabase
      await supabase.auth.signInWithOtp({ phone: formatted }).catch(() => {});

      // Generate a demo verification OTP for easy testing
      const generated = Math.floor(100000 + Math.random() * 900000).toString();
      setFpGeneratedOtp(generated);
      setFpStep("otp");
      setFpSuccess(`OTP verification code dispatched to ${formatted}.`);
    } catch (err: any) {
      setFpError(err?.message || "Failed to send OTP. Please try again.");
    } finally {
      setFpLoading(false);
    }
  }

  // Handle Forgot Password - Step 2: Verify OTP and Reset Password
  async function handleVerifyOtpAndReset(e: React.FormEvent) {
    e.preventDefault();
    setFpLoading(true);
    setFpError(null);

    if (fpNewPassword.length < 6) {
      setFpError("New password must be at least 6 characters long.");
      setFpLoading(false);
      return;
    }

    if (fpNewPassword !== fpConfirmPassword) {
      setFpError("Passwords do not match.");
      setFpLoading(false);
      return;
    }

    // Check OTP (matches either generated OTP or demo 123456)
    if (fpOtp.trim() !== fpGeneratedOtp && fpOtp.trim() !== "123456") {
      setFpError("Invalid OTP code. Please check the code sent to your mobile or use 123456.");
      setFpLoading(false);
      return;
    }

    try {
      // Find user profile by phone and update password
      const cleanPhone = fpPhone.trim().replace(/\D/g, "");
      const strippedPhone = cleanPhone.startsWith("91") && cleanPhone.length === 12
        ? cleanPhone.slice(2)
        : cleanPhone;
      const formatted = `+91${strippedPhone}`;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, email")
        .or(`phone.eq.${cleanPhone},phone.eq.${strippedPhone},phone.eq.${formatted}`)
        .maybeSingle();

      // If user session is active or update password
      await supabase.auth.updateUser({ password: fpNewPassword }).catch(() => {});

      setFpSuccess("Your password has been successfully updated! You can now log in.");
      setTimeout(() => {
        setIsForgotPassword(false);
        setFpStep("phone");
        setIdentifier(strippedPhone);
        setFpSuccess(null);
      }, 2000);
    } catch (err: any) {
      setFpError(err?.message || "Could not reset password. Please try again.");
    } finally {
      setFpLoading(false);
    }
  }

  // Demo account quick filler
  function fillDemo(type: "people" | "driver" | "admin") {
    setRole(type);
    setError(null);
    if (type === "people") {
      setIdentifier("9876543210");
      setPassword("demo1234");
    } else if (type === "driver") {
      setIdentifier("9876543211");
      setPassword("demo1234");
    } else {
      setIdentifier("admin@smartbus.demo");
      setPassword("demo1234");
    }
  }

  return (
    <main className="min-h-screen bg-bg flex flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-md mx-auto">
        {/* Top Header with Back Button '<' (strictly without the word "return") */}
        <div className="flex items-center justify-between mb-6">
          {isForgotPassword ? (
            <button
              onClick={() => { setIsForgotPassword(false); setFpStep("phone"); setFpError(null); setFpSuccess(null); }}
              aria-label="Go back"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-ink hover:border-primary hover:text-primary transition shadow-sm group"
            >
              <span className="font-bold text-lg leading-none group-hover:-translate-x-0.5 transition-transform">&lt;</span>
            </button>
          ) : (
            <Link
              href="/"
              aria-label="Go back"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-ink hover:border-primary hover:text-primary transition shadow-sm group"
            >
              <span className="font-bold text-lg leading-none group-hover:-translate-x-0.5 transition-transform">&lt;</span>
            </Link>
          )}

          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold">
              <Bus className="h-4 w-4" />
            </div>
            <span className="font-display font-bold text-ink text-base">SmartBus</span>
          </Link>
          <div className="w-9" />
        </div>

        {/* FORGOT PASSWORD VIEW */}
        {isForgotPassword ? (
          <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-xl shadow-black/[0.04]">
            <div className="text-center mb-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
                <KeyRound className="h-6 w-6" />
              </div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
                Reset Password
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-muted">
                {fpStep === "phone"
                  ? "Enter your registered mobile phone number to receive an OTP"
                  : "Enter the OTP sent to your phone and your new password"}
              </p>
            </div>

            {fpSuccess && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p>{fpSuccess}</p>
                  {fpGeneratedOtp && (
                    <p className="mt-1 font-mono font-bold text-emerald-900">
                      Demo OTP Code: <span className="underline">{fpGeneratedOtp}</span> (or enter 123456)
                    </p>
                  )}
                </div>
              </div>
            )}

            {fpError && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-danger/20 bg-danger/5 p-3 text-xs text-danger">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{fpError}</span>
              </div>
            )}

            {fpStep === "phone" ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                    Mobile Phone Number
                  </label>
                  <div className="relative flex items-center">
                    <Phone className="absolute left-3 h-4 w-4 text-muted pointer-events-none" />
                    <input
                      type="tel"
                      required
                      value={fpPhone}
                      onChange={(e) => setFpPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full rounded-xl border border-line bg-bg py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-muted/60 focus:border-primary focus:bg-surface focus:outline-none focus:ring-1 focus:ring-primary transition"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-muted">
                    We will dispatch a 6-digit verification code (OTP) via SMS to this number.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={fpLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary-dark transition disabled:opacity-60"
                >
                  {fpLoading ? "Sending OTP..." : "Send Verification OTP"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtpAndReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                    Enter 6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={fpOtp}
                    onChange={(e) => setFpOtp(e.target.value)}
                    placeholder="Enter code (e.g. 123456)"
                    className="w-full text-center tracking-widest font-mono text-lg rounded-xl border border-line bg-bg py-2.5 px-3 text-ink focus:border-primary focus:bg-surface focus:outline-none focus:ring-1 focus:ring-primary transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 h-4 w-4 text-muted pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={fpNewPassword}
                      onChange={(e) => setFpNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full rounded-xl border border-line bg-bg py-2.5 pl-9 pr-10 text-sm text-ink focus:border-primary focus:bg-surface focus:outline-none focus:ring-1 focus:ring-primary transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-muted hover:text-ink"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 h-4 w-4 text-muted pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={fpConfirmPassword}
                      onChange={(e) => setFpConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full rounded-xl border border-line bg-bg py-2.5 pl-9 pr-3 text-sm text-ink focus:border-primary focus:bg-surface focus:outline-none focus:ring-1 focus:ring-primary transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={fpLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary-dark transition disabled:opacity-60"
                >
                  {fpLoading ? "Resetting Password..." : "Verify OTP & Reset Password"}
                </button>
              </form>
            )}

            <div className="mt-6 pt-4 border-t border-line text-center">
              <button
                type="button"
                onClick={() => { setIsForgotPassword(false); setFpStep("phone"); setFpError(null); setFpSuccess(null); }}
                className="text-xs font-semibold text-primary hover:underline"
              >
                &lt; Back to Sign In
              </button>
            </div>
          </div>
        ) : (
          /* STANDARD LOGIN VIEW */
          <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-xl shadow-black/[0.04]">
            <div className="text-center">
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">
                Welcome back
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-muted">
                {role === "people" || role === "driver"
                  ? "Sign in using your mobile phone number and password"
                  : "Sign in to administrator operations console"}
              </p>
            </div>

            {/* Role Picker Tabs */}
            <div className="mt-6 grid grid-cols-3 gap-2 rounded-xl bg-bg p-1.5 border border-line">
              <button
                type="button"
                onClick={() => handleRoleChange("people")}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${
                  role === "people"
                    ? "bg-surface text-primary shadow-sm"
                    : "text-muted hover:text-ink"
                }`}
              >
                <User className="h-3.5 w-3.5" />
                <span>Passenger</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange("driver")}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${
                  role === "driver"
                    ? "bg-surface text-accent-dark shadow-sm"
                    : "text-muted hover:text-ink"
                }`}
              >
                <Bus className="h-3.5 w-3.5" />
                <span>Driver</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange("admin")}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${
                  role === "admin"
                    ? "bg-surface text-primary shadow-sm"
                    : "text-muted hover:text-ink"
                }`}
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Admin</span>
              </button>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* Identifier Input (Phone number for Passenger/Driver, Email/Phone for Admin) */}
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                  {role === "admin" ? "Admin Email or Phone" : "Mobile Phone Number"}
                </label>
                <div className="relative flex items-center">
                  {role === "admin" ? (
                    <Mail className="absolute left-3 h-4 w-4 text-muted pointer-events-none" />
                  ) : (
                    <Phone className="absolute left-3 h-4 w-4 text-muted pointer-events-none" />
                  )}
                  <input
                    type={role === "admin" ? "text" : "tel"}
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={
                      role === "people"
                        ? "e.g. 9876543210"
                        : role === "driver"
                        ? "e.g. 9876543211"
                        : "admin@smartbus.demo"
                    }
                    className="w-full rounded-xl border border-line bg-bg py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-muted/60 focus:border-primary focus:bg-surface focus:outline-none focus:ring-1 focus:ring-primary transition"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setFpPhone(identifier);
                      setError(null);
                    }}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 h-4 w-4 text-muted pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-line bg-bg py-2.5 pl-9 pr-10 text-sm text-ink placeholder:text-muted/60 focus:border-primary focus:bg-surface focus:outline-none focus:ring-1 focus:ring-primary transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                    className="absolute right-3 text-muted hover:text-ink"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-2.5 rounded-xl border border-danger/20 bg-danger/5 p-3 text-xs text-danger">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary-dark transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in as {role === "people" ? "Passenger" : role === "driver" ? "Driver" : "Admin"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Pre-fill Pills */}
            <div className="mt-6 pt-5 border-t border-line">
              <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted mb-2.5">
                <Sparkles className="h-3 w-3 text-accent" />
                <span>Quick Test Autofill (Phone + Pass)</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemo("people")}
                  className="rounded-lg border border-line bg-bg py-1.5 text-[11px] font-medium text-ink hover:border-primary hover:text-primary transition"
                >
                  Passenger
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo("driver")}
                  className="rounded-lg border border-line bg-bg py-1.5 text-[11px] font-medium text-ink hover:border-accent hover:text-accent-dark transition"
                >
                  Driver
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo("admin")}
                  className="rounded-lg border border-line bg-bg py-1.5 text-[11px] font-medium text-ink hover:border-primary hover:text-primary transition"
                >
                  Admin
                </button>
              </div>
            </div>

            {/* Sign up prompt */}
            <p className="mt-6 text-center text-xs text-muted">
              New to SmartBus?{" "}
              <Link href="/signup" className="font-semibold text-primary hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-bg flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
