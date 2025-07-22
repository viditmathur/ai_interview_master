import { apiRequest } from "./queryClient";

export interface StartInterviewRequest {
  name: string;
  email: string;
  phone: string;
  jobRole: string;
  resume: File;
}

export interface StartInterviewResponse {
  interviewId: number;
  candidateId: number;
  questions: string[];
  currentQuestion: string;
}

export interface SubmitAnswerRequest {
  interviewId: number;
  questionIndex: number;
  answerText: string;
}

export interface SubmitAnswerResponse {
  score: number;
  feedback: string;
  completed: boolean;
  nextQuestion?: string;
  questionIndex?: number;
  summary?: {
    strengths: string;
    improvementAreas: string;
    finalRating: number;
    recommendation: string;
  };
}

export async function startInterview(data: StartInterviewRequest): Promise<StartInterviewResponse> {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('email', data.email);
  formData.append('phone', data.phone);
  formData.append('jobRole', data.jobRole);
  formData.append('resume', data.resume);

  const response = await fetch('/api/interviews/start', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to start interview');
  }

  return response.json();
}

export async function submitAnswer(data: SubmitAnswerRequest): Promise<SubmitAnswerResponse> {
  const response = await apiRequest('POST', '/api/interviews/answer', data);
  return response.json();
}

export async function getInterview(id: number) {
  const response = await apiRequest('GET', `/api/interviews/${id}`);
  return response.json();
}

export async function getCandidateResults(candidateId: number) {
  const response = await apiRequest('GET', `/api/candidates/${candidateId}/results`);
  return response.json();
}

export async function getAdminInterviews() {
  const response = await apiRequest('GET', '/api/admin/interviews');
  return response.json();
}

export async function getAdminStats() {
  const response = await apiRequest('GET', '/api/admin/stats');
  return response.json();
}

export async function deleteInterview(id: number) {
  const response = await apiRequest('DELETE', `/api/admin/interviews/${id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete interview');
  }
  return response.json();
}

export async function getInterviewResults(id: number) {
  const response = await apiRequest('GET', `/api/interviews/${id}`);
  return response.json();
}
