import React, { useState } from "react";
import { Brain, Mail, Lock, ArrowRight, Info, AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "motion/react";

interface LoginPageProps {
  onNavigate: (page: string) => void;
  onLoginSuccess: (user: { id: string; name: string; email: string }) => void;
}

export default function LoginPage({ onNavigate, onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      onLoginSuccess(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setEmail("sarah@copilot.ai");
    setPassword("password123");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-center py-12 px-6 relative">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center space-x-3 cursor-pointer mb-6" onClick={() => onNavigate("landing")}>
          <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2.5 rounded-xl">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
            CareerCopilot
          </span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">
          Welcome back
        </h2>
        <p className="text-slate-400 text-sm">
          Access your AI strategy hub and mock interview metrics
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/80 backdrop-blur-sm py-8 px-6 sm:px-10 rounded-3xl border border-slate-800 shadow-2xl relative">
          
          {/* Quick Demo Helper Box */}
          <div className="mb-6 bg-indigo-950/40 p-4 rounded-xl border border-indigo-500/20 text-xs text-indigo-300">
            <div className="flex items-center space-x-2 font-bold mb-1.5 text-indigo-200">
              <Info className="w-4 h-4 text-indigo-400" />
              <span>Reviewer Sandbox Credentials</span>
            </div>
            <p className="mb-2 text-indigo-400">
              Use our pre-seeded data metrics to evaluate full integrations immediately!
            </p>
            <div className="flex items-center justify-between">
              <div>
                <div>Email: <span className="font-mono text-white">sarah@copilot.ai</span></div>
                <div>Password: <span className="font-mono text-white">password123</span></div>
              </div>
              <button
                type="button"
                onClick={handleQuickDemo}
                className="bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 font-bold px-3 py-1.5 rounded-lg border border-indigo-500/30 transition-colors cursor-pointer"
              >
                Auto-Fill Demo
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 bg-red-950/40 border border-red-500/30 p-3 rounded-xl flex items-start space-x-2.5 text-xs text-red-300"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Business Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="block w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                id="login-submit-btn"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying session...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Platform</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center text-xs text-slate-400">
            Don't have an account yet?{" "}
            <span
              onClick={() => onNavigate("register")}
              className="text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer transition-colors"
            >
              Start Free Campaign &rarr;
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
