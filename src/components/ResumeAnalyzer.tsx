import React, { useState, useEffect, useRef } from "react";
import { 
  FileText, 
  Upload, 
  FileUp, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  TrendingUp, 
  Clipboard, 
  Award, 
  ShieldAlert, 
  Zap,
  Bookmark,
  CheckCircle2,
  Trash2,
  ListFilter
} from "lucide-react";
import { User, ResumeAnalysisResult } from "../types";

interface ResumeAnalyzerProps {
  user: User;
  onLogAdded: () => void;
}

export default function ResumeAnalyzer({ user, onLogAdded }: ResumeAnalyzerProps) {
  const [activeSubTab, setActiveSubTab] = useState<"upload" | "paste">("upload");
  const [targetRole, setTargetRole] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // Resume analysis result
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResult | null>(null);

  // Drag and drop states
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load last analysis from localStorage on init
  useEffect(() => {
    const cached = localStorage.getItem(`copilot_resume_analysis_${user.id}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed.atsScore === "number") {
          setAnalysisResult(parsed);
        }
      } catch (e) {
        localStorage.removeItem(`copilot_resume_analysis_${user.id}`);
      }
    }

    const cachedText = localStorage.getItem(`copilot_resume_text_${user.id}`);
    if (cachedText) {
      setResumeText(cachedText);
    }
  }, [user.id]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setErrorMsg(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelection(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFileSelection(file);
    }
  };

  const handleFileSelection = async (file: File) => {
    const allowedExtensions = [".pdf", ".docx", ".txt"];
    const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      setErrorMsg("Invalid file format. Please upload a PDF, DOCX, or Plain Text (.txt) file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("File is too large. Maximum size allowed is 5MB.");
      return;
    }

    // Attempt text extraction
    setIsExtracting(true);
    setUploadProgress(`Uploading and parsing ${file.name}...`);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/copilot/extract-resume", {
        method: "POST",
        headers: { "Authorization": `Bearer ${user.token}` },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to extract text from document.");
      }

      if (data.text) {
        setResumeText(data.text);
        localStorage.setItem(`copilot_resume_text_${user.id}`, data.text);
        setUploadProgress(null);
        // Switch sub-tab to paste view so they can see and tweak the extracted raw text
        setActiveSubTab("paste");
      } else {
        throw new Error("No text content could be extracted from your file.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while reading your document.");
      setUploadProgress(null);
    } finally {
      setIsExtracting(false);
    }
  };

  const clearResumeText = () => {
    setResumeText("");
    localStorage.removeItem(`copilot_resume_text_${user.id}`);
  };

  const runDeepAnalysis = async () => {
    if (!resumeText.trim()) {
      setErrorMsg("Please upload a resume file or paste your resume text first.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);
    try {
      const response = await fetch("/api/copilot/analyze-resume", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          userId: user.id,
          resumeText,
          targetRole: targetRole.trim() || undefined
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to parse and analyze resume with Gemini.");
      }

      setAnalysisResult(data);
      // Cache result
      localStorage.setItem(`copilot_resume_analysis_${user.id}`, JSON.stringify(data));
      onLogAdded(); // Refresh activity log widget in layout
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during Gemini AI resume processing.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClearAll = () => {
    setAnalysisResult(null);
    localStorage.removeItem(`copilot_resume_analysis_${user.id}`);
    clearResumeText();
    setTargetRole("");
    setErrorMsg(null);
  };

  // Score color helper
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/5";
    if (score >= 60) return "text-amber-450 border-amber-500/30 bg-amber-500/5";
    return "text-red-400 border-red-500/30 bg-red-500/5";
  };

  return (
    <div id="resume-analyzer-module" className="space-y-6">
      {/* Module Title Header */}
      <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[200px] h-full bg-gradient-to-l from-indigo-500/5 to-transparent pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center space-x-1.5 bg-indigo-900/40 text-indigo-400 border border-indigo-500/10 px-2.5 py-1 rounded-full text-[10px] font-mono">
            <Zap className="w-3.5 h-3.5" />
            <span>Dual Extraction Engine Running</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">AI Resume ATS Analyzer</h2>
          <p className="text-slate-400 text-xs max-w-3xl leading-relaxed">
            Deepscreen your resume against state-of-the-art Applicant Tracking System (ATS) matching patterns. 
            Identify missing keywords, calculate score breakdowns, and generate custom refinement recommendations powered by Google Gemini AI.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Input Configuration Column: Span 5 */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800/80 space-y-4">
            <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider flex items-center space-x-2">
              <FileUp className="w-4 h-4 text-indigo-400" />
              <span>Resume Intake Configuration</span>
            </h3>

            {/* Target Role input */}
            <div className="space-y-1.5">
              <label htmlFor="target-role" className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Target Role Optimization (Optional)
              </label>
              <input
                id="target-role"
                type="text"
                placeholder="e.g. Senior Machine Learning Engineer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-xs text-white px-3.5 py-2.5 rounded-xl transition-all focus:outline-none placeholder:text-slate-600"
              />
              <p className="text-[10px] text-slate-500">
                Provide a target position to get laser-focused keyword scans and customized metrics.
              </p>
            </div>

            {/* Input Selection Sub-tabs */}
            <div className="flex border-b border-slate-850 pt-2">
              <button
                onClick={() => setActiveSubTab("upload")}
                className={`pb-2 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                  activeSubTab === "upload" 
                    ? "border-indigo-500 text-indigo-400" 
                    : "border-transparent text-slate-500 hover:text-slate-350"
                }`}
              >
                Upload Document
              </button>
              <button
                onClick={() => setActiveSubTab("paste")}
                className={`pb-2 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                  activeSubTab === "paste" 
                    ? "border-indigo-500 text-indigo-400" 
                    : "border-transparent text-slate-500 hover:text-slate-350"
                }`}
              >
                Manual Text Box ({resumeText ? "Loaded" : "Empty"})
              </button>
            </div>

            {/* Tab: File Upload Drag & Drop */}
            {activeSubTab === "upload" && (
              <div className="space-y-4">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col justify-center items-center min-h-[180px] ${
                    isDragging 
                      ? "border-indigo-500 bg-indigo-500/5 scale-[0.98]" 
                      : "border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-950/80"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                  />
                  <Upload className="w-8 h-8 text-indigo-400 mb-3 animate-pulse" />
                  <span className="text-xs font-bold text-slate-300 block">
                    Drag and Drop Resume Here
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1.5">
                    Supports PDF, DOCX, and TXT files up to 5MB
                  </span>
                  <button
                    type="button"
                    className="mt-4 px-3.5 py-1.5 bg-slate-900 hover:bg-indigo-600 border border-slate-800 hover:border-indigo-500 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    Select File Manually
                  </button>
                </div>

                {uploadProgress && (
                  <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 text-indigo-300 text-[10px] rounded-xl flex items-center space-x-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{uploadProgress}</span>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Manual Paste / Extracted Editor */}
            {activeSubTab === "paste" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="resume-editor" className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Resume Plaintext Editor
                  </label>
                  {resumeText && (
                    <button 
                      onClick={clearResumeText}
                      className="text-red-400 hover:text-red-300 font-bold text-[10px] flex items-center space-x-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Purge Editor</span>
                    </button>
                  )}
                </div>
                <textarea
                  id="resume-editor"
                  value={resumeText}
                  onChange={(e) => {
                    setResumeText(e.target.value);
                    localStorage.setItem(`copilot_resume_text_${user.id}`, e.target.value);
                  }}
                  rows={10}
                  placeholder="Paste raw resume plain text content here, or upload a document file to extract instantly..."
                  className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 text-xs text-slate-300 p-3.5 rounded-xl transition-all focus:outline-none placeholder:text-slate-700 font-mono resize-y"
                />
              </div>
            )}

            {/* Parse Actions Footer */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={runDeepAnalysis}
                disabled={isAnalyzing || isExtracting || !resumeText.trim()}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-900 disabled:to-slate-900 hover:shadow-lg disabled:opacity-50 text-xs font-black py-3 px-4 rounded-xl text-white transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Audit analysis running...</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 text-white" />
                    <span>Run Gemini AI Scanner</span>
                  </>
                )}
              </button>

              <button
                onClick={handleClearAll}
                className="px-4 py-3 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-850 rounded-xl text-xs font-semibold cursor-pointer transition-all text-center"
              >
                Reset All
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-950/30 border border-red-500/20 text-red-300 text-[10px] rounded-xl flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Quick Tips */}
          <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-900 space-y-3.5">
            <h4 className="text-[11px] uppercase font-bold text-slate-400 tracking-wider flex items-center space-x-1.5">
              <Clipboard className="w-3.5 h-3.5 text-indigo-400" />
              <span>ATS Best Practices</span>
            </h4>
            <ul className="space-y-2.5 text-[11px] text-slate-500">
              <li className="flex items-start space-x-2">
                <span className="text-indigo-400 font-extrabold">&bull;</span>
                <span>Avoid text inside graphics, shapes, or tables since basic scanners miss them.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-indigo-400 font-extrabold">&bull;</span>
                <span>Use standard structural headings (e.g., "Professional Experience", "Skills").</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-indigo-400 font-extrabold">&bull;</span>
                <span>Pack your bullets with strong action verbs and quantitative metrics (%, $, sales).</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Output Dashboard Column: Span 7 */}
        <div className="lg:col-span-7">
          {!analysisResult && !isAnalyzing && (
            <div className="bg-slate-900/25 border border-slate-900 p-12 rounded-3xl text-center space-y-4 min-h-[480px] flex flex-col justify-center items-center">
              <div className="bg-slate-950/60 p-4 rounded-full border border-slate-900">
                <FileText className="w-10 h-10 text-slate-700" />
              </div>
              <h4 className="text-sm font-bold text-slate-350">ATS Diagnostic Output Ready</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Connect your resumes by uploading PDF/DOCX docs or entering plain text on the side. 
                Run the scanner to generate comprehensive keyword checklists, scoring cards, and improvement recommendations.
              </p>
            </div>
          )}

          {isAnalyzing && (
            <div className="bg-slate-900/25 border border-indigo-500/10 p-12 rounded-3xl text-center space-y-5 min-h-[480px] flex flex-col justify-center items-center">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-4 border-indigo-500/10 border-t-indigo-500 animate-spin" />
                <Zap className="w-6 h-6 text-indigo-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-bounce" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-200">Gemini Parsing & Cross-referencing standards...</h4>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Extracting formatting patterns, testing keyword matches, assessing sentence scores, and compiling certification optimization paths.
                </p>
              </div>
            </div>
          )}

          {analysisResult && !isAnalyzing && (
            <div className="space-y-6">
              {/* Score Metric Segment */}
              <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-900 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                
                {/* Score gauge: 4 cols */}
                <div className="md:col-span-4 flex flex-col justify-center items-center py-2">
                  <div className="relative flex items-center justify-center">
                    {/* SVG Circular Progress circle */}
                    <svg className="w-28 h-28 transform -rotate-90">
                      <circle
                        cx="56"
                        cy="56"
                        r="48"
                        className="stroke-slate-950 fill-none"
                        strokeWidth="8"
                      />
                      <circle
                        cx="56"
                        cy="56"
                        r="48"
                        className={`stroke-indigo-500 fill-none transition-all duration-1000`}
                        strokeWidth="8"
                        strokeDasharray={301.6}
                        strokeDashoffset={301.6 - (301.6 * analysisResult.atsScore) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-3xl font-black text-white font-mono">{analysisResult.atsScore}</span>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Score</span>
                    </div>
                  </div>

                  <div className={`mt-3.5 px-3 py-1 rounded-full border text-[10px] font-mono font-bold tracking-wider ${getScoreColor(analysisResult.atsScore)}`}>
                    {analysisResult.atsScore >= 80 ? "ATS Optimal" : analysisResult.atsScore >= 60 ? "Warning Gaps" : "High Risk Flags"}
                  </div>
                </div>

                {/* Candidate Overview: 8 cols */}
                <div className="md:col-span-8 space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-indigo-400 font-mono font-bold tracking-widest uppercase block">Scanner Results for Spec</span>
                    <h3 className="text-lg font-black text-white">{analysisResult.candidateName || "Candidate Account"}</h3>
                    <div className="text-xs text-slate-300 font-medium">
                      Detected Position: <span className="text-purple-400">{analysisResult.detectedRole || "Not specified"}</span>
                    </div>
                  </div>

                  <blockquote className="text-[11px] text-slate-400 italic border-l-2 border-slate-800 pl-3 py-1 bg-slate-950/20 leading-relaxed font-light">
                    "{analysisResult.experienceSummary || "No professional narrative generated by the model."}"
                  </blockquote>
                </div>
              </div>

              {/* Keyword Scans checklist */}
              <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-900/80 space-y-4">
                <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider flex items-center space-x-2">
                  <Bookmark className="w-4 h-4 text-orange-400" />
                  <span>Keyword Analysis Matrix</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Missing Keywords Column */}
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-900 space-y-3">
                    <span className="text-[9px] font-mono text-red-400 font-bold tracking-widest uppercase block">
                      Missing Keywords ({analysisResult.missingKeywords?.length || 0})
                    </span>
                    {analysisResult.missingKeywords && analysisResult.missingKeywords.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {analysisResult.missingKeywords.map((tag, i) => (
                          <span key={i} className="text-[10px] font-mono text-logo bg-red-500/5 text-red-300 border border-red-500/10 px-2.5 py-1 rounded-md flex items-center space-x-1">
                            <span>+</span>
                            <span>{tag}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-500 italic">No major key terms missing in context!</p>
                    )}
                    <span className="text-[9px] text-slate-500 block leading-normal mt-2">
                      💡 Inject these terms organically inside project descriptions or skills panels to bypass resume word parsers.
                    </span>
                  </div>

                  {/* Detected Present Skills */}
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-900 space-y-3">
                    <span className="text-[9px] font-mono text-emerald-400 font-bold tracking-widest uppercase block">
                      Found Present Skills ({analysisResult.detectedSkills?.length || 0})
                    </span>
                    {analysisResult.detectedSkills && analysisResult.detectedSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {analysisResult.detectedSkills.map((tag, i) => (
                          <span key={i} className="text-[10px] font-mono text-emerald-300 bg-emerald-500/5 border border-emerald-500/10 px-2.5 py-1 rounded-md flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>{tag}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-500 italic">No prominent skills recognized in this selection.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Suggested improvements list */}
              <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-900/80 space-y-3.5">
                <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-indigo-400" />
                  <span>Interactive Refinement Checklist</span>
                </h3>

                <div className="space-y-2.5">
                  {analysisResult.suggestedImprovements && analysisResult.suggestedImprovements.length > 0 ? (
                    analysisResult.suggestedImprovements.map((imp, idx) => (
                      <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-900 flex items-start space-x-3 text-xs">
                        <div className="w-5 h-5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 font-mono mt-0.5">
                          {idx + 1}
                        </div>
                        <p className="text-slate-300 leading-relaxed font-light">{imp}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic text-center py-4">No critical improvements recommended.</p>
                  )}
                </div>
              </div>

              {/* Recommended Skills / certs to level up */}
              <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-900/80 space-y-3.5">
                <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider flex items-center space-x-2">
                  <Award className="w-4 h-4 text-purple-400" />
                  <span>Strategic Skill Additions</span>
                </h3>

                <div className="flex flex-wrap gap-2">
                  {analysisResult.recommendedSkills && analysisResult.recommendedSkills.length > 0 ? (
                    analysisResult.recommendedSkills.map((recSkill, idx) => (
                      <span key={idx} className="bg-purple-950/20 text-purple-300 border border-purple-500/10 px-3 py-1.5 rounded-xl text-xs flex items-center space-x-2 font-medium">
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping" />
                        <span>{recSkill}</span>
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic">No prominent complementary skills recommended.</p>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  ⭐ These key certifications or specialized technical skills list has been identified as highly valuable for the specified candidate's career track.
                </p>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
