import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import multer from "multer";
import { PDFParse } from "pdf-parse";


import mammoth from "mammoth";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();



// Ensure port 3000 is used
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-12345";

// Lazy initialize Gemini clients to prevent app crashes on boot if the key is empty
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY environment variable is not configured in Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

const app = express();
app.use(express.json());

// Local In-Memory Storage to prevent connection issues without PostgreSQL
const memUsers: any[] = [];
const memJobApplications: any[] = [];
const memResumeAnalyses: any[] = [];
const memActivityLogs: any[] = [];

let nextUserId = 1;
let nextJobId = 1;
let nextAnalysisId = 1;
let nextLogId = 1;

// Authentication & Authorization Middlewares
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. Authentication token is missing." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded; // Contains { userId: string, email: string }
    next();
  } catch (err) {
    return res.status(403).json({ error: "Authentication failed. Invalid or expired token." });
  }
};

const enforceOwnership = (req: any, res: any, next: any) => {
  const tokenUserId = req.user?.userId;
  
  if (!tokenUserId) {
    return res.status(403).json({ error: "Access denied. Session identification omitted." });
  }

  if (req.params.userId && req.params.userId !== tokenUserId) {
    return res.status(403).json({ error: "Forbidden. Accessing alternative user registry strictly barred." });
  }

  if (req.body.userId && req.body.userId !== tokenUserId) {
    return res.status(403).json({ error: "Forbidden. Payload is mapped to an external reference." });
  }

  next();
};

// Core User Resolver with Auto-Seeding
async function resolveDBUser(userIdStr: string): Promise<any> {
  let user = memUsers.find(u => u.uid === userIdStr);
  if (user) {
    return user;
  }

  const email = userIdStr === "demo-user" ? "sarah@copilot.ai" : `${userIdStr}@copilot.ai`;
  const name = userIdStr === "demo-user" ? "Sarah Jenkins" : "Sarah Jenkins";
  
  const defaultProfile = userIdStr === "demo-user" ? {
    targetRole: "Senior AI Product Manager",
    yearsOfExperience: 6,
    skills: ["Product Strategy", "Agile Methodology", "SQL", "Python", "Data Visualization", "LLM Fine-tuning", "Prompt Engineering"],
    location: "San Francisco, CA",
    experienceSummary: "Product Manager with 6 years of experience leading cross-functional teams in shipping analytics SaaS. Passionate about machine learning pipelines, LLM-powered applications, and delivering intuitive developer experiences.",
    resumeText: "Sarah Jenkins\nSenior AI Product Manager\nsarah@copilot.ai\nExperience:\n- Product Lead at Analytics.io (2023-Present): Scaled data workspace to 500k MAUs. Managed 5 engineers and 2 UX designers.\n- PM at FinTech Core (2020-2023): Led fraud detection model modernization reducing false positives by 18%.\n- Analyst at TechConsult (2018-2020): Provided market and technical analysis.",
    desiredSalary: "$160,000 - $190,000"
  } : {
    targetRole: "",
    yearsOfExperience: 0,
    skills: [],
    location: "",
    experienceSummary: "",
    resumeText: "",
    desiredSalary: ""
  };

  const newUser = {
    id: nextUserId++,
    uid: userIdStr,
    email,
    name,
    password: bcrypt.hashSync("password123", 10),
    ...defaultProfile,
    createdAt: new Date()
  };

  memUsers.push(newUser);

  if (userIdStr === "demo-user") {
    memJobApplications.push(
      {
        id: nextJobId++,
        userId: newUser.id,
        companyName: "Google",
        jobTitle: "Senior AI Product Manager",
        jobDescription: "Lead the development of generative AI tools and developer platforms. Prior expertise in LLM orchestrations is highly desired.",
        applicationDate: "2026-06-20",
        status: "Interview",
        notes: "First-round behavioral interview scheduled for next week with hiring director Sarah Cooper.",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: nextJobId++,
        userId: newUser.id,
        companyName: "Stripe",
        jobTitle: "Staff Product Manager (Machine Learning)",
        jobDescription: "Build credit assessment automation pipelines and fraud-risk algorithms. Experience handling big data architectures in highly regulated environments.",
        applicationDate: "2026-06-15",
        status: "Applied",
        notes: "Submitted tailored application. Tailored and parsed with ATS score of 82%.",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    );

    memActivityLogs.push({
      id: nextLogId++,
      userId: newUser.id,
      action: `[Type: system] Account Provisioned - Welcome and setup template configuration tailored to AI Product Management.`,
      timestamp: new Date()
    });
  }

  return newUser;
}

// Helper function to append operational activity logs
async function addLog(userIdStr: string, type: string, title: string, details: string) {
  try {
    const user = await resolveDBUser(userIdStr);
    memActivityLogs.push({
      id: nextLogId++,
      userId: user.id,
      action: `[Type: ${type}] ${title} - ${details}`,
      timestamp: new Date()
    });
  } catch (error) {
    console.error("Failed to insert operation status activity log:", error);
  }
}

// REST Auth Routes
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  if (typeof name !== "string" || name.trim().length < 2) {
    return res.status(400).json({ error: "Name must be at least 2 characters long." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (typeof email !== "string" || !emailRegex.test(email)) {
    return res.status(400).json({ error: "Please provide a valid email address." });
  }

  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long." });
  }

  try {
    const existing = memUsers.find(u => u.email === email.toLowerCase());

    if (existing) {
      return res.status(400).json({ error: "This email address is already registered." });
    }

    const uid = "user-" + Math.random().toString(36).substr(2, 9);
    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = {
      id: nextUserId++,
      uid,
      email: email.toLowerCase(),
      name: name.trim(),
      password: hashedPassword,
      targetRole: "",
      yearsOfExperience: 0,
      skills: [],
      location: "",
      experienceSummary: "",
      resumeText: "",
      desiredSalary: "",
      createdAt: new Date()
    };

    memUsers.push(newUser);

    memActivityLogs.push({
      id: nextLogId++,
      userId: newUser.id,
      action: `[Type: system] Account Created - Welcome to AI Career Copilot!`,
      timestamp: new Date()
    });

    const token = jwt.sign(
      { userId: newUser.uid, email: newUser.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ id: newUser.uid, name: newUser.name, email: newUser.email, token });
  } catch (error: any) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Registration process failed." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password." });
  }

  try {
    const dbUser = memUsers.find(u => u.email === email.toLowerCase());

    if (!dbUser) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isPasswordCorrect = bcrypt.compareSync(password, dbUser.password) || (password === dbUser.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = jwt.sign(
      { userId: dbUser.uid, email: dbUser.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ id: dbUser.uid, name: dbUser.name, email: dbUser.email, token });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login resolution failed." });
  }
});

