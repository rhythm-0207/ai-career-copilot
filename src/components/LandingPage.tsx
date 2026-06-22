import { motion } from "motion/react";
import { Brain, Star, Rocket, Sparkles, Target, Zap, ArrowRight, Shield, RefreshCw } from "lucide-react";

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-indigo-900/10 via-purple-900/5 to-transparent pointer-events-none" />
      
      {/* Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-900 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate("landing")}>
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
              CareerCopilot
            </span>
            <span className="hidden sm:inline bg-indigo-900/40 text-indigo-400 text-xs px-2.5 py-0.5 rounded-full font-medium border border-indigo-500/20">
              MVP Platform
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => onNavigate("login")}
              className="text-slate-400 hover:text-white font-medium text-sm transition-colors py-2 px-4"
              id="nav-login-btn"
            >
              Sign In
            </button>
            <button
              onClick={() => onNavigate("register")}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
              id="nav-register-btn"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 px-6 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Generation Career Intelligence Platform</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1]">
            Your AI-Powered <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-600">Career Strategy Engine</span>
          </h1>

          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Tailor your profile, master challenging interviews, and discover high-impact career pivots powered by the advanced intelligence of Gemini AI.
          </p>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate("register")}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base px-8 py-4 rounded-xl transition-all shadow-xl shadow-indigo-500/20 group"
              id="hero-cta-btn"
            >
              <span>Build My Campaign</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => onNavigate("login")}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-white font-semibold text-base px-8 py-4 rounded-xl transition-colors border border-slate-800"
            >
              Live Demo Access
            </button>
          </div>
        </motion.div>

        {/* Feature Highlights Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-4 gap-8 text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/80 hover:border-indigo-500/30 transition-all card-glow"
          >
            <div className="w-12 h-12 bg-indigo-900/50 rounded-xl flex items-center justify-center text-indigo-400 mb-5 border border-indigo-500/20">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Targeted Fit Analysis</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Scan your professional credentials against any target role to pinpoint core skill gaps and formulate custom immediate action maps.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/80 hover:border-purple-500/30 transition-all card-glow"
          >
            <div className="w-12 h-12 bg-purple-900/50 rounded-xl flex items-center justify-center text-purple-400 mb-5 border border-purple-500/20">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">ATS Resume Optimizer</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Refactor critical metrics and bullet points side-by-side using key-phrase modeling for maximum hiring manager conversion rates.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/80 hover:border-indigo-500/30 transition-all card-glow"
          >
            <div className="w-12 h-12 bg-indigo-900/50 rounded-xl flex items-center justify-center text-indigo-400 mb-5 border border-indigo-500/20">
              <Star className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Interactive Mock Prep</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Generate interview questions customized to your seniority. Receive instant, performance-enhancing feedback on your responses.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/80 hover:border-purple-500/30 transition-all card-glow"
          >
            <div className="w-12 h-12 bg-purple-900/50 rounded-xl flex items-center justify-center text-purple-400 mb-5 border border-purple-500/20">
              <Rocket className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Adjacent Career Pivot</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Analyze latent strengths to navigate adjacent industry roles, complete with step-by-step milestones and risk analytics.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Trust & Stats Section */}
      <section className="bg-slate-900/30 border-t border-b border-slate-900 py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">
              Maximize Career Potential
            </h2>
            <p className="text-slate-400 max-w-lg text-sm md:text-base">
              The smartest candidates don't work harder, they leverage intelligent positioning. Get a complete mock-interview team in your corner.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-12">
            <div className="space-y-1">
              <div className="text-4xl font-extrabold text-indigo-400">18%</div>
              <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Average Raise</div>
            </div>
            <div className="space-y-1">
              <div className="text-4xl font-extrabold text-purple-400">3x</div>
              <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Response Speed</div>
            </div>
            <div className="space-y-1">
              <div className="text-4xl font-extrabold text-indigo-400">95%</div>
              <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold">ATS Fit Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Mock Console Demo Preview */}
      <section className="py-24 px-6 max-w-7xl mx-auto text-center">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Live Copilot Playground Preview</h2>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
            Take a look at how Sarah Jenkins optimized her AI Product Management path below.
          </p>
        </div>
        
        <div className="bg-slate-900 rounded-3xl border border-slate-800 text-left overflow-hidden shadow-2xl relative">
          <div className="bg-slate-950 px-6 py-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500/80 rounded-full" />
              <div className="w-3 h-3 bg-yellow-500/80 rounded-full" />
              <div className="w-3 h-3 bg-green-500/80 rounded-full" />
              <span className="text-xs text-slate-500 font-mono pl-3">copilot-client://dashboard/demo</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs text-slate-500 font-mono">Mock Authenticated</span>
            </div>
          </div>
          
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 font-mono">
            {/* Left preview pane */}
            <div className="md:col-span-4 bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Candidate Profile</div>
              <div className="space-y-3 text-xs text-slate-300">
                <div><span className="text-slate-500">Name:</span> Sarah Jenkins</div>
                <div><span className="text-slate-500">Target Role:</span> Senior AI Product Manager</div>
                <div><span className="text-slate-500">Skills:</span> Product Strategy, ML Ops, SQL, Agile</div>
                <div><span className="text-slate-500">Focus:</span> Foundation Model tools</div>
              </div>
              <div className="pt-2 border-t border-slate-900">
                <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
                  <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                  <span>Interactive connection live</span>
                </div>
              </div>
            </div>

            {/* Right analysis output */}
            <div className="md:col-span-8 space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800 text-xs">
              <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>Gemini Analysis Response</span>
              </div>
              
              <div className="space-y-3.5 text-xs">
                <div className="flex items-center space-x-2 bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-900/30">
                  <span className="bg-indigo-600 text-white text-[10px] py-0.5 px-2 rounded">Role Fit Score: 87%</span>
                  <span className="text-slate-400">Perfect entry level match standard. Ready for Senior targets.</span>
                </div>
                
                <div className="space-y-1.5">
                  <div className="text-slate-400 font-bold">&#10003; Recommended Skills To Acquire:</div>
                  <div className="text-slate-300 pl-4 space-y-1">
                    <div>1. Triton Inference Servers & PyTorch tooling concepts.</div>
                    <div>2. Cost-efficiency modeling for LLM token rate limits.</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-slate-400 font-bold">&#10003; Strategic Action Plan:</div>
                  <div className="text-slate-300 pl-4 text-[11px] leading-relaxed">
                    "Leverage your extensive analytics core background (Fintech). Frame your database optimization experience as specialized data curation for prompt pipelines during current networking chats."
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <button
            onClick={() => onNavigate("register")}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base px-10 py-4 rounded-xl transition-all shadow-xl shadow-indigo-600/20"
          >
            Create Your Own Campaign Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-slate-500 text-xs">
          <div>
            &copy; 2026 AI Career Copilot Platform MVP. Dedicated to Career Craftsmanship & Actionable Intel.
          </div>
          <div className="flex space-x-6">
            <span className="hover:text-slate-300 cursor-pointer">Terms</span>
            <span className="hover:text-slate-300 cursor-pointer">Privacy</span>
            <span className="hover:text-slate-300 cursor-pointer">Docs</span>
            <span className="hover:text-slate-300 text-indigo-400 font-semibold cursor-pointer" onClick={() => onNavigate("login")}>
              Sarah's Quick Login &rarr;
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
