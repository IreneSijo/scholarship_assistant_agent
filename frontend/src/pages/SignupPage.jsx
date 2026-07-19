import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

/**
 * SignupPage
 * Same split-panel layout and styling as LoginPage, with the
 * extra fields a new account needs.
 */
export default function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!fullName || !email || !password || !confirmPassword) {
      setError("Fill in every field to create your account.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Replace with your real signup call, e.g.:
      // const res = await fetch("/api/auth/signup", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ fullName, email, password }),
      // });
      // if (!res.ok) throw new Error("Couldn't create your account.");
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
      {/* Left brand panel - same navy as the sidebar */}
      <div className="hidden lg:flex lg:w-[38%] bg-[#0F1F35] flex-col justify-between px-12 py-14">
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
            Get started
          </p>
          <h2 className="font-display text-3xl text-white leading-snug mb-4">
            Build your profile once. Let the agent do the rest.
          </h2>
          <p className="text-[#A9B4C4] text-sm leading-relaxed">
            Tell us about your academics and identity, and the agent will
            match you to scholarships and pre-fill applications for you.
          </p>
        </div>
      </div>

      {/* Right form panel */}
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
            Sign up
          </p>
          <h1 className="font-display text-3xl text-[#1A2B47] mb-2">
            Create your account
          </h1>
          <p className="text-[#5B6472] text-sm mb-8">
            It only takes a minute to get started.
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
                htmlFor="fullName"
                className="block text-[11px] tracking-widest uppercase text-[#5B6472] mb-2"
              >
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-md border border-[#D8D3C6] px-3 py-2.5 text-[#1A2B47]
                           placeholder:text-[#A6A296] focus:outline-none focus:ring-2
                           focus:ring-[#D4A24C]/40 focus:border-[#D4A24C]"
              />
            </div>

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

            <div className="mb-5">
              <label
                htmlFor="password"
                className="block text-[11px] tracking-widest uppercase text-[#5B6472] mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
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

            <div className="mb-6">
              <label
                htmlFor="confirmPassword"
                className="block text-[11px] tracking-widest uppercase text-[#5B6472] mb-2"
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full rounded-md border border-[#D8D3C6] px-3 py-2.5 text-[#1A2B47]
                           placeholder:text-[#A6A296] focus:outline-none focus:ring-2
                           focus:ring-[#D4A24C]/40 focus:border-[#D4A24C]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-[#0F1F35] text-white font-medium py-2.5
                         hover:bg-[#16304F] transition-colors disabled:opacity-60
                         disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-[#5B6472] mt-6">
            Already have an account?{" "}
            <Link to="/" className="text-[#B08A3E] font-medium hover:text-[#8F6E2F]">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
