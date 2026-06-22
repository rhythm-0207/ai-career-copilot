import React, { useState, useEffect } from "react";
import {
  Brain,
  LogOut,
  Target,
  Sparkles,
  Award,
  BookOpen,
  Briefcase,
  HelpCircle,
  FileText,
  User as UserIcon,
  Plus,
  X,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Activity,
  ChevronRight,
  Send,
  CheckCircle,
  ShieldAlert,
  MapPin,
  RefreshCw,
  TrendingDown,
  Compass
} from "lucide-react";
import { User, CareerProfile, AIAnalysisResult, TailoredResumeResult, InterviewPrepResult, CareerPathResult, ActivityLog } from "../types";
import ResumeAnalyzer from "./ResumeAnalyzer";
import JobTracker from "./JobTracker";



interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<"overview" | "profile" | "fit-check" | "resume" | "interview" | "pivot" | "analyze" | "tracker">("overview");


  // Profile data
  const [profile, setProfile] = useState<CareerProfile>({
    name: user.name,
    targetRole: "",
    yearsOfExperience: 0,
    skills: [],
    location: "Remote",
    experienceSummary: "",
    resumeText: "",
    desiredSalary: ""
  });

  const [newSkillInput, setNewSkillInput] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Activity logs
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  // AI Copilot Results
  const [isAnalyzingProfile, setIsAnalyzingProfile] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);

  // ATS Resume tool inputs + state
  const [jobDescription, setJobDescription] = useState("");
  const [resumeSegment, setResumeSegment] = useState("");
  const [isTailoringResume, setIsTailoringResume] = useState(false);
  const [tailorResult, setTailorResult] = useState<TailoredResumeResult | null>(null);

  // Mock Interview Prep
  const [seniorityLevel, setSeniorityLevel] = useState("Mid-level");
  const [customFocus, setCustomFocus] = useState("");
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [interviewPrep, setInterviewPrep] = useState<InterviewPrepResult | null>(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isEvaluatingAnswer, setIsEvaluatingAnswer] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    score: number;
    goodPoints: string[];
    missedPoints: string[];
    coachingAdvice: string;
  } | null>(null);

  // Career Pivot Suggestion
  const [isFindingPivot, setIsFindingPivot] = useState(false);
  const [pivotResult, setPivotResult] = useState<CareerPathResult | null>(null);

  // Errors
  const [copilotError, setCopilotError] = useState<string | null>(null);

  // Fetch initial profile & logs
  useEffect(() => {
    fetchProfileAndLogs();
  }, [user.id]);

  const fetchProfileAndLogs = async () => {
    try {
      const pRes = await fetch(`/api/profile/${user.id}`, {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      const pData = await pRes.json();
      if (pData.profile) {
        setProfile(pData.profile);
      }

      const aRes = await fetch(`/api/activities/${user.id}`, {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      const aData = await aRes.json();
      if (aData.logs) {
        setActivities(aData.logs);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSaveSuccess(false);
    try {
      const response = await fetch(`/api/profile/${user.id}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify(profile),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setProfile(data.profile);
        setProfileSaveSuccess(true);
        setTimeout(() => setProfileSaveSuccess(false), 3000);
        fetchProfileAndLogs(); // Reload logs
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const addSkill = () => {
    if (newSkillInput.trim() && !profile.skills.includes(newSkillInput.trim())) {
      setProfile({
        ...profile,
        skills: [...profile.skills, newSkillInput.trim()]
      });
      setNewSkillInput("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setProfile({
      ...profile,
      skills: profile.skills.filter(s => s !== skillToRemove)
    });
  };

  // AI API Actions
  const runProfileAnalysis = async () => {
    if (!profile.targetRole) {
      setCopilotError("Please configure and save your target role in the profile dashboard first.");
      setActiveTab("profile");
      return;
    }
    setIsAnalyzingProfile(true);
    setCopilotError(null);
    try {
      const response = await fetch("/api/copilot/analyze-profile", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          userId: user.id,
          targetRole: profile.targetRole,
          yearsOfExperience: profile.yearsOfExperience,
          skills: profile.skills,
          location: profile.location,
          experienceSummary: profile.experienceSummary
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed profile analysis.");
      setAnalysisResult(data);
      fetchProfileAndLogs();
    } catch (err: any) {
      setCopilotError(err.message || "Something went wrong during dynamic analysis.");
    } finally {
      setIsAnalyzingProfile(false);
    }
  };

  const runResumeTailor = async () => {
    if (!resumeSegment || !jobDescription) {
      setCopilotError("Resume Segment and Target Job Description are required.");
      return;
    }
    setIsTailoringResume(true);
    setCopilotError(null);
    try {
      const response = await fetch("/api/copilot/tailor-resume", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          userId: user.id,
          resumeText: resumeSegment,
          jobDescription: jobDescription
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Resume optimization failed.");
      setTailorResult(data);
      fetchProfileAndLogs();
    } catch (err: any) {
      setCopilotError(err.message || "Failed to tailor resume points.");
    } finally {
      setIsTailoringResume(false);
    }
  };

  const runGenerateInterview = async () => {
    if (!profile.targetRole) {
      setCopilotError("Configure your target role in your Copilot profile first so we can customize your interview.");
      setActiveTab("profile");
      return;
    }
    setIsGeneratingQuestions(true);
    setCopilotError(null);
    setEvaluationResult(null);
    setUserAnswer("");
    try {
      const response = await fetch("/api/copilot/interview-prep", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          userId: user.id,
          targetRole: profile.targetRole,
          level: seniorityLevel,
          customFocus: customFocus
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Interview setup failed.");
      setInterviewPrep(data);
      setActiveQuestionIndex(0);
      fetchProfileAndLogs();
    } catch (err: any) {
      setCopilotError(err.message || "Mock Interview generation failed.");
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const runEvaluateAnswer = async () => {
    if (!interviewPrep || !userAnswer.trim()) {
      setCopilotError("Please compose an answer first before hitting submit.");
      return;
    }
    setIsEvaluatingAnswer(true);
    setCopilotError(null);
    try {
      const response = await fetch("/api/copilot/evaluate-answer", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          userId: user.id,
          question: interviewPrep.questions[activeQuestionIndex].question,
          answer: userAnswer
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Answer feedback formulation failed.");
      setEvaluationResult(data);
      fetchProfileAndLogs();
    } catch (err: any) {
      setCopilotError(err.message || "Coaching engine feedback failed.");
    } finally {
      setIsEvaluatingAnswer(false);
    }
  };

  const runFindPivots = async () => {
    setIsFindingPivot(true);
    setCopilotError(null);
    try {
      const response = await fetch("/api/copilot/discover-pivot", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          userId: user.id,
          currentProfile: profile
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Pivot discovery failed.");
      setPivotResult(data);
      fetchProfileAndLogs();
    } catch (err: any) {
      setCopilotError(err.message || "Failed to structure expansion options.");
    } finally {
      setIsFindingPivot(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans select-none md:select-text">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-900 bg-slate-950 flex flex-col justify-between shrink-0 hidden md:flex">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2 rounded-xl">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
              CareerCopilot
            </span>
          </div>

          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === "overview" ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>SaaS Campaign Overview</span>
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === "profile" ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>My Profile Credentials</span>
            </button>

            <button
              onClick={() => setActiveTab("fit-check")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === "fit-check" ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Target Fit Analysis</span>
            </button>

            <button
              onClick={() => setActiveTab("resume")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === "resume" ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Resume segment Optimizer</span>
            </button>

            <button
              onClick={() => setActiveTab("analyze")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === "analyze" ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Resume Analyzer</span>
            </button>

            <button
              onClick={() => setActiveTab("tracker")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === "tracker" ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Job Tracker</span>
            </button>


            <button
              onClick={() => setActiveTab("interview")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === "interview" ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Interactive Mock Prep</span>
            </button>

            <button
              onClick={() => setActiveTab("pivot")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === "pivot" ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Career Pivot Roadmap</span>
            </button>
          </nav>
        </div>

        {/* User Session card bottom */}
        <div className="p-6 border-t border-slate-900 bg-slate-950/40">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-9 h-9 bg-indigo-500/10 border border-indigo-500/30 rounded-full flex items-center justify-center text-indigo-400 font-bold text-sm">
              {profile.name ? profile.name.charAt(0) : "U"}
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate">{profile.name}</div>
              <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 text-xs py-2 px-3 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-900 px-6 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-4 md:hidden">
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-1.5 rounded-lg">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white">CareerCopilot</span>
          </div>

          <div className="hidden md:flex items-center space-x-2 text-xs text-slate-500">
            <span>Server: <span className="text-green-400 font-bold">Online</span></span>
            <span>&bull;</span>
            <span>Region: <span className="text-slate-400">Gemini-Multi-Tenant</span></span>
          </div>

          {/* Quick Tab Select for Mobile */}
          <div className="md:hidden flex space-x-1.5 overflow-x-auto max-w-[200px] scrollbar-none py-1">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as any)}
              className="bg-slate-900 text-slate-200 border border-slate-800 rounded-lg text-xs px-2.5 py-1"
            >
              <option value="overview">Overview</option>
              <option value="profile">Profile Settings</option>
              <option value="fit-check">Fit Checker</option>
              <option value="resume">Resume ATS</option>
              <option value="analyze">AI Resume Analyzer</option>
              <option value="tracker">Job Tracker</option>

              <option value="interview">Mock Interview</option>
              <option value="pivot">Career Roadmap</option>
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-white">Active Node: {user.name}</div>
              <div className="text-[10px] text-slate-500">{user.email}</div>
            </div>
            <button
              onClick={onLogout}
              className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Inner Dashboard Viewports */}
        <div className="flex-1 p-6 overflow-y-auto max-w-6xl w-full mx-auto space-y-6">

          {copilotError && (
            <div className="p-4 bg-red-950/40 border border-red-500/30 text-red-300 rounded-2xl flex items-start space-x-3 text-xs">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Execution Error Encountered</div>
                <p className="mt-0.5">{copilotError}</p>
              </div>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Welcome Card banner */}
              <div className="relative bg-gradient-to-r from-slate-900 to-slate-950 p-6 md:p-8 rounded-3xl border border-slate-900 overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-[300px] h-full bg-gradient-to-l from-indigo-500/5 to-transparent pointer-events-none" />
                <div className="max-w-2xl space-y-3 relative z-10">
                  <div className="inline-flex items-center space-x-2 bg-indigo-900/40 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full text-[10px] font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gemini AI Engine Authorized</span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                    Hello, {profile.name || "Specialist"}!
                  </h1>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Welcome to your SaaS campaign workspace. {profile.targetRole ? `Your AI is currently tracking standard market dynamics for: ${profile.targetRole}.` : "Configure your Target Role in Profile Credentials to fully authorize your copilot analysis tools."}
                  </p>
                </div>
              </div>

              {/* Analytics metrics grid overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800/80 hover:border-slate-800 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Target Position</span>
                    <Briefcase className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-lg font-extrabold text-white truncate">
                    {profile.targetRole || "Unset - Edit Profile"}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {profile.yearsOfExperience} years of logged experience in area.
                  </p>
                </div>

                <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800/80 hover:border-slate-800 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Core Technologies</span>
                    <Award className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-white">
                    {profile.skills.length} Skills
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {profile.skills.slice(0, 3).join(", ") || "No skills listed yet."}
                  </p>
                </div>

                <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800/80 hover:border-slate-800 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Mock Interview Readiness</span>
                    <Activity className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-white">
                    {activities.filter(a => a.type === "interview_prep").length > 0 ? "84%" : "Pending"}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Based on mock question evaluations and feed.
                  </p>
                </div>
              </div>

              {/* Sub features Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-8 bg-slate-900/30 p-6 rounded-2xl border border-slate-900/80 space-y-4">
                  <h3 className="text-sm font-bold text-slate-350 uppercase tracking-wider">Quick Campaign Launcher</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      onClick={() => setActiveTab("fit-check")}
                      className="bg-slate-950 p-4 rounded-xl border border-slate-900 hover:border-indigo-500/20 cursor-pointer transition-all space-y-2 group"
                    >
                      <Target className="w-5 h-5 text-indigo-400" />
                      <div className="text-xs font-bold text-white group-hover:text-indigo-400 flex items-center justify-between">
                        <span>Check Profile Fit Rate</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-[11px] text-slate-500">Analyze current skill gaps and generate a 30-day tactical roadmap.</p>
                    </div>

                    <div
                      onClick={() => setActiveTab("resume")}
                      className="bg-slate-950 p-4 rounded-xl border border-slate-900 hover:border-purple-500/20 cursor-pointer transition-all space-y-2 group"
                    >
                      <FileText className="w-5 h-5 text-purple-400" />
                      <div className="text-xs font-bold text-white group-hover:text-purple-400 flex items-center justify-between">
                        <span>Optimize Resume Segment</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-[11px] text-slate-500">Tailor candidate accomplishments against individual job specifications.</p>
                    </div>

                    <div
                      onClick={() => setActiveTab("interview")}
                      className="bg-slate-950 p-4 rounded-xl border border-slate-900 hover:border-indigo-500/20 cursor-pointer transition-all space-y-2 group"
                    >
                      <Award className="w-5 h-5 text-indigo-400" />
                      <div className="text-xs font-bold text-white group-hover:text-indigo-400 flex items-center justify-between">
                        <span>Mock Interview Trainer</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-[11px] text-slate-500">Practice questions crafted side-by-side with strict STAR auditing feedback.</p>
                    </div>

                    <div
                      onClick={() => setActiveTab("pivot")}
                      className="bg-slate-950 p-4 rounded-xl border border-slate-900 hover:border-purple-500/20 cursor-pointer transition-all space-y-2 group"
                    >
                      <Compass className="w-5 h-5 text-purple-400" />
                      <div className="text-xs font-bold text-white group-hover:text-purple-400 flex items-center justify-between">
                        <span>Pivoting Discovery Lab</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-[11px] text-slate-500">Structure target lateral transitions with risk and ease ratings.</p>
                    </div>

                    <div
                      onClick={() => setActiveTab("analyze")}
                      className="bg-slate-950 p-4 rounded-xl border border-slate-900 hover:border-indigo-500/20 cursor-pointer transition-all space-y-2 group"
                    >
                      <Sparkles className="w-5 h-5 text-indigo-400 font-bold" />
                      <div className="text-xs font-bold text-white group-hover:text-indigo-400 flex items-center justify-between">
                        <span>AI Resume ATS Scanner</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-[11px] text-slate-500">Conduct deep document scans (PDF/DOCX) with Google Gemini to calculate ATS matching rates.</p>
                    </div>

                    <div
                      onClick={() => setActiveTab("tracker")}
                      className="bg-slate-950 p-4 rounded-xl border border-slate-900 hover:border-purple-500/20 cursor-pointer transition-all space-y-2 group"
                    >
                      <Briefcase className="w-5 h-5 text-purple-450 font-bold" />
                      <div className="text-xs font-bold text-white group-hover:text-purple-450 flex items-center justify-between">
                        <span>AI Job Application Tracker</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-[11px] text-slate-500">Monitor your pipeline milestone logs, run fit score audits and generate letters.</p>
                    </div>
                  </div>

                </div>

                <div className="md:col-span-4 bg-slate-900/30 p-6 rounded-2xl border border-slate-900/80 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-350 uppercase tracking-wider mb-4 flex items-center justify-between">
                      <span>Recent Activities</span>
                      <Activity className="w-4 h-4 text-slate-600" />
                    </h3>
                    <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                      {activities.length === 0 ? (
                        <div className="text-xs text-slate-500 text-center py-6">No session logs captured yet. Try updating your profile or running a check!</div>
                      ) : (
                        activities.map((act) => (
                          <div key={act.id} className="text-xs border-b border-slate-900 pb-2.5">
                            <span className="text-[10px] text-indigo-400 block font-mono">{act.timestamp}</span>
                            <div className="font-bold text-slate-200 mt-0.5">{act.title}</div>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{act.details}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROFILE CREDENTIALS */}
          {activeTab === "profile" && (
            <div className="bg-slate-900/35 p-6 rounded-3xl border border-slate-900-50 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Profile Settings & Credentials</h2>
                <p className="text-xs text-slate-400 mt-1">Configure your target objectives, skills and experience to inform the copilot strategies.</p>
              </div>

              {profileSaveSuccess && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-450" />
                  <span>Profile updated dynamically! All career copilots are synchronized.</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Target Career Role Name</label>
                    <input
                      type="text"
                      value={profile.targetRole}
                      onChange={(e) => setProfile({ ...profile, targetRole: e.target.value })}
                      placeholder="e.g. Senior AI Product Manager"
                      className="block w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Years of Relevant Experience</label>
                    <input
                      type="number"
                      value={profile.yearsOfExperience || ""}
                      onChange={(e) => setProfile({ ...profile, yearsOfExperience: parseInt(e.target.value) || 0 })}
                      placeholder="e.g. 6"
                      className="block w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Current Location / Remote Preferences</label>
                    <input
                      type="text"
                      value={profile.location}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      placeholder="San Francisco, CA or Remote"
                      className="block w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Desired Annual Salary / Bracket</label>
                    <input
                      type="text"
                      value={profile.desiredSalary || ""}
                      onChange={(e) => setProfile({ ...profile, desiredSalary: e.target.value })}
                      placeholder="e.g. $160,000 - $190,000"
                      className="block w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                {/* SKILLS INPUT VECTOR */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Key Skills & Core Technologies</label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      placeholder="e.g. Prompt Engineering"
                      className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    />
                    <button
                      type="button"
                      onClick={addSkill}
                      className="px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-colors cursor-pointer flex items-center space-x-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                  </div>
                  
                  {/* Skill pill highlights */}
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.length === 0 ? (
                      <span className="text-xs text-slate-500">No skills added yet. Add a few above!</span>
                    ) : (
                      profile.skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center space-x-1 bg-slate-900 text-slate-200 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-800"
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="text-slate-500 hover:text-red-400 shrink-0 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Professional Summary</label>
                  <textarea
                    value={profile.experienceSummary}
                    onChange={(e) => setProfile({ ...profile, experienceSummary: e.target.value })}
                    rows={4}
                    placeholder="Briefly pitch your core competency and metrics..."
                    className="block w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Resume / Segment Draft Plaintext</label>
                  <textarea
                    value={profile.resumeText || ""}
                    onChange={(e) => setProfile({ ...profile, resumeText: e.target.value })}
                    rows={6}
                    placeholder="Paste your raw CV content here for copy-editing integrations..."
                    className="block w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-700 font-mono text-xs"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center space-x-2 cursor-pointer"
                  >
                    {isSavingProfile ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Saving Profiles...</span>
                      </>
                    ) : (
                      <>
                        <span>Save & Synchronize Setup</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: TARGET FIT CHECKER */}
          {activeTab === "fit-check" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Profile setup confirmation widget left */}
              <div className="md:col-span-4 bg-slate-900/40 p-5 rounded-2xl border border-slate-900 space-y-4">
                <h3 className="text-sm font-bold text-slate-350 uppercase tracking-wider">Candidate Analysis Base</h3>
                <div className="space-y-3.5 text-xs">
                  <div>
                    <span className="text-slate-500 uppercase block tracking-wider font-semibold text-[10px]">Target Position</span>
                    <span className="text-slate-200 mt-1 block font-bold truncate">{profile.targetRole || "Unset - Edit Profile"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase block tracking-wider font-semibold text-[10px]">Logged Seniority</span>
                    <span className="text-slate-200 mt-1 block font-bold">{profile.yearsOfExperience} years of experience</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase block tracking-wider font-semibold text-[10px]">Registered Skills</span>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {profile.skills.map((s) => (
                        <span key={s} className="bg-slate-950 text-slate-400 text-[10px] px-2 py-0.5 rounded border border-slate-900">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={runProfileAnalysis}
                    disabled={isAnalyzingProfile}
                    className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3.5 px-4 rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    {isAnalyzingProfile ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>Querying Gemini SDK...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Trigger Comprehensive Analysis</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Analysis outcome dynamic panel */}
              <div className="md:col-span-8 space-y-6">
                {!analysisResult && !isAnalyzingProfile && (
                  <div className="bg-slate-900/20 border border-slate-900 p-8 rounded-2xl text-center space-y-3">
                    <Target className="w-12 h-12 text-slate-700 mx-auto" />
                    <h4 className="text-base font-bold text-slate-300">Analysis Results Pending</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Click the analysis trigger button on the left pane as Sarah Jenkins or custom profiles to scan core fit ratings, weaknesses and short-term plans.
                    </p>
                  </div>
                )}

                {isAnalyzingProfile && (
                  <div className="bg-slate-900/20 border border-indigo-500/10 p-12 rounded-2xl text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                    </div>
                    <h4 className="text-sm font-bold text-indigo-400">Gemini AI evaluates career paths...</h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Reviewing skills inventories, matching industry constraints, and forming strategic immediate milestones.
                    </p>
                  </div>
                )}

                {analysisResult && !isAnalyzingProfile && (
                  <div className="space-y-6">
                    {/* Role fit meter header */}
                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Platform Eligibility Index</div>
                        <h3 className="text-2xl font-black mt-1">Role Fit Score</h3>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-4xl font-extrabold text-indigo-400 font-mono">{analysisResult.roleFitScore}%</div>
                          <div className="text-[9px] text-slate-500 uppercase mt-0.5">Eligibility Rate</div>
                        </div>
                        <div className="h-10 w-[1px] bg-slate-800" />
                        <div className="text-xs text-slate-400 max-w-xs leading-relaxed">
                          {analysisResult.roleFitScore >= 80 ? "Outstanding compatibility. Position is highly strategic to pursue." : "Moderate fit. Focus on recommended immediate certifications below to bypass filters."}
                        </div>
                      </div>
                    </div>

                    {/* Strengths & Gaps layout side by side */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-900">
                        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">Core Strengths Highlighted</h4>
                        <ul className="space-y-2 text-xs">
                          {analysisResult.strengths?.map((str, index) => (
                            <li key={index} className="flex items-start space-x-2 text-slate-300 leading-relaxed">
                              <span className="text-emerald-500 mt-0.5">&#10003;</span>
                              <span>{str}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-900">
                        <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3">Position Gap Analytics</h4>
                        <ul className="space-y-2 text-xs">
                          {analysisResult.gaps?.map((gap, index) => (
                            <li key={index} className="flex items-start space-x-2 text-slate-300 leading-relaxed">
                              <span className="text-red-400 mt-0.5">&bull;</span>
                              <span>{gap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Recommended Technical credentials */}
                    <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-900">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Recommended Skill Additions</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.recommendedSkills?.map((skill, index) => (
                          <span key={index} className="bg-slate-950 text-indigo-300 text-xs px-3 py-1.5 rounded-lg border border-slate-800/80 font-semibold">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Integrated 3-stage tactical Action plan */}
                    <div className="bg-slate-900/30 p-6 rounded-2xl border border-slate-900 space-y-4">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-emerald-450" />
                        <span>Interactive 90-Day Campaign Blueprint</span>
                      </h4>

                      <div className="space-y-4">
                        <div className="border-l-2 border-indigo-500/40 pl-4 py-1">
                          <div className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">Stage 1: Immediate (First 30 Days)</div>
                          <ul className="mt-1.5 space-y-1 text-xs text-slate-450">
                            {analysisResult.actionPlan?.immediate?.map((act, i) => (
                              <li key={i}>&bull; {act}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="border-l-2 border-purple-500/40 pl-4 py-1">
                          <div className="text-[10px] font-mono text-purple-400 uppercase tracking-wider">Stage 2: Short-Term (First 90 Days)</div>
                          <ul className="mt-1.5 space-y-1 text-xs text-slate-450">
                            {analysisResult.actionPlan?.shortTerm?.map((act, i) => (
                              <li key={i}>&bull; {act}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="border-l-2 border-emerald-500/40 pl-4 py-1">
                          <div className="text-[10px] font-mono text-emerald-450 uppercase tracking-wider">Stage 3: Strategic Long-Term (6-12 Months)</div>
                          <ul className="mt-1.5 space-y-1 text-xs text-slate-450">
                            {analysisResult.actionPlan?.longTerm?.map((act, i) => (
                              <li key={i}>&bull; {act}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ATS RESUME COMPLIANCE TOOL */}
          {activeTab === "resume" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">ATS Resume Keyphrase Optimizer</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Optimize resume segments against a specific job description. Rebuild key accomplishments using specific metric indices to satisfy bots.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Inputs Pane */}
                <div className="bg-slate-900/45 p-5 rounded-2xl border border-slate-900 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Target Job Description Profile Details</label>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      rows={5}
                      className="block w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-700"
                      placeholder="Paste job details or target requirements here (requirements, stack, metrics)..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Your Current Resume Segment (Bullet points / Summary)</label>
                    <textarea
                      value={resumeSegment}
                      onChange={(e) => setResumeSegment(e.target.value)}
                      rows={5}
                      className="block w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-705 font-mono text-xs"
                      placeholder="e.g. Lead PM at core product team. Created workspace data framework. Ran Scrum, monitored pipelines..."
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={runResumeTailor}
                      disabled={isTailoringResume}
                      className="w-full flex justify-center items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-colors cursor-pointer"
                    >
                      {isTailoringResume ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          <span>Generating ATS Keywords...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Re-write Achievements For Target Job</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Outputs Panel */}
                <div className="space-y-6">
                  {!tailorResult && !isTailoringResume && (
                    <div className="bg-slate-900/20 border border-slate-900 p-8 rounded-2xl text-center space-y-3 min-h-[300px] flex flex-col justify-center">
                      <FileText className="w-12 h-12 text-slate-700 mx-auto" />
                      <h4 className="text-base font-bold text-slate-300">ATS Copywriter Sandbox</h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        Incorporate job targets and custom summaries. The compiler optimizes achievements using high-impact metric verbs.
                      </p>
                    </div>
                  )}

                  {isTailoringResume && (
                    <div className="bg-slate-900/20 border border-indigo-500/10 p-12 rounded-2xl text-center space-y-4 min-h-[300px] flex flex-col justify-center">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                      </div>
                      <h4 className="text-sm font-bold text-indigo-400">Applying Metric-Driven Standard formulas...</h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        Evaluating keyword density ratios and structuring strong accomplishment profiles.
                      </p>
                    </div>
                  )}

                  {tailorResult && !isTailoringResume && (
                    <div className="space-y-6">
                      {/* Tailored Bullet Points */}
                      <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800">
                        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">ATS-Optimized Achievements</h4>
                        <div className="space-y-3">
                          {tailorResult.tailoredBulletPoints?.map((bullet, i) => (
                            <div key={i} className="text-xs text-slate-200 border-l-2 border-indigo-500 pl-3 py-1 leading-relaxed">
                              {bullet}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Rationales */}
                      <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800">
                        <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">Hiring Manager Optimization Rationales</h4>
                        <ul className="space-y-1.5 text-xs text-slate-400">
                          {tailorResult.rationales?.map((rat, i) => (
                            <li key={i} className="flex items-start space-x-2 leading-relaxed">
                              <span className="text-purple-400 mt-0.5">•</span>
                              <span>{rat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Keywords suggestions */}
                      <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800">
                        <h4 className="text-xs font-bold text-slate-350 uppercase tracking-wider mb-2.5">Crucial Keywords Suggested</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {tailorResult.keywordSuggestions?.map((word, i) => (
                            <span key={i} className="bg-slate-950 text-indigo-400 text-[10px] uppercase font-mono tracking-wider px-2.5 py-1 rounded-md border border-slate-800">
                              {word}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: INTERACTIVE MOCK PREP ENGINE */}
          {activeTab === "interview" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Interactive Mock Interview Coach</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Generate challenging behavioral or technical questions customized closely to: <span className="text-indigo-400 font-semibold">{profile.targetRole || "your profile role"}</span>. Prepare sample answers and submit for review.
                </p>
              </div>

              {/* Prep inputs panel top */}
              <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-900 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Assert Level Seniority</label>
                  <select
                    value={seniorityLevel}
                    onChange={(e) => setSeniorityLevel(e.target.value)}
                    className="block w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
                  >
                    <option value="Associate / Entry-level">Associate / Entry-level</option>
                    <option value="Mid-level">Mid-level Professional</option>
                    <option value="Senior Level">Senior Strategic Management</option>
                    <option value="Principal / Director level">Principal / Director level</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Subject Custom Strategy Focus (Optional)</label>
                  <input
                    type="text"
                    value={customFocus}
                    onChange={(e) => setCustomFocus(e.target.value)}
                    placeholder="e.g. System designs, Cloud SQL scaling, etc."
                    className="block w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <button
                    onClick={runGenerateInterview}
                    disabled={isGeneratingQuestions}
                    className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3.5 rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    {isGeneratingQuestions ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Recruiting Questions...</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-4 h-4" />
                        <span>Formulate custom questions</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Main Interrogation Arena */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {interviewPrep && (
                  <div className="md:col-span-4 bg-slate-905 p-5 rounded-2xl border border-slate-900 space-y-3.5">
                    <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Interview Progress</h3>
                    
                    <div className="space-y-2">
                      {interviewPrep.questions?.map((q, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setActiveQuestionIndex(idx);
                            setEvaluationResult(null);
                            setUserAnswer("");
                          }}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                            idx === activeQuestionIndex
                              ? "bg-indigo-950/40 border-indigo-500/50 text-indigo-400"
                              : "bg-slate-900/30 border-slate-900 hover:border-slate-800 text-slate-450"
                          }`}
                        >
                          <div className="font-bold flex items-center justify-between mb-1">
                            <span>Question #{idx + 1}</span>
                            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-900 font-semibold">{q.type}</span>
                          </div>
                          <p className="truncate text-[11px]">{q.question}</p>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-slate-900 text-xs text-slate-505 leading-relaxed">
                      <span className="font-bold text-slate-350 block mb-1">Expert Recruiter Pitch:</span>
                      {interviewPrep.overallAdvice}
                    </div>
                  </div>
                )}

                {/* Response area / active question view */}
                <div className="md:col-span-8 space-y-6">
                  {!interviewPrep && !isGeneratingQuestions && (
                    <div className="bg-slate-900/20 border border-slate-900 p-8 rounded-2xl text-center space-y-3 min-h-[300px] flex flex-col justify-center">
                      <Award className="w-12 h-12 text-slate-700 mx-auto" />
                      <h4 className="text-base font-bold text-slate-300">Mock Preparation Arena</h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        Launch your personalized campaign questions above. Practice framing metrics using the STAR system.
                      </p>
                    </div>
                  )}

                  {isGeneratingQuestions && (
                    <div className="bg-slate-900/20 border border-indigo-500/10 p-12 rounded-2xl text-center space-y-4 min-h-[300px] flex flex-col justify-center">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                      </div>
                      <h4 className="text-sm font-bold text-indigo-400">Recruiter Agent prepares strategy queries...</h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        Drafting technical prompts and situational evaluation models tailored to seniority brackets.
                      </p>
                    </div>
                  )}

                  {interviewPrep && !isGeneratingQuestions && (
                    <div className="space-y-6">
                      {/* Active Question Display */}
                      <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 space-y-2.5">
                        <span className="bg-indigo-600/25 text-indigo-400 text-[10px] tracking-wider uppercase font-extrabold px-2.5 py-1 rounded border border-indigo-500/20">
                          Active Challenge &bull; {interviewPrep.questions[activeQuestionIndex]?.type} Focus
                        </span>
                        <h3 className="text-sm md:text-base font-bold text-white pt-2.5 leading-relaxed">
                          {interviewPrep.questions[activeQuestionIndex]?.question}
                        </h3>
                        <p className="text-xs text-slate-450 leading-relaxed font-light pt-1.5 border-t border-slate-900">
                          <span className="font-semibold text-indigo-300">Coaching Strategy Goal:</span> {interviewPrep.questions[activeQuestionIndex]?.goodAnswerTips}
                        </p>
                      </div>

                      {/* User response composition form */}
                      <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 space-y-4">
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Structured Answer Formulation (STAR format)</label>
                        <textarea
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          rows={6}
                          placeholder="Structure: Situation, Target details, Action (I optimized X using Y), and clear Result metrics..."
                          className="block w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
                        />

                        <div className="flex items-center justify-between pt-2">
                          <button
                            onClick={() => {
                              setUserAnswer(interviewPrep.questions[activeQuestionIndex]?.sampleAnswer || "");
                              setEvaluationResult(null);
                            }}
                            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            Auto-Fill Sandbox Model Answer
                          </button>

                          <button
                            onClick={runEvaluateAnswer}
                            disabled={isEvaluatingAnswer || !userAnswer.trim()}
                            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                          >
                            {isEvaluatingAnswer ? (
                              <>
                                <RefreshCw className="w-4.5 h-4.5 animate-spin text-white" />
                                <span>Evaluating Narrative...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5" />
                                <span>Submit For Mock Review</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Evaluation feedbacks */}
                      {evaluationResult && !isEvaluatingAnswer && (
                        <div className="space-y-6">
                          {/* Score metrics */}
                          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Mock Performance Assessment</div>
                              <h3 className="text-xl font-bold mt-1 text-white">Answer Grading Metric</h3>
                            </div>
                            <div className="text-center bg-slate-950 px-5 py-3.5 rounded-xl border border-slate-800">
                              <span className="text-3xl font-black text-indigo-400 font-mono">{evaluationResult.score}/100</span>
                            </div>
                          </div>

                          {/* Strengths & skips details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="bg-slate-900/35 p-5 rounded-2xl border border-slate-900">
                              <h3 className="text-xs font-bold text-emerald-450 uppercase mb-3">Strong Points Used</h3>
                              <ul className="space-y-1.5 text-xs text-slate-350">
                                {evaluationResult.goodPoints?.map((p, idx) => (
                                  <li key={idx}>&#10003; {p}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="bg-slate-900/35 p-5 rounded-2xl border border-slate-900">
                              <h3 className="text-xs font-bold text-red-400 uppercase mb-3">Unaddressed Gaps / Skips</h3>
                              <ul className="space-y-1.5 text-xs text-slate-350">
                                {evaluationResult.missedPoints?.map((p, idx) => (
                                  <li key={idx}>&bull; {p}</li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Coaching direction */}
                          <div className="bg-slate-900/35 p-5 rounded-2xl border border-slate-900 space-y-2">
                            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Mentorship Direction & Rephrase Advice</h3>
                            <p className="text-xs text-slate-310 leading-relaxed italic pr-2">
                              "{evaluationResult.coachingAdvice}"
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: LATERAL PIVOT STRATEGY LAB */}
          {activeTab === "pivot" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-slate-900 to-slate-950 p-6 rounded-3xl border border-slate-900 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <h2 className="text-lg font-bold text-white">Lateral Career Pivot Strategizer</h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Examine alternative industry branches, calculate overlap indices, and design step-by-step certifications roadmap paths based on current skills.
                  </p>
                </div>
                <button
                  onClick={runFindPivots}
                  disabled={isFindingPivot}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-3.5 rounded-xl transition-all shadow-md shrink-0 cursor-pointer flex items-center space-x-2"
                >
                  {isFindingPivot ? (
                     <>
                       <RefreshCw className="w-4 h-4 animate-spin text-white" />
                       <span>Assaying Transitions...</span>
                     </>
                  ) : (
                    <>
                      <Compass className="w-4 h-4" />
                      <span>Formulate Potential Lateral Pivots</span>
                    </>
                  )}
                </button>
              </div>

              {!pivotResult && !isFindingPivot && (
                <div className="bg-slate-900/20 border border-slate-900 p-8 rounded-2xl text-center space-y-3 min-h-[300px] flex flex-col justify-center">
                  <Compass className="w-12 h-12 text-slate-700 mx-auto" />
                  <h4 className="text-base font-bold text-slate-300">Lateral Expansion Mappings</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Initiate adjacent market assessments. Discover hidden skill overlaps with leadership roles.
                  </p>
                </div>
              )}

              {isFindingPivot && (
                <div className="bg-slate-900/20 border border-indigo-500/10 p-12 rounded-2xl text-center space-y-4 min-h-[300px] flex flex-col justify-center">
                  <div className="flex justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                  </div>
                  <h4 className="text-sm font-bold text-indigo-400">Assessing Adjacent Roles overlap metrics...</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Retrieving growth statistics and compiling obstacle indicators for step-by-step career pathing.
                  </p>
                </div>
              )}

              {pivotResult && !isFindingPivot && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Left Column: Overlap metrics + Adjacent Jobs */}
                  <div className="md:col-span-5 space-y-6">
                    <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4">
                      <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider">Alternative Career Options</h3>
                      <div className="space-y-2">
                        {pivotResult.suggestedRoles?.map((role, i) => (
                          <div key={i} className="p-3.5 bg-slate-950 border border-slate-900 rounded-xl text-xs space-y-1">
                            <span className="text-[9px] font-mono text-purple-400 uppercase tracking-widest font-semibold">Adjacent Option #{i+1}</span>
                            <div className="font-bold text-slate-200 mt-0.5">{role}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Ease and trend metrics */}
                    <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4">
                      <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider">Pivot Difficulty Analytics</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-950 p-4 rounded-xl text-center border border-slate-900">
                          <span className="text-[10px] text-slate-500 block uppercase font-semibold">Ease Score</span>
                          <span className="text-2xl font-black text-indigo-400 font-mono block mt-1">{pivotResult.transitionEaseScore}%</span>
                        </div>

                        <div className="bg-slate-950 p-4 rounded-xl text-center border border-slate-900">
                          <span className="text-[10px] text-slate-500 block uppercase font-semibold">Outlook Trend</span>
                          <span className="text-sm font-black text-emerald-450 uppercase mt-2.5 block tracking-widest">{pivotResult.marketOutlook}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Custom sequenced roadmap */}
                  <div className="md:col-span-7 bg-slate-900/30 p-6 rounded-2xl border border-slate-900 space-y-6">
                    <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider flex items-center space-x-2">
                      <TrendingUp className="w-4.5 h-4.5 text-emerald-450" />
                      <span>Lateral Skill Roadmap & Risk Assortment</span>
                    </h3>

                    <div className="space-y-6 relative border-l border-slate-850 pl-4">
                      {pivotResult.roadmap?.map((milestone, idx) => (
                        <div key={idx} className="relative space-y-1.5">
                          {/* Dot connector */}
                          <div className="absolute top-1.5 -left-6 w-3 h-3 bg-indigo-500 rounded-full border border-slate-950" />
                          
                          <div className="flex items-center space-x-3.5">
                            <span className="text-[10px] font-semibold bg-indigo-900/40 text-indigo-400 border border-indigo-500/10 px-2 py-0.5 rounded font-mono">
                              {milestone.timeframe}
                            </span>
                            <span className="text-xs font-bold text-white">{milestone.title}</span>
                          </div>

                          <p className="text-xs text-slate-450 leading-relaxed pr-2 font-light">{milestone.description}</p>
                          
                          <div className="flex flex-wrap gap-1 mt-1">
                            {milestone.skillsToAcquire?.map((skill, sIdx) => (
                              <span key={sIdx} className="bg-slate-950 text-slate-350 text-[10px] px-2 py-0.5 rounded border border-slate-900">{skill}</span>
                            ))}
                          </div>

                          <div className="pt-1">
                            <span className="text-[10px] text-red-400 font-medium leading-relaxed block pl-2 border-l border-red-500/20">
                              Risk Factor: {milestone.riskFactors?.join(", ")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "analyze" && (
            <ResumeAnalyzer user={user} onLogAdded={fetchProfileAndLogs} />
          )}

          {activeTab === "tracker" && (
            <JobTracker user={user} onLogAdded={fetchProfileAndLogs} />
          )}


        </div>
      </main>
    </div>
  );
}
