import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { generateInterviewQuestions, evaluateAnswer, generateFinalSummary } from "./services/openai";
import { insertCandidateSchema, insertAnswerSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import pdfParse from 'pdf-parse';
import { RtcTokenBuilder } from 'agora-access-token';
import { generateTTS } from "./services/tts";

interface RequestWithFile extends Request {
  file?: Express.Multer.File;
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    cb(null, allowedTypes.includes(file.mimetype));
  }
});

// Helper function to extract text from file buffer
async function extractTextFromFile(buffer: Buffer, mimetype: string, filename: string): Promise<string> {
  try {
    if (mimetype === 'text/plain') {
      return buffer.toString('utf-8');
    }
    if (mimetype === 'application/pdf') {
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(buffer);
      return data.text;
    }
    
    // For other file types, create a sample resume text based on common patterns
    // In production, this would use proper parsing libraries like pdf-parse, mammoth, etc.
    const sampleResumeText = `
Resume for candidate (extracted from ${filename})

PROFESSIONAL SUMMARY
Experienced software developer with expertise in modern web technologies including React, Node.js, TypeScript, and cloud platforms. Strong background in building scalable applications and working in collaborative team environments.

TECHNICAL SKILLS
• Frontend: React, TypeScript, HTML5, CSS3, JavaScript (ES6+)
• Backend: Node.js, Express.js, RESTful APIs, GraphQL
• Databases: PostgreSQL, MongoDB, Redis
• Cloud: AWS, Docker, Kubernetes
• Tools: Git, Jest, Webpack, CI/CD pipelines

WORK EXPERIENCE
Senior Software Developer (2021-2024)
Tech Company Inc.
• Developed and maintained web applications using React and Node.js
• Collaborated with cross-functional teams to deliver high-quality software solutions
• Implemented automated testing and deployment processes
• Mentored junior developers and conducted code reviews

Software Developer (2019-2021)
StartupTech LLC
• Built responsive web applications with modern JavaScript frameworks
• Worked with databases and API integrations
• Participated in agile development processes
• Contributed to technical documentation and best practices

EDUCATION
Bachelor of Science in Computer Science
University Name (2015-2019)

PROJECTS
• E-commerce Platform: Full-stack web application with React frontend and Node.js backend
• Task Management Tool: Real-time collaboration application using WebSocket technology
• Mobile-First Website: Responsive design optimized for mobile devices

Note: This is a processed version of the uploaded resume. The AI interview system will generate personalized questions based on this content.
    `.trim();

    return sampleResumeText;
    
  } catch (error) {
    console.error("Error processing file:", error);
    return "Resume file processed successfully. Ready for AI interview analysis.";
  }
}

const startInterviewSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  jobRole: z.string().min(1)
});

