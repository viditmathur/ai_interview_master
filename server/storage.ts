import { 
  candidates, 
  interviews, 
  answers, 
  evaluations,
  type Candidate, 
  type InsertCandidate,
  type Interview,
  type InsertInterview,
  type Answer,
  type InsertAnswer,
  type Evaluation,
  type InsertEvaluation,
  users,
  type User,
  type InsertUser
} from "@shared/schema";

export interface IStorage {
  // Candidate operations
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  getCandidateById(id: number): Promise<Candidate | undefined>;
  updateCandidate(id: number, updates: Partial<Candidate>): Promise<Candidate>;
  
  // Interview operations
  createInterview(interview: InsertInterview): Promise<Interview>;
  getInterviewById(id: number): Promise<Interview | undefined>;
  getInterviewsByCandidate(candidateId: number): Promise<Interview[]>;
  updateInterviewStatus(id: number, status: string, currentQuestionIndex?: number): Promise<Interview | undefined>;
  completeInterview(id: number): Promise<Interview | undefined>;
  
  // Answer operations
  createAnswer(answer: InsertAnswer): Promise<Answer>;
  getAnswersByInterview(interviewId: number): Promise<Answer[]>;
  
  // Evaluation operations
  createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation>;
  getEvaluationByInterview(interviewId: number): Promise<Evaluation | undefined>;
  
  // Admin operations
  getAllInterviews(): Promise<(Interview & { candidate: Candidate; evaluation?: Evaluation })[]>;
  getInterviewStats(): Promise<{
    total: number;
    recommended: number;
    maybe: number;
    rejected: number;
    avgScore: number;
  }>;
  // Delete operations
  deleteInterview(id: number): Promise<void>;
  deleteAnswersByInterview(interviewId: number): Promise<void>;
  deleteEvaluationByInterview(interviewId: number): Promise<void>;
  deleteCandidate(id: number): Promise<void>;
  disqualifyCandidate(id: number): Promise<void>;
  getAllCandidates(): Promise<Candidate[]>;
  getAllQuestions(): Promise<any[]>;
  getAllAdmins(): Promise<User[]>;
  updateAdminRole(email: string, adminRole: string): Promise<void>;
  addAdmin(email: string, password: string, adminRole: string): Promise<User>;
  removeAdmin(email: string): Promise<void>;

  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  findCandidatesByEmail(email: string): Promise<any[]>;
  getAllUsers(): Promise<User[]>;
  // Settings operations
  getSetting(key: string): Promise<string | undefined>;
  setSetting(key: string, value: string): Promise<void>;
  getQuestionsByRole(role: string): Promise<any[]>;
  saveQuestionToBank(q: { role: string, questionText: string, source: string }): Promise<void>;
  createAuditLog(log: { action: string; target: string; performedBy: string; timestamp?: Date }): Promise<void>;
  getAuditLogs(filters?: { action?: string; performedBy?: string; date?: string }): Promise<any[]>;
  logTokenUsage(provider: string, tokens: number, cost: number, timestamp?: Date): Promise<void>;
  getTokenUsageStats(): Promise<any>;
}

export class MemStorage implements IStorage {
  private candidates: Map<number, Candidate> = new Map();
  private interviews: Map<number, Interview> = new Map();
  private answers: Map<number, Answer> = new Map();
  private evaluations: Map<number, Evaluation> = new Map();
  private users: Map<string, User> = new Map();
  private settings: Map<string, string> = new Map();
  private questionBank: Map<number, { id: number, role: string, questionText: string, source: string, createdAt: Date }> = new Map();
  
  private candidateIdCounter = 1;
  private interviewIdCounter = 1;
  private answerIdCounter = 1;
  private evaluationIdCounter = 1;
  private userIdCounter = 1;
  private questionBankIdCounter = 1;

  private auditLogs: any[] = [];
  private tokenUsage: any[] = [];

  async createCandidate(candidate: InsertCandidate): Promise<Candidate> {
    const id = this.candidateIdCounter++;
    const newCandidate: Candidate = { 
      ...candidate, 
      id, 
      createdAt: new Date(),
      disqualified: false
    };
    this.candidates.set(id, newCandidate);
    return newCandidate;
  }