app.get("/api/profile/:userId", authenticateToken, enforceOwnership, async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await resolveDBUser(userId);
    const profile = {
      name: user.name,
      targetRole: user.targetRole || "",
      yearsOfExperience: user.yearsOfExperience || 0,
      skills: user.skills || [],
      location: user.location || "",
      experienceSummary: user.experienceSummary || "",
      resumeText: user.resumeText || "",
      desiredSalary: user.desiredSalary || ""
    };
    res.json({ profile });
  } catch (err: any) {
    console.error("Fetch profile failed:", err);
    res.status(500).json({ error: "Could not retrieve user profile parameters." });
  }
});

app.post("/api/profile/:userId", authenticateToken, enforceOwnership, async (req, res) => {
  const { userId } = req.params;
  const updated = req.body;
  try {
    const user = await resolveDBUser(userId);
    if (updated.name !== undefined) user.name = updated.name;
    if (updated.targetRole !== undefined) user.targetRole = updated.targetRole;
    if (updated.yearsOfExperience !== undefined) user.yearsOfExperience = Number(updated.yearsOfExperience);
    if (updated.skills !== undefined) user.skills = updated.skills;
    if (updated.location !== undefined) user.location = updated.location;
    if (updated.experienceSummary !== undefined) user.experienceSummary = updated.experienceSummary;
    if (updated.resumeText !== undefined) user.resumeText = updated.resumeText;
    if (updated.desiredSalary !== undefined) user.desiredSalary = updated.desiredSalary;

    await addLog(userId, "profile_update", "Profile Updated", "Modified targets, skills, or resume text.");
    
    res.json({ success: true, profile: user });
  } catch (err: any) {
    console.error("Save profile failed:", err);
    res.status(500).json({ error: "Profile write operation failed." });
  }
});

