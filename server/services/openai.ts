import OpenAI from "openai";
import type { QuestionSet, AnswerEvaluation, InterviewSummary } from "@shared/schema";
import { generateMockQuestions, evaluateMockAnswer, generateMockSummary } from "./mock-ai";
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "sk-mock-key" 
});

// Check if we have a valid OpenAI API key
const hasValidOpenAIKey = process.env.OPENAI_API_KEY && 
  process.env.OPENAI_API_KEY.startsWith('sk-') && 
  process.env.OPENAI_API_KEY.length > 20;

// Gemini evaluation
async function geminiEvaluateAnswer(question: string, answer: string, jobRole: string): Promise<AnswerEvaluation> {
  let apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    try {
      const envPath = path.resolve(process.cwd(), '.env');
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const match = envContent.match(/^GEMINI_API_KEY=(.*)$/m);
      if (match) {
        apiKey = match[1].trim();
      }
    } catch (e) {}
  }
  if (!apiKey) throw new Error('Gemini API key not set');
  const prompt = `You are an expert technical interviewer. Evaluate the following candidate answer for the given job role and question. Score from 0-10 (0=incorrect/no answer, 10=perfect, 7=good, 5=average, 3=poor). Give concise, actionable feedback.\n\nJob Role: ${jobRole}\nQuestion: ${question}\nAnswer: ${answer}\n\nRespond with JSON:\n{\n  "score": 8,\n  "feedback": "Good explanation, but could be more detailed."\n}`;
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });
  const rawBody = await response.text();
  let data = {};
  try { data = JSON.parse(rawBody); } catch {}
  let text = '';
  const candidates = (data as any).candidates;
  if (candidates && candidates[0]) {
    if (candidates[0].content && candidates[0].content.parts && candidates[0].content.parts[0] && candidates[0].content.parts[0].text) {
      text = candidates[0].content.parts[0].text;
    } else if (candidates[0].content && candidates[0].content.text) {
      text = candidates[0].content.text;
    } else if (candidates[0].content) {
      text = JSON.stringify(candidates[0].content);
    }
  }
  try {
    const cleaned = text.replace(/^```json|^```|```$/gm, '').trim();
    const result = JSON.parse(cleaned);
    if (typeof result.score !== "number" || result.score < 0 || result.score > 10) {
      throw new Error("Invalid score from Gemini evaluation");
    }
    return {
      score: Math.round(result.score),
      feedback: result.feedback || "No feedback provided"
    };
  } catch (e) {
    return { score: 0, feedback: "Could not evaluate answer." };
  }
}

// Gemini integration
async function geminiGenerateQuestions(candidateName: string, jobRole: string, resumeText: string): Promise<QuestionSet> {
  let apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Fallback: try to read from .env file directly
    try {
      const envPath = path.resolve(process.cwd(), '.env');
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const match = envContent.match(/^GEMINI_API_KEY=(.*)$/m);
      if (match) {
        apiKey = match[1].trim();
      }
    } catch (e) {
      // ignore
    }
  }
  if (!apiKey) throw new Error('Gemini API key not set');
  console.log('Loaded GEMINI_API_KEY:', apiKey ? apiKey.slice(0, 8) + '...' : 'NOT FOUND');
  const prompt = `You are an expert technical interviewer. Analyze the candidate's resume and job role, and generate exactly 5 highly technical, intermediate programming interview questions (including at least 2 that require code, algorithms, or problem-solving), and 1 behavioral question.\n\nMake the questions challenging and specifically reference the candidate's listed skills, technologies, and experience from the resume. Avoid generic questions.\n\nCandidate Name: ${candidateName}\nJob Role: ${jobRole}\nResume Text: ${resumeText}\n\nRespond with JSON in this format:\n{\n  "questions": [\n    "Technical Question 1...",\n    "Technical Question 2...",\n    "Technical Question 3...",\n    "Technical Question 4...",\n    "Technical Question 5...",\n    "Behavioral Question..."\n  ]\n}`;
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });
  const rawBody = await response.text();
  console.log('[Gemini] HTTP status:', response.status);
  console.log('[Gemini] Raw response body:', rawBody);
  let data = {};
  try {
    data = JSON.parse(rawBody);
  } catch (e) {
    console.error('[Gemini] Failed to parse response as JSON:', rawBody);
    throw new Error('Failed to parse Gemini response as JSON: ' + rawBody);
  }
  console.log('[Gemini] Full API response:', JSON.stringify(data, null, 2));
  // Try to find the text content in the response
  let text = '';
  const candidates = (data as any).candidates;
  if (candidates && candidates[0]) {
    if (candidates[0].content && candidates[0].content.parts && candidates[0].content.parts[0] && candidates[0].content.parts[0].text) {
      text = candidates[0].content.parts[0].text;
    } else if (candidates[0].content && candidates[0].content.text) {
      text = candidates[0].content.text;
    } else if (candidates[0].content) {
      text = JSON.stringify(candidates[0].content);
    }
  }
  try {
    // Remove Markdown code block if present
    const cleaned = text.replace(/^```json|^```|```$/gm, '').trim();
    const result = JSON.parse(cleaned);
    if (!result.questions || !Array.isArray(result.questions) || result.questions.length < 2) {
      throw new Error('Invalid question format from Gemini');
    }
    return result as QuestionSet;
  } catch (e) {
    console.error('[Gemini] Failed to parse response text:', text);
    throw new Error('Failed to parse Gemini response: ' + text);
  }
}

