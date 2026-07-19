import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

/**
 * HomePage
 * Public landing page that doubles as the login screen.
 * Left panel: marketing hero (brand, pitch, feature highlights).
 * Right panel: login form. On success, redirects to /dashboard.
 */
export default function HomePage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Enter your email and password to continue.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Replace with your real auth call, e.g.:
      // const res = await fetch("/api/auth/login", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ email, password, remember }),
      // });
      // if (!res.ok) throw new Error("Invalid email or password.");
      // const data = await res.json();
      // storeSession(data);

      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F5F1E8]">
      {/* Left marketing panel - same navy as the sidebar */}
      <div className="hidden lg:flex lg:w-[42%] bg-[#0F1F35] flex-col justify-between px-12 py-14">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="ScholarMate logo"
            className="w-10 h-10 rounded-full object-cover"
          />
          <span className="text-white font-display text-lg leading-tight">
            ScholarMate
          </span>
        </div>

        <div className="max-w-sm">
          <p className="text-[11px] tracking-widest uppercase text-[#D4A24C] mb-4">
            AI-powered scholarship agent
          </p>
          <h1 className="font-display text-3xl text-white leading-snug mb-4">
            Never miss a scholarship you're eligible for.
          </h1>
          <p className="text-[#A9B4C4] text-sm leading-relaxed mb-10">
            Build your profile once. The agent checks eligibility, tracks
            deadlines, and pre-fills applications across every scholarship
            that fits you.
          </p>

          <div className="space-y-4">
            {[
              {
                title: "One profile",
                body: "Your academics, identity, and documents in one place.",
              },
              {
                title: "Automatic matching",
                body: "Eligibility checked against every scholarship it finds.",
              },
              {
                title: "Pre-filled applications",
                body: "Forms populated for you, ready to review and submit.",
              },
            ].map((f) => (
              <div key={f.title} className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#D4A24C] mt-2 flex-shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">{f.title}</p>
                  <p className="text-[#A9B4C4] text-xs leading-relaxed">
                    {f.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-14">
        <div className="w-full max-w-md">
          {/* Mobile-only brand mark */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <img
              src={logo}
              alt="ScholarMate logo"
              className="w-10 h-10 rounded-full object-cover"
            />
            <span className="text-[#0F1F35] font-display text-lg leading-tight">
              ScholarMate
            </span>
          </div>

          <p className="text-[11px] tracking-widest uppercase text-[#B08A3E] font-semibold mb-2">
            Sign in
          </p>
          <h2 className="font-display text-3xl text-[#1A2B47] mb-2">
            Welcome back
          </h2>
          <p className="text-[#5B6472] text-sm mb-8">
            Enter your email and password to access your dashboard.
          </p>

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl border border-[#E7E2D6] p-8 shadow-sm"
            noValidate
          >
            {error && (
              <div className="mb-5 rounded-lg border border-[#E9C9C9] bg-[#FBEFEF] px-4 py-3 text-sm text-[#9C3B3B]">
                {error}
              </div>
            )}

            <div className="mb-5">
              <label
                htmlFor="email"
                className="block text-[11px] tracking-widest uppercase text-[#5B6472] mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-md border border-[#D8D3C6] px-3 py-2.5 text-[#1A2B47]
                           placeholder:text-[#A6A296] focus:outline-none focus:ring-2
                           focus:ring-[#D4A24C]/40 focus:border-[#D4A24C]"
              />
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-[11px] tracking-widest uppercase text-[#5B6472]"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#B08A3E] hover:text-[#8F6E2F]"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-md border border-[#D8D3C6] px-3 py-2.5 pr-16 text-[#1A2B47]
                             placeholder:text-[#A6A296] focus:outline-none focus:ring-2
                             focus:ring-[#D4A24C]/40 focus:border-[#D4A24C]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#5B6472] hover:text-[#1A2B47]"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 mb-6 mt-4 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-[#D8D3C6] text-[#D4A24C] focus:ring-[#D4A24C]/40"
              />
              <span className="text-sm text-[#5B6472]">Keep me signed in</span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-[#0F1F35] text-white font-medium py-2.5
                         hover:bg-[#16304F] transition-colors disabled:opacity-60
                         disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-[#5B6472] mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-[#B08A3E] font-medium hover:text-[#8F6E2F]">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
