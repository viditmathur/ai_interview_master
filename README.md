# AI Interview Master

AI-powered first-round interview platform with resume analysis and real-time evaluation.

## 🚀 Ready for Production Deployment

This application is now configured for Vercel deployment with:
- Full-stack Node.js/React setup
- AI-powered resume extraction using Gemini
- Real-time interview evaluation
- Admin dashboard with comprehensive analytics

## Features

- **AI Resume Analysis**: Intelligent extraction of candidate information
- **Real-time Interviews**: Video-based AI interviews with live evaluation
- **Admin Dashboard**: Comprehensive candidate and interview management
- **Email Integration**: Automated invitation system
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI Services**: Google Gemini, OpenAI
- **Video**: Agora RTC
- **Email**: SendGrid
- **Deployment**: Vercel

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run development: `npm run dev`
5. Deploy to Vercel for production

## Environment Variables

Required environment variables for deployment:
- `DATABASE_URL` - PostgreSQL connection string
- `GEMINI_API_KEY` - Google Gemini API key
- `OPENAI_API_KEY` - OpenAI API key
- `SENDGRID_API_KEY` - SendGrid email service key
- `JWT_SECRET` - JWT signing secret
- `AGORA_APP_ID` - Agora video service app ID
- `AGORA_APP_CERTIFICATE` - Agora app certificate
- `ELEVENLABS_API_KEY` - ElevenLabs voice synthesis key

## License

MIT License# Force Vercel deployment update
