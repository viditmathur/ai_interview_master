# AI-Powered Interview Platform

An intelligent first-round interviewer system that conducts automated interviews with resume analysis, voice interactions, real-time scoring, and comprehensive evaluation dashboards.

## Features

### Core Capabilities
- **Resume Upload & Analysis**: Upload PDF, DOC, or TXT resumes with intelligent text extraction
- **AI Question Generation**: Personalized interview questions based on resume content and job role
- **Voice Interface**: Speech-to-text recognition and text-to-speech for natural conversations
- **Real-time Evaluation**: Instant scoring (0-10) and detailed feedback for each answer
- **Comprehensive Reports**: Final assessment with strengths, improvement areas, and hiring recommendations

### Dashboard Features
- **Candidate Dashboard**: View interview history, scores, and detailed feedback
- **Admin Dashboard**: Manage interviews, view statistics, and candidate evaluations
- **Interview Statistics**: Track hiring recommendations and performance metrics

### Technical Highlights
- **Intelligent Fallback System**: Continues operation even when external AI services are unavailable
- **PostgreSQL Integration**: Persistent data storage for production environments
- **Responsive Design**: Optimized for desktop and mobile devices
- **Accessibility**: ARIA compliant with keyboard navigation support

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Radix UI** components with shadcn/ui
- **TanStack React Query** for state management
- **Wouter** for client-side routing
- **Web Speech API** for voice interactions

### Backend
- **Node.js** with Express.js
- **TypeScript** with ESM modules
- **OpenAI GPT-4o** for AI-powered features
- **PostgreSQL** with Drizzle ORM
- **Multer** for file upload handling

### AI Integration
- **OpenAI GPT-4o** for question generation and evaluation
- **Intelligent Mock AI** fallback system for continuous operation
- **Resume Analysis** with personalized question generation
- **Real-time Scoring** with detailed feedback

## Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- OpenAI API key (optional - has fallback system)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ai-interview-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Configure these variables in `.env`:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/interview_db
   OPENAI_API_KEY=your-openai-api-key-here  # Optional
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## Usage Guide

### For Candidates
1. **Upload Resume**: Submit your resume (PDF, DOC, or TXT format)
2. **Start Interview**: Answer 5 personalized questions (4 technical, 1 behavioral)  
3. **Voice Interaction**: Use speech-to-text or type your responses
4. **Get Results**: View detailed scores, feedback, and recommendations

### For Administrators
1. **View Statistics**: Monitor interview completion rates and recommendations
2. **Manage Interviews**: Review candidate evaluations and performance metrics
3. **Export Data**: Access detailed interview reports and analytics

## Project Structure

```
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components and routing
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and API client
├── server/                # Express.js backend
│   ├── services/         # AI services and business logic
│   ├── routes.ts         # API route definitions
│   ├── storage.ts        # Data storage interface
│   └── storage-db.ts     # PostgreSQL implementation
├── shared/               # Shared types and schemas
│   └── schema.ts         # Database schema and types
└── README.md
```

## API Endpoints

### Candidate Management
- `POST /api/interviews/start` - Upload resume and start interview
- `GET /api/interviews/:id` - Get interview details
- `POST /api/interviews/answer` - Submit answer for evaluation
- `POST /api/interviews/complete` - Complete interview and generate final report

### Admin Dashboard  
- `GET /api/admin/interviews` - List all interviews with candidate info
- `GET /api/admin/stats` - Get interview statistics and metrics
- `GET /api/candidates/:id/results` - Get candidate evaluation results

## AI System Architecture

### Question Generation
- Analyzes resume content and job role requirements
- Generates 4 technical + 1 behavioral question per interview
- Personalizes questions based on candidate's background and experience

### Answer Evaluation
- Real-time scoring from 0-10 scale
- Provides constructive feedback for improvement
- Considers technical accuracy, communication skills, and domain expertise

### Fallback System
- Intelligent mock AI activates when OpenAI is unavailable
- Maintains full functionality without external dependencies  
- Generates realistic questions and evaluations based on job roles

## Database Schema

### Core Tables
- **candidates**: Stores candidate information and resume text
- **interviews**: Manages interview sessions and generated questions
- **answers**: Records candidate responses with scores and feedback  
- **evaluations**: Final assessment reports with hiring recommendations

### Relationships
- One candidate can have multiple interviews
- Each interview contains multiple answers
- Each interview has one final evaluation

## Deployment

### Environment Setup
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations: `npm run db:push`
4. Build application: `npm run build`
5. Start production server: `npm start`

### Replit Deployment
The application is optimized for Replit deployment:
- Automatic dependency management
- Built-in PostgreSQL support  
- Environment variable configuration
- One-click deployment

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For questions or support:
- Create an issue in the GitHub repository
- Review the documentation in `/docs`
- Check the troubleshooting guide

---

Built with ❤️ using React, Node.js, and OpenAI GPT-4o