export async function generateInterviewQuestions(
  candidateName: string,
  jobRole: string,
  resumeText: string,
  provider: 'openai' | 'gemini' = 'openai'
): Promise<QuestionSet> {
  console.log('Provider for question generation:', provider);
  if (provider === 'gemini') {
    try {
      return await geminiGenerateQuestions(candidateName, jobRole, resumeText);
    } catch (err) {
      console.error('[Gemini] Error generating questions:', err);
      console.log('Falling back to mock AI for question generation');
      return generateMockQuestions(candidateName, jobRole, resumeText);
    }
  }
  // Use mock AI if OpenAI is not available
  if (!hasValidOpenAIKey) {
    console.log("Using mock AI for question generation (OpenAI not available)");
    return generateMockQuestions(candidateName, jobRole, resumeText);
  }

  const prompt = `You are Tushar, a professional AI interviewer. Analyze the candidate's resume and generate exactly 5 interview questions.

Candidate Name: ${candidateName}
Job Role: ${jobRole}
Resume Text: ${resumeText}

Generate:
- 4 technical questions relevant to the resume and job role
- 1 behavioral question (e.g., team conflict, failure, leadership)

Make questions conversational and speakable. Consider the candidate's domain and technical stack from their resume.

Respond with JSON in this format:
{
  "questions": [
    "Question 1...",
    "Question 2...",
    "Question 3...",
    "Question 4...",
    "Question 5..."
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are Tushar, a professional AI interviewer conducting realistic first-round interviews. Generate personalized questions based on the candidate's resume and job role."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    if (!result.questions || !Array.isArray(result.questions) || result.questions.length !== 5) {
      throw new Error("Invalid question format from AI");
    }

    return result as QuestionSet;
  } catch (error) {
    console.error("Error generating questions:", error);
    // Fallback to mock AI if OpenAI fails
    console.log("Falling back to mock AI due to OpenAI error");
    return generateMockQuestions(candidateName, jobRole, resumeText);
  }
}

export async function evaluateAnswer(
  question: string,
  answer: string,
  jobRole: string,
  provider: 'openai' | 'gemini' = 'openai'
): Promise<AnswerEvaluation> {
  if (provider === 'gemini') {
    return geminiEvaluateAnswer(question, answer, jobRole);
  }
  // Use mock AI if OpenAI is not available
  if (!hasValidOpenAIKey) {
    console.log("Using mock AI for answer evaluation (OpenAI not available)");
    return evaluateMockAnswer(question, answer, jobRole);
  }

  const prompt = `You are Tushar, evaluating a candidate's interview answer. \n\nJob Role: ${jobRole}\nQuestion: ${question}\nAnswer: ${answer}\n\nEvaluate this answer considering:\n- Clarity and correctness\n- Technical depth (if applicable)  \n- Communication skills\n- Domain expertise\n\nProvide a score from 0-10 and 1-2 lines of constructive feedback.\n\nRespond with JSON:\n{\n  "score": 8,\n  "feedback": "Good explanation, but consider mentioning specific examples."\n}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system", 
          content: "You are Tushar, a professional AI interviewer providing fair and constructive evaluations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    if (typeof result.score !== "number" || result.score < 0 || result.score > 10) {
      throw new Error("Invalid score from AI evaluation");
    }

    return {
      score: Math.round(result.score),
      feedback: result.feedback || "No feedback provided"
    };
  } catch (error) {
    console.error("Error evaluating answer:", error);
    // Fallback to mock AI if OpenAI fails
    console.log("Falling back to mock AI for answer evaluation");
    return evaluateMockAnswer(question, answer, jobRole);
  }
}

export async function generateFinalSummary(
  candidateName: string,
  jobRole: string,
  answers: Array<{ question: string; answer: string; score: number; feedback: string }>
): Promise<InterviewSummary> {
  // Use mock AI if OpenAI is not available
  if (!hasValidOpenAIKey) {
    console.log("Using mock AI for final summary (OpenAI not available)");
    return generateMockSummary(candidateName, jobRole, answers);
  }

  const answersText = answers.map((a, i) => 
    `Q${i+1}: ${a.question}\nAnswer: ${a.answer}\nScore: ${a.score}/10\nFeedback: ${a.feedback}`
  ).join("\n\n");

  const prompt = `You are Tushar, providing a final interview summary for ${candidateName} applying for ${jobRole}.

Interview Answers and Scores:
${answersText}

Generate a comprehensive summary with:
- Key strengths (2-3 points)
- Improvement areas (2-3 points) 
- Final rating out of 10 (based on average performance)
- Recommendation: "Hire" (8+ average), "Maybe" (6-7 average), or "No" (<6 average)

Respond with JSON:
{
  "strengths": "Strong technical foundation and clear communication skills.",
  "improvementAreas": "Could benefit from more hands-on experience with cloud platforms.",
  "finalRating": 7.5,
  "recommendation": "Maybe"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are Tushar, providing comprehensive interview summaries with actionable insights."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    if (!["Hire", "Maybe", "No"].includes(result.recommendation)) {
      throw new Error("Invalid recommendation from AI");
    }

    return {
      strengths: result.strengths || "No strengths identified",
      improvementAreas: result.improvementAreas || "No improvement areas identified", 
      finalRating: Math.max(0, Math.min(10, result.finalRating || 0)),
      recommendation: result.recommendation
    };
  } catch (error) {
    console.error("Error generating summary:", error);
    // Fallback to mock AI if OpenAI fails
    console.log("Falling back to mock AI for final summary");
    return generateMockSummary(candidateName, jobRole, answers);
  }
}