app.get("/api/activities/:userId", authenticateToken, enforceOwnership, async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await resolveDBUser(userId);
    const dbLogs = memActivityLogs
      .filter(log => log.userId === user.id)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const formattedLogs = dbLogs.map(log => {
      let type = "system";
      let title = "Activity Executed";
      let details = log.action;

      const typeMatch = log.action.match(/^\[Type: (.*?)\] (.*?) - (.*)$/);
      if (typeMatch) {
        type = typeMatch[1];
        title = typeMatch[2];
        details = typeMatch[3];
      }

      return {
        id: `act-${log.id}`,
        type,
        title,
        timestamp: log.timestamp ? log.timestamp.toLocaleDateString(undefined, { hour: "numeric", minute: "numeric" }) : "Just Now",
        details
      };
    });

    res.json({ logs: formattedLogs });
  } catch (error: any) {
    console.error("Error retrieving activity log milestones:", error);
    res.status(500).json({ error: error.message || "Failed to load log history." });
  }
});


// CO-PILOT AI ACTIONS (Gemini AI Powered)

// ACTION 1: Analyze Profile For Target Role
const profileAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    roleFitScore: { type: Type.INTEGER, description: "Score from 0 to 100 indicting eligibility & fitness." },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Strengths matching the role objectives." },
    gaps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Candidate shortcomings or missing certifications/skills." },
    recommendedSkills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Target technologies, skills or certificates to secure next." },
    actionPlan: {
      type: Type.OBJECT,
      properties: {
        immediate: { type: Type.ARRAY, items: { type: Type.STRING }, description: "First 30 days action items." },
        shortTerm: { type: Type.ARRAY, items: { type: Type.STRING }, description: "First 90 days strategy." },
        longTerm: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Next 6-12 month strategic goals." }
      },
      required: ["immediate", "shortTerm", "longTerm"]
    }
  },
  required: ["roleFitScore", "strengths", "gaps", "recommendedSkills", "actionPlan"]
};

app.post("/api/copilot/analyze-profile", authenticateToken, enforceOwnership, async (req, res) => {
  const { userId, targetRole, yearsOfExperience, skills, location, experienceSummary } = req.body;
  
  try {
    const ai = getGeminiClient();
    const prompt = `Analyze this professional profile against the user's targeted career path.
Target Role: ${targetRole}
Years of Experience: ${yearsOfExperience}
Skills: ${skills ? skills.join(", ") : "None specified"}
Location: ${location || "Remote"}
Professional summary: ${experienceSummary || "No summary provided"}

Verify if they meet standard requirements, assess their role fit score (0-100), identify missing credentials or skills, and lay out an active structured development path.`;

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite Tech Career strategist, executive recruiter, and career mentor. Evaluate the user profiles objectively with structured fit scores, realistic tech skill recommendations, and custom structured short/long term actions.",
        responseMimeType: "application/json",
        responseSchema: profileAnalysisSchema
      }
    });

    const parsed = JSON.parse(result.text || "{}");
    if (userId) {
      addLog(userId, "system", "Analyzed Fit Rate", `Evaluated candidate fit score for high eligibility at: ${parsed.roleFitScore}%`);
    }
    res.json(parsed);

  } catch (error: any) {
    console.error("Profile analysis error:", error);
    res.status(500).json({ error: error.message || "Failed to process profile analysis." });
  }
});


// ACTION 2: Resume Bullet Point Tailor
const resumeTailoringSchema = {
  type: Type.OBJECT,
  properties: {
    originalText: { type: Type.STRING },
    tailoredBulletPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Enhanced professional summary or resume bullet points geared for ATS optimization." },
    rationales: { type: Type.ARRAY, items: { type: Type.STRING }, description: "ATS and industry rationales matching bullet points changes." },
    keywordSuggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Impact keywords to weave into their broader CV." }
  },
  required: ["originalText", "tailoredBulletPoints", "rationales", "keywordSuggestions"]
};

