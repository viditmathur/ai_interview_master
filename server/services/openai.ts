import OpenAI from "openai";
import type { QuestionSet, AnswerEvaluation, InterviewSummary } from "@shared/schema";
import { generateMockQuestions, evaluateMockAnswer, generateMockSummary } from "./mock-ai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "sk-mock-key" 
});

// Check if we have a valid OpenAI API key
const hasValidOpenAIKey = process.env.OPENAI_API_KEY && 
  process.env.OPENAI_API_KEY.startsWith('sk-') && 
  process.env.OPENAI_API_KEY.length > 20;

export async function generateInterviewQuestions(
  candidateName: string,
  jobRole: string,
  resumeText: string
): Promise<QuestionSet> {
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
  jobRole: string
): Promise<AnswerEvaluation> {
  // Use mock AI if OpenAI is not available
  if (!hasValidOpenAIKey) {
    console.log("Using mock AI for answer evaluation (OpenAI not available)");
    return evaluateMockAnswer(question, answer, jobRole);
  }

  const prompt = `You are Tushar, evaluating a candidate's interview answer. 

Job Role: ${jobRole}
Question: ${question}
Answer: ${answer}

Evaluate this answer considering:
- Clarity and correctness
- Technical depth (if applicable)  
- Communication skills
- Domain expertise

Provide a score from 0-10 and 1-2 lines of constructive feedback.

Respond with JSON:
{
  "score": 8,
  "feedback": "Good explanation, but consider mentioning specific examples."
}`;

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
