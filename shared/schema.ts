import { pgTable, text, serial, integer, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  jobRole: text("job_role").notNull(),
  resumeText: text("resume_text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const interviews = pgTable("interviews", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").references(() => candidates.id).notNull(),
  questions: jsonb("questions").notNull(), // Array of question objects
  currentQuestionIndex: integer("current_question_index").default(0).notNull(),
  status: text("status").default("pending").notNull(), // pending, in-progress, completed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const answers = pgTable("answers", {
  id: serial("id").primaryKey(),
  interviewId: integer("interview_id").references(() => interviews.id).notNull(),
  questionIndex: integer("question_index").notNull(),
  questionText: text("question_text").notNull(),
  answerText: text("answer_text").notNull(),
  score: integer("score").notNull(), // 0-10
  feedback: text("feedback").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const evaluations = pgTable("evaluations", {
  id: serial("id").primaryKey(),
  interviewId: integer("interview_id").references(() => interviews.id).notNull(),
  overallScore: integer("overall_score").notNull(), // 0-100
  technicalScore: integer("technical_score").notNull(),
  behavioralScore: integer("behavioral_score").notNull(),
  strengths: text("strengths").notNull(),
  improvementAreas: text("improvement_areas").notNull(),
  recommendation: text("recommendation").notNull(), // Hire, Maybe, No
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // hashed password
  role: text("role").notNull(), // 'admin' or 'candidate'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const questionBank = pgTable("question_bank", {
  id: serial("id").primaryKey(),
  role: text("role").notNull(),
  questionText: text("question_text").notNull(),
  source: text("source").notNull(), // e.g., 'gemini', 'manual'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertCandidateSchema = createInsertSchema(candidates).omit({
  id: true,
  createdAt: true,
});

export const insertInterviewSchema = createInsertSchema(interviews).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertAnswerSchema = createInsertSchema(answers).omit({
  id: true,
  createdAt: true,
});

export const insertEvaluationSchema = createInsertSchema(evaluations).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionBankSchema = createInsertSchema(questionBank).omit({
  id: true,
  createdAt: true,
});

// Types
export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;

export type Interview = typeof interviews.$inferSelect;
export type InsertInterview = z.infer<typeof insertInterviewSchema>;

export type Answer = typeof answers.$inferSelect;
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;

export type Evaluation = typeof evaluations.$inferSelect;
export type InsertEvaluation = z.infer<typeof insertEvaluationSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Setting = typeof settings.$inferSelect;
export type QuestionBank = typeof questionBank.$inferSelect;
export type InsertQuestionBank = Omit<QuestionBank, "id" | "createdAt">;

// Question and evaluation types for API responses
export interface QuestionSet {
  questions: string[];
}

export interface AnswerEvaluation {
  score: number;
  feedback: string;
}

export interface InterviewSummary {
  strengths: string;
  improvementAreas: string;
  finalRating: number;
  recommendation: "Hire" | "Maybe" | "No";
}