app.post("/api/copilot/tailor-resume", authenticateToken, enforceOwnership, async (req, res) => {
  const { userId, resumeText, jobDescription } = req.body;
  if (!resumeText || !jobDescription) {
    return res.status(400).json({ error: "Resume text and Job description are required." });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `Adapt the following resume segment to match of the specified job description. Focus on optimizing achievements using high-impact metric verbs, matching keyword relevancy (for ATS systems), and maintaining clean professional phrasing.
    
Resume Text Segment:
${resumeText}

Job Description target details:
${jobDescription}`;

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an ATS compliance algorithm and professional resume writer. Rewrite user achievements to follow the Google standard formula: Accomplished [X], measured by [Y], by doing [Z]. Make sure everything matches correctly.",
        responseMimeType: "application/json",
        responseSchema: resumeTailoringSchema
      }
    });

    const parsed = JSON.parse(result.text || "{}");
    if (userId) {
      addLog(userId, "resume_tailor", "Resume Segment Tailored", "Adapted bullet points to optimize against a specified Job Description.");
    }
    res.json(parsed);

  } catch (error: any) {
    console.error("Resume tailoring error:", error);
    res.status(500).json({ error: error.message || "Failed to tailor resume." });
  }
});


// ACTION 3: Generate Interactive Prep Questions
const interviewPrepSchema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          type: { type: Type.STRING, description: "Must be 'technical', 'behavioral', or 'situational'." },
          goodAnswerTips: { type: Type.STRING, description: "Brief advice about how a competitive applicant hits key indicators." },
          sampleAnswer: { type: Type.STRING, description: "An outstanding answer using STAR layout." }
        },
        required: ["question", "type", "goodAnswerTips", "sampleAnswer"]
      }
    },
    overallAdvice: { type: Type.STRING, description: "General mental models and presentation tactics to secure the position." }
  },
  required: ["questions", "overallAdvice"]
};

app.post("/api/copilot/interview-prep", authenticateToken, enforceOwnership, async (req, res) => {
  const { userId, targetRole, level, customFocus } = req.body;
  
  try {
    const ai = getGeminiClient();
    const prompt = `Produce 3 tailored interview questions for a candidate seeking a ${targetRole} role.
Candidate Seniority Level: ${level || "Mid-career"}
Strategic focus: ${customFocus || "Core responsibilities & system competency"}

Generate questions across technical, behavioral, and situational vectors related to modern business context.`;

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a senior recruitment director and interviewer. Produce highly relevant, challenging questions with practical interview tips and actionable model answers.",
        responseMimeType: "application/json",
        responseSchema: interviewPrepSchema
      }
    });

    const parsed = JSON.parse(result.text || "{}");
    if (userId) {
      addLog(userId, "interview_prep", "Interview Prep Generated", "Created personalized behavioral and engineering questions.");
    }
    res.json(parsed);

  } catch (error: any) {
    console.error("Interview prep error:", error);
    res.status(500).json({ error: error.message || "Failed to initiate prep session." });
  }
});

// ACTION 4: Evaluate Interview Response
const interviewEvaluationSchema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.INTEGER, description: "Evaluation rating from 0 to 100 on correctness and STAR methodology." },
    goodPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific good keywords or approaches used." },
    missedPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Gaps in details, metrics, or answers left unaddressed." },
    coachingAdvice: { type: Type.STRING, description: "Clear concrete feedback and an optimized way to phrase the answer." }
  },
  required: ["score", "goodPoints", "missedPoints", "coachingAdvice"]
};

app.post("/api/copilot/evaluate-answer", authenticateToken, enforceOwnership, async (req, res) => {
  const { userId, question, answer } = req.body;
  if (!question || !answer) {
    return res.status(400).json({ error: "Question and Answer are required." });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `Evaluate the user's interview answer to the following question. Provide a fit score of 0-100, analyze strengths, identify skipped outcomes or metrics, and supply an elegant mentoring suggestion.

Question: ${question}
User Answer: ${answer}`;

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an executive communications trainer and strict mock interviewer. Score answers based on structured narrative flow (Situation, Task, Action, Result), metrics usage, and confidence.",
        responseMimeType: "application/json",
        responseSchema: interviewEvaluationSchema
      }
    });

    const parsed = JSON.parse(result.text || "{}");
    if (userId) {
      addLog(userId, "interview_prep", "Answer Evaluated", `Interview answer graded: ${parsed.score}/100.`);
    }
    res.json(parsed);

  } catch (error: any) {
    console.error("Evaluation error:", error);
    res.status(500).json({ error: error.message || "Failed to evaluate answer." });
  }
});