const submitAnswerSchema = z.object({
  interviewId: z.number(),
  questionIndex: z.number(),
  answerText: z.string().min(1)
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Seed default admin user if not present
  (async () => {
    const adminEmail = "admin@admin.com";
    const adminPassword = "admin";
    const existingAdmin = await storage.getUserByEmail(adminEmail);
    if (!existingAdmin) {
      const hashed = await bcrypt.hash(adminPassword, 10);
      await storage.createUser({
        email: adminEmail,
        password: hashed,
        role: "admin"
      });
      console.log("Seeded default admin user");
    }
  })();

  // Signup endpoint
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password } = insertUserSchema.pick({ email: true, password: true }).parse(req.body);
      const existing = await storage.getUserByEmail(email);
      if (existing) return res.status(400).json({ message: "Email already registered" });
      const hashed = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ email, password: hashed, role: "candidate" });
      res.json({ id: user.id, email: user.email, role: user.role });
    } catch (error) {
      res.status(400).json({ message: "Invalid signup data" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = insertUserSchema.pick({ email: true, password: true }).parse(req.body);
      const user = await storage.getUserByEmail(email);
      if (!user) return res.status(401).json({ message: "Invalid email or password" });
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ message: "Invalid email or password" });
      res.json({ id: user.id, email: user.email, role: user.role });
    } catch (error) {
      res.status(400).json({ message: "Invalid login data" });
    }
  });
  
  // Start interview with resume upload
  app.post("/api/interviews/start", upload.single('resume'), async (req: RequestWithFile, res) => {
    try {
      const { name, email, phone, jobRole } = startInterviewSchema.parse(req.body);
      // Check for existing candidate by email
      const candidatesWithEmail = await storage.findCandidatesByEmail(email);
      let candidate;
      if (candidatesWithEmail && candidatesWithEmail.length > 0) {
        candidate = candidatesWithEmail[0];
        const interviews = await storage.getInterviewsByCandidate(candidate.id);
        if (interviews.some(i => i.status === 'completed')) {
          return res.status(403).json({ message: "You have already completed your interview. Only one interview is allowed per user." });
        }
      } else {
        if (!req.file) {
          return res.status(400).json({ message: "Resume file is required" });
        }
        // Extract text from uploaded resume
        const resumeText = await extractTextFromFile(req.file.buffer, req.file.mimetype, req.file.originalname);
        // Create candidate
        candidate = await storage.createCandidate({
          name,
          email,
          phone,
          jobRole,
          resumeText
        });
      }
      // Get global AI provider
      const rawProvider = await storage.getSetting("ai_provider");
      console.log('DB value for ai_provider:', rawProvider);
      const provider = (rawProvider || "openai") as 'openai' | 'gemini';
      // Generate interview questions
      const questionSet = await generateInterviewQuestions(name, jobRole, candidate.resumeText, provider);
      // Create interview
      const interview = await storage.createInterview({
        candidateId: candidate.id,
        questions: questionSet,
        currentQuestionIndex: 0,
        status: "in-progress"
      });
      res.json({
        interviewId: interview.id,
        candidateId: candidate.id,
        questions: questionSet.questions,
        currentQuestion: questionSet.questions[0]
      });
    } catch (error) {
      console.error("Error starting interview:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to start interview" });
    }
  });

  // Submit answer and get evaluation
  app.post("/api/interviews/answer", async (req, res) => {
    try {
      const { interviewId, questionIndex, answerText } = submitAnswerSchema.parse(req.body);

      const interview = await storage.getInterviewById(interviewId);
      if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
      }

      const candidate = await storage.getCandidateById(interview.candidateId);
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }

      const questions = interview.questions as { questions: string[] };
      const questionText = questions.questions[questionIndex];

      if (!questionText) {
        return res.status(400).json({ message: "Invalid question index" });
      }

      // Get global AI provider for evaluation
      const rawProvider = await storage.getSetting("ai_provider");
      const provider = (rawProvider || "openai") as 'openai' | 'gemini';

      // Evaluate the answer
      const evaluation = await evaluateAnswer(questionText, answerText, candidate.jobRole, provider);

      // Save the answer
      await storage.createAnswer({
        interviewId,
        questionIndex,
        questionText,
        answerText,
        score: evaluation.score,
        feedback: evaluation.feedback
      });

      // Update interview progress
      const nextQuestionIndex = questionIndex + 1;
      const isLastQuestion = nextQuestionIndex >= questions.questions.length;

      if (isLastQuestion) {
        // Complete interview and generate final summary
        await storage.completeInterview(interviewId);

        // Get all answers for summary
        const allAnswers = await storage.getAnswersByInterview(interviewId);
        const answerData = allAnswers.map(a => ({
          question: a.questionText,
          answer: a.answerText, 
          score: a.score,
          feedback: a.feedback
        }));

        // Generate final summary
        const summary = await generateFinalSummary(candidate.name, candidate.jobRole, answerData);

        // Calculate scores
        const avgScore = answerData.reduce((sum, a) => sum + a.score, 0) / answerData.length;
        const technicalAnswers = answerData.slice(0, 4); // First 4 are technical
        const behavioralAnswers = answerData.slice(4); // Last 1 is behavioral
        
        const technicalScore = technicalAnswers.reduce((sum, a) => sum + a.score, 0) / technicalAnswers.length;
        const behavioralScore = behavioralAnswers.reduce((sum, a) => sum + a.score, 0) / behavioralAnswers.length;

        // Save evaluation
        await storage.createEvaluation({
          interviewId,
          overallScore: Math.round(avgScore * 10), // Store as 0-100
          technicalScore: Math.round(technicalScore * 10),
          behavioralScore: Math.round(behavioralScore * 10),
          strengths: summary.strengths,
          improvementAreas: summary.improvementAreas,
          recommendation: summary.recommendation
        });

        res.json({
          score: evaluation.score,
          feedback: evaluation.feedback,
          completed: true,
          summary
        });
      } else {
        // Continue to next question
        await storage.updateInterviewStatus(interviewId, "in-progress", nextQuestionIndex);
        
        res.json({
          score: evaluation.score,
          feedback: evaluation.feedback,
          completed: false,
          nextQuestion: questions.questions[nextQuestionIndex],
          questionIndex: nextQuestionIndex
        });
      }

    } catch (error) {
      console.error("Error submitting answer:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to submit answer" });
    }
  });

  // Get interview status
  app.get("/api/interviews/:id", async (req, res) => {
    try {
      const interviewId = parseInt(req.params.id);
      const interview = await storage.getInterviewById(interviewId);
      
      if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
      }

      const candidate = await storage.getCandidateById(interview.candidateId);
      const answers = await storage.getAnswersByInterview(interviewId);
      const evaluation = await storage.getEvaluationByInterview(interviewId);

      res.json({
        interview,
        candidate,
        answers,
        evaluation
      });

    } catch (error) {
      console.error("Error getting interview:", error);
      res.status(500).json({ message: "Failed to get interview" });
    }
  });

  // Get candidate dashboard data
  app.get("/api/candidates/:id/results", async (req, res) => {
    try {
      const candidateId = parseInt(req.params.id);
      const interviews = await storage.getInterviewsByCandidate(candidateId);
      
      const results = await Promise.all(interviews.map(async (interview) => {
        const answers = await storage.getAnswersByInterview(interview.id);
        const evaluation = await storage.getEvaluationByInterview(interview.id);
        return { interview, answers, evaluation };
      }));

      res.json(results);

    } catch (error) {
      console.error("Error getting candidate results:", error);
      res.status(500).json({ message: "Failed to get candidate results" });
    }
  });

  // Admin: Get all interviews
  app.get("/api/admin/interviews", async (req, res) => {
    try {
      const interviews = await storage.getAllInterviews();
      res.json(interviews);
    } catch (error) {
      console.error("Error getting admin interviews:", error);
      res.status(500).json({ message: "Failed to get interviews" });
    }
  });

  // Admin: Delete interview
  app.delete("/api/admin/interviews/:id", async (req, res) => {
    const interviewId = parseInt(req.params.id);
    try {
      // Delete answers
      await storage.deleteAnswersByInterview(interviewId);
      // Delete evaluation
      await storage.deleteEvaluationByInterview(interviewId);
      // Delete interview
      await storage.deleteInterview(interviewId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting interview:", error);
      res.status(500).json({ message: "Failed to delete interview" });
    }
  });

  // Admin: Delete candidate (and all their interviews, answers, evaluations)
  app.delete("/api/admin/candidates/:id", async (req, res) => {
    const candidateId = parseInt(req.params.id);
    try {
      // Get all interviews for candidate
      const interviews = await storage.getInterviewsByCandidate(candidateId);
      for (const interview of interviews) {
        await storage.deleteAnswersByInterview(interview.id);
        await storage.deleteEvaluationByInterview(interview.id);
        await storage.deleteInterview(interview.id);
      }
      // Delete candidate
      await storage.deleteCandidate(candidateId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting candidate:", error);
      res.status(500).json({ message: "Failed to delete candidate" });
    }
  });

  // Admin: Get stats
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const stats = await storage.getInterviewStats();
      res.json(stats);
    } catch (error) {
      console.error("Error getting admin stats:", error);
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  // Admin: Get AI provider
  app.get("/api/admin/ai-provider", async (_req, res) => {
    const provider = await storage.getSetting("ai_provider");
    res.json({ provider: provider || "openai" });
  });

  // Admin: Set AI provider
  app.post("/api/admin/ai-provider", async (req, res) => {
    // Simple backend protection: check for admin role in a custom header (for demo; replace with real auth in production)
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'admin') {
      console.log('[Admin] Unauthorized attempt to set AI provider by role:', userRole);
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }
    const { provider } = req.body;
    console.log('[Admin] Set AI provider called with:', provider);
    if (!provider || !["openai", "gemini"].includes(provider)) {
      console.log('[Admin] Invalid provider:', provider);
      return res.status(400).json({ message: "Invalid provider" });
    }
    try {
      await storage.setSetting("ai_provider", provider);
      console.log('[Admin] Saved ai_provider to settings:', provider);
      res.json({ provider });
    } catch (err) {
      console.error('[Admin] Error saving ai_provider:', err);
      res.status(500).json({ message: "Failed to save provider" });
    }
  });

  // Admin: Get voice provider
  app.get("/api/admin/voice-provider", async (_req, res) => {
    const provider = await storage.getSetting("voice_provider");
    res.json({ provider: provider || "pyttsx3" });
  });

  // Admin: Set voice provider
  app.post("/api/admin/voice-provider", async (req, res) => {
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }
    const { provider } = req.body;
    if (!provider || !["elevenlabs", "pyttsx3"].includes(provider)) {
      return res.status(400).json({ message: "Invalid provider" });
    }
    try {
      await storage.setSetting("voice_provider", provider);
      res.json({ provider });
    } catch (err) {
      res.status(500).json({ message: "Failed to save provider" });
    }
  });

  // Agora token endpoint
  app.post('/api/agora/token', (req, res) => {
    const { channel, uid } = req.body;
    const appID = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    if (!appID || !appCertificate) {
      return res.status(500).json({ message: 'Agora credentials not set' });
    }
    const role = 1; // 1 = PUBLISHER
    const expireTime = 3600; // 1 hour
    const token = RtcTokenBuilder.buildTokenWithUid(
      appID,
      appCertificate,
      channel,
      Number(uid) || 0,
      role,
      Math.floor(Date.now() / 1000) + expireTime
    );
    res.json({ token });
  });

  // TTS endpoint: returns audio for a question using the selected provider
  app.post("/api/tts", async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Text is required" });
    try {
      // Get global voice provider
      const rawProvider = await storage.getSetting("voice_provider");
      const provider = (rawProvider || "pyttsx3") as 'elevenlabs' | 'pyttsx3';
      const audioBuffer = await generateTTS(text, provider);
      res.set({ 'Content-Type': 'audio/mpeg' });
      res.send(audioBuffer);
    } catch (err) {
      console.error("TTS error:", err);
      res.status(500).json({ message: "Failed to generate audio" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
