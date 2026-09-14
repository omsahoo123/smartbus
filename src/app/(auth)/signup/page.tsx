"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Bus,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  Shield,
  ArrowRight,
  AlertCircle
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("people");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } },
      });

      if (signUpError || !data.user) {
        setError(signUpError?.message ?? "Could not create your account.");
        setLoading(false);
        return;
      }

      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        role,
      });

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      // Auto-register driver record if signing up as driver
      if (role === "driver") {
        const cleanPhone = phone.trim().replace(/\D/g, "");
        const license = cleanPhone ? `OD-DL-${cleanPhone}` : `OD-DL-${data.user.id.slice(0, 8).toUpperCase()}`;
        await supabase.from("drivers").insert({
          profile_id: data.user.id,
          license_number: license,
          status: "active",
        }).catch(() => {});
      }

      // Cache role in cookie
      document.cookie = `sb-role=${role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

      const targetPath =
        role === "admin"
          ? "/admin/dashboard"
          : role === "driver"
          ? "/driver/dashboard"
          : "/passenger/dashboard";

      router.push(targetPath);
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during registration.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg flex flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-md mx-auto">
        {/* Top Header with Back Button '<' (strictly without the word "return") */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            aria-label="Go back"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-ink hover:border-primary hover:text-primary transition shadow-sm group"
          >
            <span className="font-bold text-lg leading-none group-hover:-translate-x-0.5 transition-transform">&lt;</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold">
              <Bus className="h-4 w-4" />
            </div>
            <span className="font-display font-bold text-ink text-base">SmartBus</span>
          </Link>
          <div className="w-9" />
        </div>

        {/* Main Card */}
        <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-xl shadow-black/[0.04]">
          <div className="text-center">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">
              Create your account
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-muted">
              Join thousands enjoying predictable, smart city commutes
            </p>
          </div>

          {/* Role Picker Tabs */}
          <div className="mt-6 grid grid-cols-3 gap-2 rounded-xl bg-bg p-1.5 border border-line">
            <button
              type="button"
              onClick={() => setRole("people")}
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
              onClick={() => setRole("driver")}
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
              onClick={() => setRole("admin")}
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

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Full name
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3 h-4 w-4 text-muted pointer-events-none" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full rounded-xl border border-line bg-bg py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-muted/60 focus:border-primary focus:bg-surface focus:outline-none focus:ring-1 focus:ring-primary transition"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Phone number
              </label>
              <div className="relative flex items-center">
                <Phone className="absolute left-3 h-4 w-4 text-muted pointer-events-none" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-xl border border-line bg-bg py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-muted/60 focus:border-primary focus:bg-surface focus:outline-none focus:ring-1 focus:ring-primary transition"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Email address
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 h-4 w-4 text-muted pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-line bg-bg py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-muted/60 focus:border-primary focus:bg-surface focus:outline-none focus:ring-1 focus:ring-primary transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 h-4 w-4 text-muted pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary-dark transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create {role === "people" ? "Passenger" : role === "driver" ? "Driver" : "Admin"} Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Log in prompt */}
          <p className="mt-6 text-center text-xs text-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