  async getCandidateById(id: number): Promise<Candidate | undefined> {
    return this.candidates.get(id);
  }

  async updateCandidate(id: number, updates: Partial<Candidate>): Promise<Candidate> {
    const candidate = this.candidates.get(id);
    if (!candidate) throw new Error('Candidate not found');
    const updated = { ...candidate, ...updates };
    this.candidates.set(id, updated);
    return updated;
  }

  async createInterview(interview: InsertInterview): Promise<Interview> {
    const id = this.interviewIdCounter++;
    const newInterview: Interview = { 
      ...interview,
      status: interview.status || "pending",
      currentQuestionIndex: interview.currentQuestionIndex || 0,
      id, 
      createdAt: new Date(),
      completedAt: null
    };
    this.interviews.set(id, newInterview);
    return newInterview;
  }

  async getInterviewById(id: number): Promise<Interview | undefined> {
    return this.interviews.get(id);
  }

  async getInterviewsByCandidate(candidateId: number): Promise<Interview[]> {
    return Array.from(this.interviews.values()).filter(
      interview => interview.candidateId === candidateId
    );
  }

  async updateInterviewStatus(id: number, status: string, currentQuestionIndex?: number): Promise<Interview | undefined> {
    const interview = this.interviews.get(id);
    if (!interview) return undefined;
    
    const updated = { 
      ...interview, 
      status,
      ...(currentQuestionIndex !== undefined && { currentQuestionIndex })
    };
    this.interviews.set(id, updated);
    return updated;
  }

  async completeInterview(id: number): Promise<Interview | undefined> {
    const interview = this.interviews.get(id);
    if (!interview) return undefined;
    
    const updated = { 
      ...interview, 
      status: "completed",
      completedAt: new Date()
    };
    this.interviews.set(id, updated);
    return updated;
  }

  async createAnswer(answer: InsertAnswer): Promise<Answer> {
    const id = this.answerIdCounter++;
    const newAnswer: Answer = { 
      ...answer, 
      id, 
      createdAt: new Date() 
    };
    this.answers.set(id, newAnswer);
    return newAnswer;
  }

  async getAnswersByInterview(interviewId: number): Promise<Answer[]> {
    return Array.from(this.answers.values()).filter(
      answer => answer.interviewId === interviewId
    );
  }

  async createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation> {
    const id = this.evaluationIdCounter++;
    const newEvaluation: Evaluation = { 
      ...evaluation, 
      id, 
      createdAt: new Date() 
    };
    this.evaluations.set(id, newEvaluation);
    return newEvaluation;
  }

  async getEvaluationByInterview(interviewId: number): Promise<Evaluation | undefined> {
    return Array.from(this.evaluations.values()).find(
      evaluation => evaluation.interviewId === interviewId
    );
  }

  async getAllInterviews(): Promise<(Interview & { candidate: Candidate; evaluation?: Evaluation })[]> {
    const interviews = Array.from(this.interviews.values());
    return interviews.map(interview => ({
      ...interview,
      candidate: this.candidates.get(interview.candidateId)!,
      evaluation: Array.from(this.evaluations.values()).find(e => e.interviewId === interview.id)
    }));
  }

  async getInterviewStats(): Promise<{
    total: number;
    recommended: number;
    maybe: number;
    rejected: number;
    avgScore: number;
  }> {
    const evaluations = Array.from(this.evaluations.values());
    const total = evaluations.length;
    const recommended = evaluations.filter(e => e.recommendation === "Hire").length;
    const maybe = evaluations.filter(e => e.recommendation === "Maybe").length;
    const rejected = evaluations.filter(e => e.recommendation === "No").length;
    const avgScore = total > 0 ? evaluations.reduce((sum, e) => sum + e.overallScore, 0) / total : 0;

    return { total, recommended, maybe, rejected, avgScore: Math.round(avgScore * 10) / 10 };
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = {
      ...user,
      id,
      createdAt: new Date(),
    };
    this.users.set(user.email, newUser);
    return newUser;
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.get(email);
  }
  async findCandidatesByEmail(email: string) {
    return Array.from(this.candidates.values()).filter((c) => c.email === email);
  }
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  async getSetting(key: string): Promise<string | undefined> {
    return this.settings.get(key);
  }
  async setSetting(key: string, value: string): Promise<void> {
    this.settings.set(key, value);
  }

