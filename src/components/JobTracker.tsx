import React, { useState, useEffect } from "react";
import { 
  Briefcase, 
  Building2, 
  Calendar, 
  FileText, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XSquare, 
  Clock, 
  Search, 
  Sparkles, 
  Copy, 
  Check, 
  RefreshCw, 
  Bookmark, 
  Award, 
  ChevronRight, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  X,
  FileDown
} from "lucide-react";
import { User, JobApplication, JobStatus, JobFitAnalysisResult } from "../types";

interface JobTrackerProps {
  user: User;
  onLogAdded: () => void;
}

export default function JobTracker({ user, onLogAdded }: JobTrackerProps) {
  // Navigation sub-tabs inside Job Tracker
  const [activeSubTab, setActiveSubTab] = useState<"tracker" | "fit-studio">("tracker");

  // State
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitInProgress, setIsSubmitInProgress] = useState(false);
  const [trackerError, setTrackerError] = useState<string | null>(null);

  // Search and Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // App Modal Form fields
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobApplication | null>(null);
  const [formCompany, setFormCompany] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formStatus, setFormStatus] = useState<JobStatus>("Saved");
  const [formNotes, setFormNotes] = useState("");

  // AI Fit Suite fields
  const [aiJobDescription, setAiJobDescription] = useState("");
  const [aiCompany, setAiCompany] = useState("");
  const [aiTitle, setAiTitle] = useState("");

  const [isFitAnalyzing, setIsFitAnalyzing] = useState(false);
  const [fitResult, setFitResult] = useState<JobFitAnalysisResult | null>(null);
  const [fitError, setFitError] = useState<string | null>(null);

  const [isLetterGenerating, setIsLetterGenerating] = useState(false);
  const [coverLetterMarkdown, setCoverLetterMarkdown] = useState<string | null>(null);
  const [letterError, setLetterError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Fetch saved applications
  const fetchJobs = async () => {
    setIsLoading(true);
    setTrackerError(null);
    try {
      const res = await fetch(`/api/jobs/${user.id}`, {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (!res.ok) {
        throw new Error("Failed to load saved job applications.");
      }
      const data = await res.json();
      setJobs(data);
    } catch (err: any) {
      setTrackerError(err.message || "An issue occurred pulling saved jobs list.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();

    // Cache retrieval for AI Fit studies
    const savedFit = localStorage.getItem(`copilot_jobfit_${user.id}`);
    if (savedFit) {
      try {
        setFitResult(JSON.parse(savedFit));
      } catch (e) {}
    }
    const savedLetter = localStorage.getItem(`copilot_jobletter_${user.id}`);
    if (savedLetter) {
        setCoverLetterMarkdown(savedLetter);
    }
    const savedFitDesc = localStorage.getItem(`copilot_fitdesc_${user.id}`);
    if (savedFitDesc) {
      setAiJobDescription(savedFitDesc);
    }
  }, [user.id]);

  const handleOpenAddModal = () => {
    setEditingJob(null);
    setFormCompany("");
    setFormTitle("");
    setFormDescription("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormStatus("Saved");
    setFormNotes("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (job: JobApplication) => {
    setEditingJob(job);
    setFormCompany(job.companyName);
    setFormTitle(job.jobTitle);
    setFormDescription(job.jobDescription || "");
    setFormDate(job.applicationDate || "");
    setFormStatus(job.status);
    setFormNotes(job.notes || "");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingJob(null);
  };

  const handleSubmitJobForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCompany.trim() || !formTitle.trim()) {
      alert("Company Name and Job Title are required fields.");
      return;
    }

    setIsSubmitInProgress(true);
    try {
      const payload = {
        companyName: formCompany.trim(),
        jobTitle: formTitle.trim(),
        jobDescription: formDescription.trim(),
        applicationDate: formDate,
        status: formStatus,
        notes: formNotes.trim()
      };

      let response;
      if (editingJob) {
        // Update Job Request
        response = await fetch(`/api/jobs/${user.id}/${editingJob.id}`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Create Job Request
        response = await fetch(`/api/jobs/${user.id}`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.token}`
          },
          body: JSON.stringify(payload)
        });
      }

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Failed to process application changes.");
      }

      await fetchJobs();
      onLogAdded();
      handleCloseModal();
    } catch (err: any) {
      alert(err.message || "An error occurred writing data to tracker.");
    } finally {
      setIsSubmitInProgress(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job application tracker node?")) {
      return;
    }

    try {
      const res = await fetch(`/api/jobs/${user.id}/${jobId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${user.token}` }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete item.");
      }

      await fetchJobs();
      onLogAdded();
    } catch (err: any) {
      alert(err.message || "Could not complete application deletion.");
    }
  };

  // Run AI Job Alignment Audit
  const handleRunFitAnalysis = async () => {
    if (!aiJobDescription.trim()) {
      setFitError("Please paste a target job description description first.");
      return;
    }

    setIsFitAnalyzing(true);
    setFitError(null);
    try {
      // Persist pasted desc in cache for convenience
      localStorage.setItem(`copilot_fitdesc_${user.id}`, aiJobDescription);

      const response = await fetch("/api/copilot/analyze-job-fit", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          userId: user.id,
          jobDescription: aiJobDescription
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze target job alignment.");
      }

      setFitResult(data);
      localStorage.setItem(`copilot_jobfit_${user.id}`, JSON.stringify(data));
      onLogAdded(); // refresh global logs widget
    } catch (err: any) {
      setFitError(err.message || "Failed during Gemini job alignment processing.");
    } finally {
      setIsFitAnalyzing(false);
    }
  };

  // Run AI Custom Cover Letter Compiler
  const handleGenerateCoverLetter = async () => {
    if (!aiJobDescription.trim()) {
      setLetterError("Please input the target job description to build a custom cover letter.");
      return;
    }

    setIsLetterGenerating(true);
    setLetterError(null);
    try {
      localStorage.setItem(`copilot_fitdesc_${user.id}`, aiJobDescription);

      const response = await fetch("/api/copilot/generate-cover-letter", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          userId: user.id,
          jobDescription: aiJobDescription,
          companyName: aiCompany.trim() || undefined,
          jobTitle: aiTitle.trim() || undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to compile tailored cover letter.");
      }

      setCoverLetterMarkdown(data.coverLetter);
      localStorage.setItem(`copilot_jobletter_${user.id}`, data.coverLetter);
      onLogAdded();
    } catch (err: any) {
      setLetterError(err.message || "An issue occurred generating Cover Letter.");
    } finally {
      setIsLetterGenerating(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!coverLetterMarkdown) return;
    navigator.clipboard.writeText(coverLetterMarkdown);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!coverLetterMarkdown) return;
    const blob = new Blob([coverLetterMarkdown], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cover_letter_${aiCompany.toLowerCase().replace(/\s+/g, "_") || "tailored"}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Analytics calculator
  const totalCount = jobs.length;
  const savedCount = jobs.filter(j => j.status === "Saved").length;
  const appliedCount = jobs.filter(j => j.status === "Applied").length;
  const interviewCount = jobs.filter(j => j.status === "Interview").length;
  const rejectedCount = jobs.filter(j => j.status === "Rejected").length;
  const offerCount = jobs.filter(j => j.status === "Offer").length;

  // Search + Filter matching logic
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.notes || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Badge styler matching criteria
  const getStatusBadgeStyles = (status: JobStatus) => {
    switch (status) {
      case "Offer":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Interview":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      case "Applied":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "Rejected":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default: // Saved
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div id="job-tracker-module" className="space-y-6">
      {/* Tracker Module Title */}
      <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[250px] h-full bg-gradient-to-l from-indigo-500/5 to-transparent pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center space-x-1.5 bg-indigo-950/60 text-indigo-400 border border-indigo-500/10 px-2.5 py-1 rounded-full text-[10px] font-mono">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>AI Lifecycle Tracker Ready</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">Application Tracker & Alignment Studio</h2>
          <p className="text-slate-400 text-xs max-w-3xl leading-relaxed">
            Monitor and streamline pending jobs through real-time state metrics. 
            Evaluate immediate job description matches and compile tailored cover letters automatically on the fly powered by Google Gemini AI.
          </p>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex border-b border-slate-900/80">
        <button
          onClick={() => setActiveSubTab("tracker")}
          className={`pb-3 px-6 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-2 ${
            activeSubTab === "tracker"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-350"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Saved Applications ({jobs.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("fit-studio")}
          className={`pb-3 px-6 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-2 ${
            activeSubTab === "fit-studio"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-350"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Alignment & Letter Studio</span>
        </button>
      </div>

      {activeSubTab === "tracker" && (
        <div className="space-y-6">
          {/* Analytical Core Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            
            <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-900 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total</span>
              <div className="flex items-baseline space-x-1.5 mt-2">
                <span className="text-2xl font-black text-white font-mono">{totalCount}</span>
                <span className="text-[10px] text-slate-500">jobs</span>
              </div>
            </div>

            <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-900/80 flex flex-col justify-between">
              <div className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Applied</span>
              </div>
              <div className="flex items-baseline space-x-1.5 mt-2">
                <span className="text-2xl font-black text-indigo-400 font-mono">{appliedCount}</span>
                <span className="text-[10px] text-slate-500">({totalCount ? Math.round((appliedCount / totalCount) * 100) : 0}%)</span>
              </div>
            </div>

            <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-900/80 flex flex-col justify-between">
              <div className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Interviews</span>
              </div>
              <div className="flex items-baseline space-x-1.5 mt-2">
                <span className="text-2xl font-black text-sky-400 font-mono">{interviewCount}</span>
                <span className="text-[10px] text-slate-500">pending</span>
              </div>
            </div>

            <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-900/80 flex flex-col justify-between">
              <div className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Offers</span>
              </div>
              <div className="flex items-baseline space-x-1.5 mt-2">
                <span className="text-2xl font-black text-emerald-400 font-mono">{offerCount}</span>
                <span className="text-[10px] text-slate-500">won🏆</span>
              </div>
            </div>

            <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-900/80 flex flex-col justify-between col-span-2 md:col-span-1">
              <div className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-550" />
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Rejections</span>
              </div>
              <div className="flex items-baseline space-x-1.5 mt-2">
                <span className="text-2xl font-black text-red-400 font-mono">{rejectedCount}</span>
                <span className="text-[10px] text-slate-500">archived</span>
              </div>
            </div>

          </div>

          {/* Search, Filter & Add Header */}
          <div className="bg-slate-900/20 p-4 rounded-xl border border-slate-900 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto flex-1">
              {/* Search query box */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-650" />
                <input
                  type="text"
                  placeholder="Search by company, role titles, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 p-2.5 pl-9 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-0 transition-colors"
                />
              </div>

              {/* Status filter selection */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 p-2.5 rounded-xl text-xs text-slate-300 focus:outline-none transition-colors"
              >
                <option value="All">All Statuses</option>
                <option value="Saved">Saved</option>
                <option value="Applied">Applied</option>
                <option value="Interview">Interview</option>
                <option value="Offer">Offer</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-4 py-3 rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-lg shadow-indigo-600/10"
            >
              <Plus className="w-4 h-4" />
              <span>Add Job Target</span>
            </button>
          </div>

          {/* Loading States */}
          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto animate-duration-1000" />
              <p className="text-xs text-slate-500">Querying verified database...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-slate-900/10 border border-slate-900 p-12 rounded-3xl text-center space-y-4">
              <div className="bg-slate-950/40 p-4 rounded-full border border-slate-900 inline-block">
                <Search className="w-8 h-8 text-slate-800" />
              </div>
              <h4 className="text-sm font-black text-slate-300">No Target Match Files Found</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {searchQuery || statusFilter !== "All"
                  ? "Adjust matching filter criteria or clear the query string to retrieve all saved job tracker cards."
                  : "You haven't added any job applications yet! Tap 'Add Job Target' above to write card values and monitor status milestones."}
              </p>
            </div>
          ) : (
            /* Subscriptions Card Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJobs.map((job) => (
                <div 
                  key={job.id} 
                  className="bg-slate-900/35 border border-slate-850 hover:border-slate-800 p-5 rounded-2xl flex flex-col justify-between transition-all group relative hover:shadow-xl hover:shadow-indigo-950/5"
                >
                  {/* Status Tag positioned gracefully top-right */}
                  <div className="absolute top-5 right-5 flex items-center space-x-2">
                    <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border tracking-wide font-extrabold uppercase ${getStatusBadgeStyles(job.status)}`}>
                      {job.status}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Header */}
                    <div className="space-y-1 max-w-[80%]">
                      <div className="flex items-center space-x-1.5 text-slate-400">
                        <Building2 className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold text-slate-350">{job.companyName}</span>
                      </div>
                      <h3 className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors leading-snug">
                        {job.jobTitle}
                      </h3>
                    </div>

                    {/* Date Block */}
                    <div className="flex items-center text-[11px] text-slate-500 space-x-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Applied on: {job.applicationDate ? new Date(job.applicationDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : "Not specified"}</span>
                    </div>

                    {/* Description Segment Excerpt */}
                    {job.jobDescription && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed bg-slate-950/20 p-2.5 rounded-lg border border-slate-900/50">
                        {job.jobDescription}
                      </p>
                    )}

                    {/* Notes block */}
                    {job.notes && (
                      <div className="border-t border-slate-850 pt-3 mt-1.5">
                        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block mb-1">My Notes</span>
                        <p className="text-[11px] text-slate-400 font-light italic">"{job.notes}"</p>
                      </div>
                    )}
                  </div>

                  {/* Operation Control Bar */}
                  <div className="flex items-center justify-end space-x-2 border-t border-slate-850 pt-3 mt-4">
                    <button
                      onClick={() => {
                        // Prefill details into analysis form tab
                        setAiCompany(job.companyName);
                        setAiTitle(job.jobTitle);
                        setAiJobDescription(job.jobDescription || "");
                        setActiveSubTab("fit-studio");
                      }}
                      className="text-[10px] bg-slate-950 hover:bg-indigo-900/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/10 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all flex items-center space-x-1 font-bold mr-auto"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      <span>Run AI Fit Audit</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(job)}
                      className="text-[10px] bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-850 p-2 rounded-lg cursor-pointer transition-all flex items-center justify-center"
                      title="Edit application profile"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="text-[10px] bg-slate-950 hover:bg-red-950/30 text-rose-500 border border-slate-850 p-2 rounded-lg cursor-pointer transition-all flex items-center justify-center"
                      title="Delete entry card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Alignment Suite Tabs */}
      {activeSubTab === "fit-studio" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Input Panel Column: Span 5 */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-900 space-y-4">
              <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Job Description Lounge</span>
              </h3>

              <p className="text-[10px] text-slate-500 leading-normal">
                Input the target firm, job title parameters, and paste the raw description details to screen alignment matching matrices or generate complete cover letters.
              </p>

              {/* Optional Company and Title identifiers */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label htmlFor="ai-company" className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Company (Optional)</label>
                  <input
                    id="ai-company"
                    type="text"
                    placeholder="e.g. OpenAI"
                    value={aiCompany}
                    onChange={(e) => setAiCompany(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 text-xs px-3 py-2 rounded-xl text-white placeholder:text-slate-700 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="ai-title" className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Role Title (Optional)</label>
                  <input
                    id="ai-title"
                    type="text"
                    placeholder="e.g. Research PM"
                    value={aiTitle}
                    onChange={(e) => setAiTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 text-xs px-3 py-2 rounded-xl text-white placeholder:text-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* Text Description Box */}
              <div className="space-y-1.5">
                <label htmlFor="ai-jd-paster" className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Paste Job Description</label>
                <textarea
                  id="ai-jd-paster"
                  rows={9}
                  placeholder="Paste raw target requirements, key responsibilities list, or full job page description here..."
                  value={aiJobDescription}
                  onChange={(e) => {
                    setAiJobDescription(e.target.value);
                    localStorage.setItem(`copilot_fitdesc_${user.id}`, e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 text-xs text-slate-200 p-3.5 rounded-xl placeholder:text-slate-700 font-mono focus:outline-none resize-y"
                />
              </div>

              {/* Dynamic Operations */}
              <div className="grid grid-cols-2 gap-3.5 pt-1.5">
                <button
                  onClick={handleRunFitAnalysis}
                  disabled={isFitAnalyzing || !aiJobDescription.trim()}
                  className="bg-slate-950 hover:bg-slate-900 disabled:opacity-50 text-indigo-400 border border-indigo-500/20 hover:border-indigo-500 rounded-xl py-3 px-3.5 text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:cursor-not-allowed text-center"
                >
                  {isFitAnalyzing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Screening...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Audit Job Fit</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleGenerateCoverLetter}
                  disabled={isLetterGenerating || !aiJobDescription.trim()}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 hover:shadow-lg rounded-xl py-3 px-3.5 text-xs font-extrabold text-white transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:cursor-not-allowed text-center"
                >
                  {isLetterGenerating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Compiling...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 text-white" />
                      <span>Build Cover Letter</span>
                    </>
                  )}
                </button>
              </div>

              {fitError && (
                <div className="p-3 bg-red-950/20 border border-red-500/25 text-red-300 text-[10px] rounded-xl flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <span>{fitError}</span>
                </div>
              )}

              {letterError && (
                <div className="p-3 bg-red-950/20 border border-red-500/25 text-red-300 text-[10px] rounded-xl flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <span>{letterError}</span>
                </div>
              )}

            </div>
          </div>

          {/* Diagnostics Display Column: Span 7 */}
          <div className="lg:col-span-7 space-y-6">
            {!fitResult && !coverLetterMarkdown && !isFitAnalyzing && !isLetterGenerating && (
              <div className="bg-slate-900/20 border border-slate-900 p-12 rounded-3xl text-center space-y-4 min-h-[460px] flex flex-col justify-center items-center">
                <div className="bg-slate-950/40 p-4 rounded-full border border-slate-900">
                  <Sparkles className="w-10 h-10 text-slate-800" />
                </div>
                <h4 className="text-sm font-bold text-slate-300 font-mono">Select Studio Operation</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Provide typical details for any open job target description in the editor panel. 
                  Tap **Audit Job Fit** to calculate alignment scores, or trigger **Build Cover Letter** to generate highly persuasive, custom-tailored correspondence.
                </p>
              </div>
            )}

            {isFitAnalyzing && (
              <div className="bg-slate-900/20 border border-indigo-500/10 p-12 rounded-3xl text-center space-y-4 min-h-[460px] flex flex-col justify-center items-center">
                <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin" />
                <h4 className="text-sm font-bold text-slate-200">Gemini ATS Suitability Evaluator active</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Performing lexical comparisons, computing strength alignment points, identifying gap markers, and formatting suggestions layout...
                </p>
              </div>
            )}

            {isLetterGenerating && (
              <div className="bg-slate-900/20 border border-indigo-500/10 p-12 rounded-3xl text-center space-y-4 min-h-[460px] flex flex-col justify-center items-center">
                <RefreshCw className="w-12 h-12 text-purple-500 animate-spin" />
                <h4 className="text-sm font-bold text-slate-200">AI Tailored Cover Letter Compiler active</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Cross-referencing candidate profile, extracting landmark achievements, establishing modern confident tone directives, and compiling markdown file...
                </p>
              </div>
            )}

            {/* Render Fit Score Analysis */}
            {fitResult && !isFitAnalyzing && (
              <div className="space-y-6">
                
                {/* Visual scorecard */}
                <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-900 flex flex-col sm:flex-row items-center gap-6">
                  
                  {/* Circle score indicator */}
                  <div className="relative flex items-center justify-center shrink-0">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle cx="48" cy="48" r="40" className="stroke-slate-950 fill-none" strokeWidth="6" />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        className="stroke-indigo-500 fill-none transition-all duration-1000"
                        strokeWidth="6"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * fitResult.fitScore) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-2xl font-black text-white font-mono">{fitResult.fitScore}%</span>
                      <span className="text-[8px] text-slate-500 uppercase font-black block">Aligned</span>
                    </div>
                  </div>

                  {/* Summary analysis */}
                  <div className="space-y-1.5 text-center sm:text-left flex-1">
                    <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-widest block">Lexical Recruiter Match Score</span>
                    <h4 className="text-sm font-extrabold text-white">General Fit Grade Breakdown</h4>
                    <p className="text-slate-400 text-xs leading-relaxed font-light">
                      {fitResult.overallEvaluation}
                    </p>
                  </div>
                </div>

                {/* Strengths & Missing section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Strengths Card */}
                  <div className="p-4 bg-slate-900/30 rounded-xl border border-slate-900 space-y-3">
                    <span className="text-[10px] font-mono text-emerald-450 uppercase tracking-widest font-extrabold block">
                      👍 Core Alignment Strengths ({fitResult.strengths?.length || 0})
                    </span>
                    <ul className="space-y-2">
                      {fitResult.strengths && fitResult.strengths.length > 0 ? (
                        fitResult.strengths.map((str, idx) => (
                          <li key={idx} className="text-[11px] text-slate-350 bg-slate-950/20 p-2.5 rounded-lg border border-slate-950/50 flex items-start space-x-2">
                            <span className="text-emerald-400 font-bold shrink-0 mt-0.5">&bull;</span>
                            <span className="leading-relaxed">{str}</span>
                          </li>
                        ))
                      ) : (
                        <p className="text-[11px] text-slate-500 italic">No explicit key strengths identified.</p>
                      )}
                    </ul>
                  </div>

                  {/* Gaps / Missing Skills Card */}
                  <div className="p-4 bg-slate-900/30 rounded-xl border border-slate-900 space-y-3">
                    <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest font-extrabold block">
                      ⚠️ Requirement Gap Flags ({fitResult.missingSkills?.length || 0})
                    </span>
                    <ul className="space-y-2">
                      {fitResult.missingSkills && fitResult.missingSkills.length > 0 ? (
                        fitResult.missingSkills.map((gap, idx) => (
                          <li key={idx} className="text-[11px] text-slate-350 bg-slate-950/20 p-2.5 rounded-lg border border-slate-950/50 flex items-start space-x-2">
                            <span className="text-amber-550 font-bold shrink-0 mt-0.5">&bull;</span>
                            <span className="leading-relaxed">{gap}</span>
                          </li>
                        ))
                      ) : (
                        <p className="text-[11px] text-slate-500 italic">No direct gap criteria detected!</p>
                      )}
                    </ul>
                  </div>

                </div>

                {/* Practical Improvements */}
                <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-900 space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <Award className="w-4 h-4 text-purple-400" />
                    <span>Resume Optimization Checklist</span>
                  </h3>
                  <div className="space-y-2">
                    {fitResult.improvementSuggestions && fitResult.improvementSuggestions.length > 0 ? (
                      fitResult.improvementSuggestions.map((sug, i) => (
                        <div key={i} className="p-3 bg-slate-950/30 rounded-lg border border-slate-900 flex items-start space-x-2 px-3 text-xs leading-relaxed text-slate-300">
                          <span className="text-indigo-400 font-bold shrink-0 font-mono text-[10px] p-0.5 px-2 bg-indigo-500/5 rounded border border-indigo-500/10 mr-1.5">{i+1}</span>
                          <span className="font-light">{sug}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">No recommendations required.</p>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* Renders Tailored Cover Letter output panel */}
            {coverLetterMarkdown && !isLetterGenerating && (
              <div className="space-y-4">
                <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-900 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-850 pb-4">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-mono text-purple-400 font-extrabold tracking-widest uppercase block">Gemini Tailored Cover Letter</span>
                      <h4 className="text-xs font-bold text-slate-300">
                        Draft built {aiCompany ? `for: ${aiCompany}` : ""} {aiTitle ? `(${aiTitle})` : ""}
                      </h4>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleCopyToClipboard}
                        className="p-2 py-1.5 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-850 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center space-x-1.5"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-450" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Letter</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleDownloadTxt}
                        className="p-2 py-1.5 bg-indigo-900/40 hover:bg-indigo-900 text-indigo-300 hover:text-white border border-indigo-500/10 hover:border-indigo-500 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center space-x-1.5"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>Download TXT</span>
                      </button>
                    </div>
                  </div>

                  {/* Letter display box with beautiful formatting */}
                  <div className="bg-slate-950/80 p-6 rounded-xl border border-slate-900/80 max-h-[500px] overflow-y-auto text-xs text-slate-350 leading-relaxed font-mono whitespace-pre-line space-y-4 font-light">
                    {coverLetterMarkdown}
                  </div>
                </div>

                <p className="text-[10px] text-slate-500">
                  ⚡ Review this cover letter draft and manually customize placeholders (like dates, names, or contact info) before sending inside your job application.
                </p>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Modal Popup for Job Tracker Add / Edit Profile */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl">
            {/* Close trigger */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-slate-500 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-black text-white font-mono uppercase tracking-wider mb-5">
              {editingJob ? "✎ Edit Application Tracker Node" : "✚ Create Location App Card"}
            </h3>

            <form onSubmit={handleSubmitJobForm} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="modal-company" className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Company Name *</label>
                  <input
                    id="modal-company"
                    type="text"
                    required
                    placeholder="e.g. Google"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 text-xs px-3 py-2.5 rounded-xl text-slate-200 placeholder:text-slate-705 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="modal-title" className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Role Title *</label>
                  <input
                    id="modal-title"
                    type="text"
                    required
                    placeholder="e.g. Senior Software Architect"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 text-xs px-3 py-2.5 rounded-xl text-slate-200 placeholder:text-slate-705 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="modal-date" className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Application Date</label>
                  <input
                    id="modal-date"
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 text-xs px-3 py-2.5 rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="modal-status" className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Application Status *</label>
                  <select
                    id="modal-status"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as JobStatus)}
                    className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 text-xs px-3 py-2.5 rounded-xl text-slate-300 focus:outline-none"
                  >
                    <option value="Saved">Saved</option>
                    <option value="Applied">Applied</option>
                    <option value="Interview">Interview</option>
                    <option value="Offer">Offer</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="modal-desc" className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Job Description Outline</label>
                <textarea
                  id="modal-desc"
                  rows={3}
                  placeholder="Paste typical duties, key highlights, or job description points to align later on with AI..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 text-xs text-slate-200 p-3 rounded-xl focus:outline-none placeholder:text-slate-705 resize-y"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="modal-notes" className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">My Operational Notes</label>
                <textarea
                  id="modal-notes"
                  rows={2}
                  placeholder="Add details about interviewers, compensation packages, reminders, or next steps..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 text-xs text-slate-200 p-3 rounded-xl focus:outline-none placeholder:text-slate-705 resize-y"
                />
              </div>

              <div className="flex space-x-2 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitInProgress}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-extrabold py-3 text-xs rounded-xl cursor-pointer shadow-lg hover:shadow-indigo-500/10 transition-all text-center flex justify-center items-center"
                >
                  {isSubmitInProgress ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <span>Save Application Node</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-850 rounded-xl px-5 py-3 text-xs font-semibold cursor-pointer transition-all"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