// ACTION 5: Career Pathing pivot/expansion strategy
const careerPathSchema = {
  type: Type.OBJECT,
  properties: {
    suggestedRoles: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Alternative advancement / pivot roles matching the skills profiles." },
    roadmap: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          timeframe: { type: Type.STRING, description: "e.g., '1-3 months'" },
          skillsToAcquire: { type: Type.ARRAY, items: { type: Type.STRING } },
          description: { type: Type.STRING, description: "Milestone focal details." },
          riskFactors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Obstacles to anticipate." }
        },
        required: ["title", "timeframe", "skillsToAcquire", "description", "riskFactors"]
      }
    },
    transitionEaseScore: { type: Type.INTEGER, description: "Ease pivot rating from 0 to 100 based on overlap." },
    marketOutlook: { type: Type.STRING, description: "Growth metrics: 'high', 'medium', or 'steady'." }
  },
  required: ["suggestedRoles", "roadmap", "transitionEaseScore", "marketOutlook"]
};

app.post("/api/copilot/discover-pivot", authenticateToken, enforceOwnership, async (req, res) => {
  const { userId, currentProfile } = req.body;
  if (!currentProfile) {
    return res.status(400).json({ error: "Profile information is required." });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `Craft a career pathing roadmap to pivot or expand.
Current details:
- Name: ${currentProfile.name}
- Current/Target Role: ${currentProfile.targetRole}
- Skills: ${currentProfile.skills ? currentProfile.skills.join(", ") : "None"}
- Experience Summary: ${currentProfile.experienceSummary}

Provide adjacent highly demanding roles, a custom structured milestone sequence containing skills checkpoints, transition obstacles, and ease scores.`;

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a professional recruiting consultant and industry analyst. Map adjacent career roles dynamically with clear step milestones and market trend indices.",
        responseMimeType: "application/json",
        responseSchema: careerPathSchema
      }
    });

    const parsed = JSON.parse(result.text || "{}");
    if (userId) {
      addLog(userId, "career_path", "Career Transition Mapped", "Generated dynamic career evolution roadmap and pivot alternatives.");
    }
    res.json(parsed);

  } catch (error: any) {
    console.error("Career path error:", error);
    res.status(500).json({ error: error.message || "Failed to create career path roadmap." });
  }
});


// ==========================================
// AI RESUME ANALYZER MODULE IMPLEMENTATION
// ==========================================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit
});

async function extractTextFromFile(file: Express.Multer.File): Promise<string> {
  const fileType = file.mimetype;
  const buffer = file.buffer;

  if (fileType === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
  const parser = new PDFParse({
    data: buffer,
  });

  const result = await parser.getText();

  await parser.destroy();

  return result.text || "";
} else if (
    fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.originalname.toLowerCase().endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } else if (fileType === "text/plain" || file.originalname.toLowerCase().endsWith(".txt")) {
    return buffer.toString("utf-8");
  } else {
    throw new Error("Unsupported file format. Please upload a PDF, DOCX, or TXT file.");
  }
}

const resumeAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    atsScore: { type: Type.INTEGER, description: "ATS Score from 0 to 100 based on standard industry criteria, resume parsers, and keyword density." },
    candidateName: { type: Type.STRING, description: "Candidate name extracted from the text." },
    detectedRole: { type: Type.STRING, description: "Primary role title or discipline detected from the resume." },
    detectedSkills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Core technologies, skills, or frameworks present in the resume." },
    missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "High-value industry keywords or technical terms missing but highly recommended for this role." },
    suggestedImprovements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific modifications to formatting, structure, phrasing, or action verbs." },
    recommendedSkills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific technical skills or certifications to acquire to boost employability." },
    experienceSummary: { type: Type.STRING, description: "Professional synthesis of active trajectory and current market readiness." }
  },
  required: [
    "atsScore",
    "candidateName",
    "detectedRole",
    "detectedSkills",
    "missingKeywords",
    "suggestedImprovements",
    "recommendedSkills",
    "experienceSummary"
  ]
};

