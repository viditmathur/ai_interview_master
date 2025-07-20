# AI Interview Platform

## Overview

This is a full-stack AI-powered interview platform that allows candidates to upload resumes and participate in voice-based interview sessions. The system generates personalized interview questions based on resume content and job roles, provides real-time feedback, and creates comprehensive evaluation reports.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern full-stack architecture with clear separation between client, server, and shared components.

### Monorepo Structure
- **Frontend**: React with TypeScript in `client/` directory
- **Backend**: Express.js server with TypeScript in `server/` directory  
- **Shared**: Common types and schemas in `shared/` directory
- **Database**: PostgreSQL with Drizzle ORM migrations

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI with shadcn/ui components
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack React Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Voice Integration**: Native Web Speech API for speech recognition and synthesis

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **File Upload**: Multer middleware for resume processing
- **API Integration**: OpenAI GPT-4o for question generation and evaluation
- **Session Storage**: In-memory storage with interface for future database integration

### Database Schema
The application uses PostgreSQL with the following core entities:
- **Candidates**: Stores candidate information and resume text
- **Interviews**: Manages interview sessions and questions
- **Answers**: Records candidate responses with scores and feedback
- **Evaluations**: Final assessment reports with recommendations

### AI Integration
- **Question Generation**: Creates personalized questions based on resume content and job role
- **Answer Evaluation**: Provides real-time scoring (0-10) and detailed feedback
- **Final Assessment**: Generates comprehensive evaluation with hiring recommendations

## Data Flow

1. **Resume Upload**: Candidate submits personal information and resume file
2. **Question Generation**: AI analyzes resume and creates 5 targeted questions (4 technical, 1 behavioral)
3. **Interview Session**: Voice-based Q&A with real-time speech recognition
4. **Answer Processing**: Each response is evaluated and scored by AI
5. **Final Report**: Complete assessment with strengths, improvement areas, and hiring recommendation

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe ORM with schema validation
- **openai**: GPT-4o integration for AI-powered features
- **multer**: File upload handling for resume processing

### UI Dependencies
- **@radix-ui/***: Accessible UI components (dialogs, forms, navigation)
- **@tanstack/react-query**: Server state management and caching
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library

## Deployment Strategy

### Development Environment
- **Vite**: Fast development server with HMR
- **Node.js**: Backend server with file watching
- **Environment Variables**: DATABASE_URL and OPENAI_API_KEY required

### Production Build
- **Frontend**: Vite builds optimized static assets to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations handle schema deployment

### Key Features
- **Voice Interface**: Speech-to-text for candidate responses
- **Real-time Feedback**: Immediate scoring and suggestions
- **Admin Dashboard**: Interview statistics and candidate management  
- **Mobile Responsive**: Optimized for all device sizes
- **Accessibility**: ARIA compliant with keyboard navigation

The system is designed to be model-agnostic and easily extensible, with clear interfaces for adding new AI providers or storage backends.