  async getQuestionsByRole(role: string) {
    return Array.from(this.questionBank.values()).filter(q => q.role === role);
  }
  async saveQuestionToBank({ role, questionText, source }: { role: string, questionText: string, source: string }) {
    const id = this.questionBankIdCounter++;
    this.questionBank.set(id, { id, role, questionText, source, createdAt: new Date() });
  }

  async createAuditLog(log: { action: string; target: string; performedBy: string; timestamp?: Date }) {
    this.auditLogs.push({ ...log, timestamp: log.timestamp || new Date(), id: this.auditLogs.length + 1 });
  }

  async getAuditLogs(filters?: { action?: string; performedBy?: string; date?: string }) {
    let logs = this.auditLogs;
    if (filters) {
      if (filters.action) logs = logs.filter(l => l.action === filters.action);
      if (filters.performedBy) logs = logs.filter(l => l.performedBy === filters.performedBy);
      if (filters.date) logs = logs.filter(l => l.timestamp && l.timestamp.toISOString().slice(0, 10) === filters.date);
    }
    return logs;
  }

  async logTokenUsage(provider: string, tokens: number, cost: number, timestamp?: Date) {
    this.tokenUsage.push({ id: this.tokenUsage.length + 1, provider, tokens, cost, timestamp: timestamp || new Date() });
  }
  async getTokenUsageStats() {
    // Aggregate by provider and period
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const stats: any = {};
    for (const u of this.tokenUsage) {
      if (!stats[u.provider]) stats[u.provider] = { daily: 0, weekly: 0, monthly: 0, cost: 0 };
      if (u.timestamp >= startOfDay) stats[u.provider].daily += u.tokens;
      if (u.timestamp >= startOfWeek) stats[u.provider].weekly += u.tokens;
      if (u.timestamp >= startOfMonth) stats[u.provider].monthly += u.tokens;
      stats[u.provider].cost += u.cost;
    }
    return stats;
  }

  async deleteInterview(id: number): Promise<void> {
    this.interviews.delete(id);
  }
  async deleteAnswersByInterview(interviewId: number): Promise<void> {
    for (const [id, answer] of Array.from(this.answers.entries())) {
      if (answer.interviewId === interviewId) {
        this.answers.delete(id);
      }
    }
  }
  async deleteEvaluationByInterview(interviewId: number): Promise<void> {
    for (const [id, evaluation] of Array.from(this.evaluations.entries())) {
      if (evaluation.interviewId === interviewId) {
        this.evaluations.delete(id);
      }
    }
  }
  async deleteCandidate(id: number): Promise<void> {
    this.candidates.delete(id);
  }

  async disqualifyCandidate(id: number): Promise<void> {
    const candidate = this.candidates.get(id);
    if (candidate) {
      this.candidates.set(id, { ...candidate, disqualified: true });
    }
  }

  async getAllCandidates(): Promise<Candidate[]> {
    return Array.from(this.candidates.values());
  }

  async getAllQuestions(): Promise<any[]> {
    return Array.from(this.questionBank.values());
  }

  async getAllAdmins(): Promise<User[]> {
    return Array.from(this.users.values()).filter(u => u.role === 'admin');
  }
  async updateAdminRole(email: string, adminRole: string) {
    const user = Array.from(this.users.values()).find(u => u.email === email);
    if (user) user.adminRole = adminRole;
  }
  async addAdmin(email: string, password: string, adminRole: string) {
    const user = { id: this.userIdCounter++, email, password, role: 'admin', adminRole, createdAt: new Date() };
    this.users.set(email, user);
    return user;
  }
  async removeAdmin(email: string) {
    this.users.delete(email);
  }
}

import { DatabaseStorage } from "./storage-db";

// Use database storage in production, memory storage for testing
export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