// Route 1: Extract PDF/DOCX content to plain text editor sandbox
app.post("/api/copilot/extract-resume", authenticateToken, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file was uploaded." });
    }
    const extractedText = await extractTextFromFile(req.file);
    res.json({ text: extractedText });
  } catch (err: any) {
    console.error("Extraction error:", err);
    res.status(500).json({ error: err.message || "Failed to extract plain-text from the uploaded document." });
  }
});

// Route 2: High-fidelity resume deep-analysis with Google Gemini AI
app.post("/api/copilot/analyze-resume", authenticateToken, enforceOwnership, async (req, res) => {
  const { userId, resumeText, targetRole } = req.body;

  if (!resumeText || !resumeText.trim()) {
    return res.status(400).json({ error: "Resume text content is required for analysis." });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `Analyze this candidate's resume content to assess ATS metrics and provide career optimization suggestions.
Target Specialization (Hiring Strategy): ${targetRole || "Best matching general industry role"}

Resume text:
${resumeText}

Conduct an extremely professional, thorough review according to high-end enterprise recruitment practices. Produce details for all coordinates in the requested JSON structure.`;

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are the ultimate digital resume screener, recruitment algorithm expert, and executive talent advisor. Analyze input texts rigorously and score with absolute candor.",
        responseMimeType: "application/json",
        responseSchema: resumeAnalysisSchema
      }
    });

    const parsed = JSON.parse(result.text || "{}");
    if (userId) {
      try {
        const user = await resolveDBUser(userId);
        memResumeAnalyses.push({
          id: nextAnalysisId++,
          userId: user.id,
          atsScore: parsed.atsScore || 0,
          strengths: parsed.detectedSkills || [],
          missingKeywords: parsed.missingKeywords || [],
          recommendations: parsed.recommendedSkills || [],
          createdAt: new Date()
        });
      } catch (err) {
        console.error("Failed to store resume analysis in database:", err);
      }
      await addLog(userId, "resume_analyze", "Deep ATS Resume Analysis", `Processed ATS eligibility benchmark: ${parsed.atsScore}% for candidate ${parsed.candidateName || 'User'}`);
    }
    res.json(parsed);

  } catch (error: any) {
    console.error("Resume deep analysis error:", error);
    res.status(500).json({ error: error.message || "Failed to run Gemini AI analysis on resume." });
  }
});


// ==========================================
// AI JOB TRACKER MODULE IMPLEMENTATION
// ==========================================

const jobFitSchema = {
  type: Type.OBJECT,
  properties: {
    fitScore: { type: Type.INTEGER, description: "A high-fidelity job fit/alignment rating from 0 to 100 assessing the compatibility of the user's profile with the job description." },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific technical, soft, or functional areas where the candidate strongly aligns with requirements." },
    missingSkills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Prerequisite skills, technologies, or domain experience present in the job description but not clearly matched in the user profile." },
    improvementSuggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific steps, certification additions, or project tailoring to maximize conversion chances." },
    overallEvaluation: { type: Type.STRING, description: "A comprehensive executive-level narrative summarizing the candidate's custom alignment score and strategy." }
  },
  required: ["fitScore", "strengths", "missingSkills", "improvementSuggestions", "overallEvaluation"]
};

// 1. Get user's saved job applications
app.get("/api/jobs/:userId", authenticateToken, enforceOwnership, async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await resolveDBUser(userId);
    const list = memJobApplications
      .filter(item => item.userId === user.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const mappedList = list.map(item => ({
      id: `job-${item.id}`,
      userId,
      companyName: item.companyName,
      jobTitle: item.jobTitle,
      jobDescription: item.jobDescription || "",
      applicationDate: item.applicationDate || "",
      status: item.status,
      notes: item.notes || "",
      createdAt: item.createdAt?.toISOString()
    }));

    res.json(mappedList);
  } catch (error: any) {
    console.error("Fetch jobs failed:", error);
    res.status(500).json({ error: "Failed to retrieve job trackers." });
  }
});

