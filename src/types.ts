export interface User {
  id: string;
  name: string;
  email: string;
  token?: string;
}

export interface CareerProfile {
  name: string;
  targetRole: string;
  yearsOfExperience: number;
  skills: string[];
  location: string;
  experienceSummary: string;
  resumeText?: string;
  desiredSalary?: string;
}

export interface AIAnalysisResult {
  roleFitScore: number; // 0 to 100
  strengths: string[];
  gaps: string[];
  recommendedSkills: string[];
  actionPlan: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

export interface TailoredResumeResult {
  originalText: string;
  tailoredBulletPoints: string[];
  rationales: string[];
  keywordSuggestions: string[];
}

export interface InterviewPrepQuestion {
  question: string;
  type: 'technical' | 'behavioral' | 'situational';
  goodAnswerTips: string;
  sampleAnswer: string;
}

export interface InterviewPrepResult {
  questions: InterviewPrepQuestion[];
  overallAdvice: string;
}

export interface CareerMilestone {
  title: string;
  timeframe: string;
  skillsToAcquire: string[];
  description: string;
  riskFactors: string[];
}

export interface CareerPathResult {
  suggestedRoles: string[];
  roadmap: CareerMilestone[];
  transitionEaseScore: number; // 0 to 100
  marketOutlook: 'high' | 'medium' | 'steady';
}

export interface ActivityLog {
  id: string;
  type: 'profile_update' | 'resume_tailor' | 'interview_prep' | 'career_path' | 'resume_analyze' | 'system';
  title: string;
  timestamp: string;
  details: string;
}

export interface ResumeAnalysisResult {
  atsScore: number; // 0 to 100
  candidateName: string;
  detectedRole: string;
  detectedSkills: string[];
  missingKeywords: string[];
  suggestedImprovements: string[];
  recommendedSkills: string[];
  experienceSummary: string;
}

export type JobStatus = 'Saved' | 'Applied' | 'Interview' | 'Rejected' | 'Offer';

export interface JobApplication {
  id: string;
  userId: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  applicationDate: string;
  status: JobStatus;
  notes?: string;
  createdAt: string;
}

export interface JobFitAnalysisResult {
  fitScore: number; // 0 to 100
  strengths: string[];
  missingSkills: string[];
  improvementSuggestions: string[];
  overallEvaluation: string;
}
