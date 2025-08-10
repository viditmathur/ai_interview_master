import type { QuestionSet, AnswerEvaluation, InterviewSummary } from "../../shared/schema";

// Mock AI service for when OpenAI is not available
export function generateMockQuestions(
  candidateName: string,
  jobRole: string,
  resumeText: string
): QuestionSet {
  // Generate questions based on job role
  const technicalQuestions = {
    'frontend': [
      "What is the virtual DOM in React and how does it improve performance?",
      "Explain the difference between let, const, and var in JavaScript.",
      "How would you optimize a React application for better performance?",
      "Describe your experience with CSS preprocessors and modern CSS features."
    ],
    'backend': [
      "Explain the differences between SQL and NoSQL databases.",
      "How do you handle error handling in Node.js applications?",
      "Describe your approach to API design and RESTful services.",
      "What are the key considerations for database indexing?"
    ],
    'fullstack': [
      "How do you ensure data consistency between frontend and backend?",
      "Explain your approach to implementing authentication and authorization.",
      "Describe your experience with deployment pipelines and DevOps practices.",
      "How would you design a scalable web application architecture?"
    ],
    'qa': [
      "What is your approach to writing comprehensive test cases?",
      "Explain the difference between unit, integration, and end-to-end testing.",
      "How do you handle testing in agile development environments?",
      "Describe your experience with test automation frameworks."
    ],
    'devops': [
      "Explain your experience with containerization using Docker.",
      "How do you implement CI/CD pipelines for automated deployments?",
      "Describe your approach to monitoring and logging in production systems.",
      "What are the key considerations for cloud infrastructure management?"
    ],
    'ml': [
      "Explain the bias-variance tradeoff in machine learning.",
      "How do you handle overfitting in deep learning models?",
      "Describe your experience with feature engineering and selection.",
      "What are the key considerations for deploying ML models in production?"
    ],
    'mobile': [
      "Explain the differences between native and cross-platform mobile development.",
      "How do you handle state management in mobile applications?",
      "Describe your approach to mobile app performance optimization.",
      "What are the key considerations for mobile app security?"
    ]
  };

  const behavioralQuestion = "Tell me about a time when you had to work with a difficult team member and how you handled the situation.";
  
  const roleKey = jobRole.toLowerCase() as keyof typeof technicalQuestions;
  const questions = technicalQuestions[roleKey] || technicalQuestions['fullstack'];
  
  return {
    questions: [...questions, behavioralQuestion]
  };
}

export function evaluateMockAnswer(
  question: string,
  answer: string,
  jobRole: string
): AnswerEvaluation {
  // Simple evaluation based on answer length and keywords
  const answerLength = answer.trim().length;
  const hasCodeKeywords = /\b(function|class|const|let|var|async|await|return|if|else|for|while|array|object|API|HTTP|database|SQL|React|Node|JavaScript|TypeScript|Python|Java|C\+\+)\b/i.test(answer);
  const hasExamples = /\b(example|instance|experience|project|used|implemented|worked|built|developed)\b/i.test(answer);
  
  let score = 5; // Base score
  
  // Adjust score based on answer quality indicators
  if (answerLength > 100) score += 1;
  if (answerLength > 300) score += 1;
  if (hasCodeKeywords) score += 1;
  if (hasExamples) score += 1;
  if (answerLength > 500 && hasCodeKeywords && hasExamples) score += 1;
  
  // Ensure score is within bounds
  score = Math.max(3, Math.min(10, score));
  
  const feedbackOptions = [
    "Good explanation with relevant details. Consider adding more specific examples.",
    "Clear answer that demonstrates understanding. Could be more comprehensive.",
    "Well-structured response. Try to include more technical depth.",
    "Solid answer with good examples. Consider discussing edge cases or alternatives.",
    "Comprehensive response showing good knowledge. Well done!",
    "Excellent detailed explanation with practical insights. Great job!",
    "Outstanding answer with thorough coverage and real-world examples."
  ];
  
  const feedbackIndex = Math.min(Math.floor(score - 3), feedbackOptions.length - 1);
  
  return {
    score,
    feedback: feedbackOptions[feedbackIndex]
  };
}

export function generateMockSummary(
  candidateName: string,
  jobRole: string,
  answers: Array<{ question: string; answer: string; score: number; feedback: string }>
): InterviewSummary {
  const avgScore = answers.reduce((sum, a) => sum + a.score, 0) / answers.length;
  const technicalAnswers = answers.slice(0, 4);
  const behavioralAnswers = answers.slice(4);
  
  const avgTechnicalScore = technicalAnswers.reduce((sum, a) => sum + a.score, 0) / technicalAnswers.length;
  const avgBehavioralScore = behavioralAnswers.reduce((sum, a) => sum + a.score, 0) / behavioralAnswers.length;
  
  let strengths = "";
  let improvementAreas = "";
  let recommendation: "Hire" | "Maybe" | "No" = "Maybe";
  
  if (avgScore >= 8) {
    strengths = "Demonstrates strong technical knowledge and excellent communication skills. Shows practical experience with relevant technologies and provides clear, detailed explanations.";
    improvementAreas = "Continue developing expertise in emerging technologies. Consider leadership and mentoring opportunities.";
    recommendation = "Hire";
  } else if (avgScore >= 6) {
    strengths = "Good foundational knowledge and decent communication skills. Shows understanding of core concepts and some practical experience.";
    improvementAreas = "Could benefit from more hands-on experience and deeper technical knowledge. Work on providing more comprehensive examples and explanations.";
    recommendation = "Maybe";
  } else {
    strengths = "Shows basic understanding of fundamental concepts. Demonstrates willingness to learn and grow.";
    improvementAreas = "Needs significant development in technical skills and practical experience. Focus on building stronger foundation and communication abilities.";
    recommendation = "No";
  }
  
  return {
    strengths,
    improvementAreas,
    finalRating: Math.round(avgScore * 10) / 10,
    recommendation
  };
}