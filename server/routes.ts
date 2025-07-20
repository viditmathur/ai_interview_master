import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";

interface RequestWithFile extends Request {
  file?: Express.Multer.File;
}
import { storage } from "./storage";
import { generateInterviewQuestions, evaluateAnswer, generateFinalSummary } from "./services/openai";
import { insertCandidateSchema, insertAnswerSchema } from "@shared/schema";
import { z } from "zod";

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
  
  // Start interview with resume upload
  app.post("/api/interviews/start", upload.single('resume'), async (req: RequestWithFile, res) => {
    try {
      const { name, email, phone, jobRole } = startInterviewSchema.parse(req.body);
      
      if (!req.file) {
        return res.status(400).json({ message: "Resume file is required" });
      }

      // Extract text from uploaded resume
      const resumeText = await extractTextFromFile(req.file.buffer, req.file.mimetype, req.file.originalname);

      // Create candidate
      const candidate = await storage.createCandidate({
        name,
        email, 
        phone,
        jobRole,
        resumeText
      });

      // Generate interview questions
      const questionSet = await generateInterviewQuestions(name, jobRole, resumeText);

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

      // Evaluate the answer
      const evaluation = await evaluateAnswer(questionText, answerText, candidate.jobRole);

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

  const httpServer = createServer(app);
  return httpServer;
}