// 2. Create a new job application
app.post("/api/jobs/:userId", authenticateToken, enforceOwnership, async (req, res) => {
  const { userId } = req.params;
  const { companyName, jobTitle, jobDescription, applicationDate, status, notes } = req.body;

  if (!companyName || !jobTitle || !status) {
    return res.status(400).json({ error: "Company name, job title, and application status are raw requirements." });
  }

  try {
    const user = await resolveDBUser(userId);
    const newJob = {
      id: nextJobId++,
      userId: user.id,
      companyName,
      jobTitle,
      jobDescription: jobDescription || "",
      applicationDate: applicationDate || new Date().toISOString().split('T')[0],
      status,
      notes: notes || "",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    memJobApplications.push(newJob);

    await addLog(userId, "system", "Job Application Added", `Created tracker card for ${jobTitle} position at ${companyName}`);

    res.status(201).json({
      id: `job-${newJob.id}`,
      userId,
      companyName: newJob.companyName,
      jobTitle: newJob.jobTitle,
      jobDescription: newJob.jobDescription || "",
      applicationDate: newJob.applicationDate || "",
      status: newJob.status,
      notes: newJob.notes || "",
      createdAt: newJob.createdAt?.toISOString()
    });
  } catch (error: any) {
    console.error("Create job failed:", error);
    res.status(500).json({ error: "Failed to build job tracker card." });
  }
});

// 3. Update an existing job application
app.put("/api/jobs/:userId/:jobId", authenticateToken, enforceOwnership, async (req, res) => {
  const { userId, jobId } = req.params;
  const { companyName, jobTitle, jobDescription, applicationDate, status, notes } = req.body;

  try {
    const user = await resolveDBUser(userId);
    const numericJobId = parseInt(jobId.replace("job-", ""), 10);

    if (isNaN(numericJobId)) {
      return res.status(400).json({ error: "Invalid job application identifier format." });
    }

    const oldJob = memJobApplications.find(item => item.id === numericJobId && item.userId === user.id);

    if (!oldJob) {
      return res.status(404).json({ error: "Job application not found." });
    }

    const previousStatus = oldJob.status;

    if (companyName !== undefined) oldJob.companyName = companyName;
    if (jobTitle !== undefined) oldJob.jobTitle = jobTitle;
    if (jobDescription !== undefined) oldJob.jobDescription = jobDescription;
    if (applicationDate !== undefined) oldJob.applicationDate = applicationDate;
    if (status !== undefined) oldJob.status = status;
    if (notes !== undefined) oldJob.notes = notes;
    oldJob.updatedAt = new Date();

    if (previousStatus !== oldJob.status) {
      await addLog(userId, "system", "Application Status Updated", `Advanced status level for ${oldJob.jobTitle} to: ${oldJob.status}`);
    }

    res.json({
      id: `job-${oldJob.id}`,
      userId,
      companyName: oldJob.companyName,
      jobTitle: oldJob.jobTitle,
      jobDescription: oldJob.jobDescription || "",
      applicationDate: oldJob.applicationDate || "",
      status: oldJob.status,
      notes: oldJob.notes || "",
      createdAt: oldJob.createdAt?.toISOString()
    });
  } catch (error: any) {
    console.error("Update job failed:", error);
    res.status(500).json({ error: "Could not write modifications to database." });
  }
});

// 4. Delete a job application
app.delete("/api/jobs/:userId/:jobId", authenticateToken, enforceOwnership, async (req, res) => {
  const { userId, jobId } = req.params;

  try {
    const user = await resolveDBUser(userId);
    const numericJobId = parseInt(jobId.replace("job-", ""), 10);

    if (isNaN(numericJobId)) {
      return res.status(400).json({ error: "Invalid job application identifier format." });
    }

    const index = memJobApplications.findIndex(item => item.id === numericJobId && item.userId === user.id);

    if (index === -1) {
      return res.status(404).json({ error: "Job application not found." });
    }

    const [deletedJob] = memJobApplications.splice(index, 1);

    await addLog(userId, "system", "Job Application Removed", `Deleted tracker file: ${deletedJob.jobTitle} at ${deletedJob.companyName}`);
    res.json({ success: true, message: "Job application tracker file has been cleanly removed." });
  } catch (error: any) {
    console.error("Delete job failed:", error);
    res.status(500).json({ error: "Could not remove job tracker." });
  }
});

// 5. POST /api/copilot/analyze-job-fit
app.post("/api/copilot/analyze-job-fit", authenticateToken, enforceOwnership, async (req, res) => {
  const { userId, jobDescription } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "User session authentication id is required." });
  }
  if (!jobDescription || !jobDescription.trim()) {
    return res.status(400).json({ error: "Job description is required to run fit analysis." });
  }

  try {
    const userProfile = await resolveDBUser(userId);
    if (!userProfile) {
      return res.status(404).json({ error: "Target candidate career profile has not been initialized." });
    }

    const ai = getGeminiClient();
    const prompt = `Conduct a rigorous ATS job alignment/suitability fit audit comparing the candidate's career parameters against the provided target job description.

Candidate Profile Parameters:
- Target Role Category: ${userProfile.targetRole || "Product / engineering professional"}
- Experience Summary / Trajectory: ${userProfile.experienceSummary}
- Explicit Verified Technologies & Skills: ${JSON.stringify(userProfile.skills || [])}
- Raw Candidate Resume Text Data: ${userProfile.resumeText || "No explicit backup resume details entered yet."}

Target Job Posting / Description:
${jobDescription}

Perform a forensic recruiter compatibility scan. Grade elements fairly, providing rich JSON attributes as requested.`;

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite, objective corporate recruitment auditor and technical screening expert. Score candidate fit realistically according to industry recruitment standards.",
        responseMimeType: "application/json",
        responseSchema: jobFitSchema
      }
    });

    const parsed = JSON.parse(result.text || "{}");
    addLog(userId, "career_path", "Job Suitability Evaluated", `Performed high-fidelity alignment check with fit rating of ${parsed.fitScore}%`);
    res.json(parsed);

  } catch (err: any) {
    console.error("AI job fit analysis error:", err);
    res.status(500).json({ error: err.message || "Failed to process target job description alignment." });
  }
});

