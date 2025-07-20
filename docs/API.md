# API Documentation

This document describes the REST API endpoints for the AI Interview Platform.

## Base URL
```
http://localhost:5000/api
```

## Authentication
Currently, no authentication is required. All endpoints are publicly accessible.

## Endpoints

### Interview Management

#### Start Interview
Creates a new interview session with resume upload.

```http
POST /api/interviews/start
Content-Type: multipart/form-data
```

**Form Data:**
- `name` (string): Candidate name
- `email` (string): Candidate email  
- `jobRole` (string): Job role being interviewed for
- `resume` (file): Resume file (PDF, DOC, or TXT)

**Response:**
```json
{
  "interviewId": 1,
  "candidateId": 2,
  "questions": [
    "What is your experience with React?",
    "How do you handle state management?",
    "..."
  ]
}
```

**Status Codes:**
- `200` - Interview started successfully
- `400` - Invalid request or missing resume file
- `500` - Server error

#### Get Interview Details
Retrieves interview information and questions.

```http
GET /api/interviews/:id
```

**Response:**
```json
{
  "id": 1,
  "candidateId": 2,
  "questions": {
    "questions": ["Question 1", "Question 2", "..."]
  },
  "status": "in-progress",
  "currentQuestionIndex": 2,
  "createdAt": "2025-01-20T14:30:00.000Z"
}
```

#### Submit Answer
Submits an answer for evaluation.

```http
POST /api/interviews/answer
Content-Type: application/json
```

**Request Body:**
```json
{
  "interviewId": 1,
  "questionIndex": 0,
  "answer": "I have 3 years of experience with React..."
}
```

**Response:**
```json
{
  "score": 8,
  "feedback": "Great answer showing practical experience. Consider mentioning specific React features you've used."
}
```

#### Complete Interview
Finishes the interview and generates final evaluation.

```http
POST /api/interviews/complete
Content-Type: application/json
```

**Request Body:**
```json
{
  "interviewId": 1
}
```

**Response:**
```json
{
  "success": true,
  "evaluation": {
    "overallScore": 7.6,
    "strengths": "Strong technical knowledge...",
    "improvementAreas": "Could improve communication...",
    "recommendation": "Hire"
  }
}
```

### Candidate Management

#### Get Candidate Results
Retrieves interview results for a candidate.

```http
GET /api/candidates/:id/results
```

**Response:**
```json
[
  {
    "interview": {
      "id": 1,
      "status": "completed",
      "createdAt": "2025-01-20T14:30:00.000Z",
      "completedAt": "2025-01-20T15:00:00.000Z"
    },
    "evaluation": {
      "overallScore": 7.6,
      "strengths": "Strong technical foundation...",
      "improvementAreas": "Could benefit from...",
      "recommendation": "Hire"
    },
    "answers": [
      {
        "question": "What is your experience with React?",
        "answer": "I have been working with React...",
        "score": 8,
        "feedback": "Excellent explanation..."
      }
    ]
  }
]
```

### Admin Dashboard

#### Get Interview Statistics
Retrieves platform-wide interview statistics.

```http
GET /api/admin/stats
```

**Response:**
```json
{
  "total": 25,
  "recommended": 12,
  "maybe": 8,
  "rejected": 5,
  "avgScore": 7.2
}
```

#### Get All Interviews
Retrieves all interviews with candidate information.

```http
GET /api/admin/interviews
```

**Response:**
```json
[
  {
    "id": 1,
    "candidateId": 2,
    "status": "completed",
    "createdAt": "2025-01-20T14:30:00.000Z",
    "completedAt": "2025-01-20T15:00:00.000Z",
    "candidate": {
      "id": 2,
      "name": "John Doe",
      "email": "john@example.com",
      "jobRole": "Frontend Developer"
    },
    "evaluation": {
      "overallScore": 7.6,
      "recommendation": "Hire"
    }
  }
]
```

## Data Models

### Candidate
```typescript
interface Candidate {
  id: number;
  name: string;
  email: string;
  jobRole: string;
  resumeText: string;
  createdAt: Date;
}
```

### Interview
```typescript
interface Interview {
  id: number;
  candidateId: number;
  questions: QuestionSet;
  status: "pending" | "in-progress" | "completed";
  currentQuestionIndex: number;
  createdAt: Date;
  completedAt?: Date;
}
```

### Answer
```typescript
interface Answer {
  id: number;
  interviewId: number;
  questionIndex: number;
  question: string;
  answer: string;
  score: number;
  feedback: string;
  createdAt: Date;
}
```

### Evaluation
```typescript
interface Evaluation {
  id: number;
  interviewId: number;
  overallScore: number;
  strengths: string;
  improvementAreas: string;
  recommendation: "Hire" | "Maybe" | "No";
  createdAt: Date;
}
```

## Error Handling

### Error Response Format
```json
{
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes
- `INVALID_REQUEST` - Malformed request
- `FILE_UPLOAD_ERROR` - Resume upload failed
- `INTERVIEW_NOT_FOUND` - Interview ID doesn't exist
- `AI_SERVICE_ERROR` - AI evaluation failed
- `DATABASE_ERROR` - Database operation failed

## Rate Limiting
Currently no rate limiting is implemented. Consider implementing rate limiting for production use.

## File Upload Limits
- Maximum file size: 5MB
- Supported formats: PDF, DOC, DOCX, TXT
- Files are processed in memory and not stored permanently

## AI Integration Notes
- The system uses OpenAI GPT-4o when available
- Falls back to intelligent mock AI when OpenAI is unavailable
- Question generation is personalized based on resume content
- Answer evaluation considers technical accuracy and communication skills