// 6. POST /api/copilot/generate-cover-letter
app.post("/api/copilot/generate-cover-letter", authenticateToken, enforceOwnership, async (req, res) => {
  const { userId, jobDescription, companyName, jobTitle } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "User session ID is required." });
  }
  if (!jobDescription || !jobDescription.trim()) {
    return res.status(400).json({ error: "Target job description text is required to generate a tailored cover letter." });
  }

  try {
    const userProfile = await resolveDBUser(userId);
    if (!userProfile) {
      return res.status(404).json({ error: "User profile details not found." });
    }

    const ai = getGeminiClient();
    const prompt = `Write an elegant, bespoke, highly persuasive Cover Letter for the candidate applying to a position.

Candidate Profile:
- Full Name: ${userProfile.name || "A Professional Candidate"}
- Target Experience Summary: ${userProfile.experienceSummary}
- Core Specialized Skills: ${JSON.stringify(userProfile.skills || [])}
- Detailed Resume Metadata: ${userProfile.resumeText || "See experience summary"}

Target Job Profile:
- Company Name: ${companyName || "the specified company"}
- Target Position/Title: ${jobTitle || "the advertised open role"}
- Job Description details:
${jobDescription}

Instructions:
1. Speak in a confident, highly professional human voice. Avoid generic templates, cheesy robotic greeting hooks, or AI-like repetitive clichés (e.g., delete sections starting with 'I am writing to eagerly express my...').
2. Synthesize specific achievements from their resume metadata and link them dynamically to the job's core challenges.
3. Keep the letter concise (approx. 3-4 paragraphs) and output it in beautifully compiled Markdown format.
`;

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a world-class executive resume writer and career branding specialist."
      }
    });

    const coverLetterText = result.text || "";
    addLog(userId, "resume_tailor", "Cover Letter Drafted", `AI Cover Letter generated matching spec for ${jobTitle || 'Role'} at ${companyName || 'Company'}`);
    res.json({ coverLetter: coverLetterText });

  } catch (err: any) {
    console.error("AI cover letter generator error:", err);
    res.status(500).json({ error: err.message || "Failed to compile your customized cover letter." });
  }
});


// Vite Dev & Server bootstrapping
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started on http://localhost:${PORT}`);
  });
}

startServer();
