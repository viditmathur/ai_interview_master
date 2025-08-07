# AI Interview Master - Vercel Deployment Guide

## 🚀 Quick Deploy to Vercel

### Prerequisites
- Vercel account (free at [vercel.com](https://vercel.com))
- PostgreSQL database (recommended: [Neon](https://neon.tech) or [Supabase](https://supabase.com))
- API keys for AI services (OpenAI, Gemini, etc.)

### Step 1: Prepare Your Repository

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Ensure all files are committed:**
   - `vercel.json` (Vercel configuration)
   - `package.json` (with build scripts)
   - `client/package.json` (with build script)
   - All source code

### Step 2: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com) and sign in**

2. **Click "New Project"**

3. **Import your GitHub repository**

4. **Configure the project:**
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `dist/public`
   - **Install Command**: `npm install`

5. **Click "Deploy"**

### Step 3: Configure Environment Variables

After deployment, go to your project settings in Vercel:

1. **Navigate to Settings → Environment Variables**

2. **Add the following variables:**

   ```env
   # Database (Required)
   DATABASE_URL=postgresql://username:password@host:port/database
   
   # AI Services (At least one required)
   OPENAI_API_KEY=sk-your-openai-key
   GEMINI_API_KEY=your-gemini-key
   
   # Email Service (Optional - will use console mode if not set)
   SENDGRID_API_KEY=SG.your-sendgrid-key
   EMAIL_FROM=noreply@yourdomain.com
   
   # Voice Service (Optional)
   ELEVENLABS_API_KEY=your-elevenlabs-key
   
   # Video Service (Optional)
   AGORA_APP_ID=your-agora-app-id
   AGORA_APP_CERTIFICATE=your-agora-certificate
   
   # Security (Required)
   JWT_SECRET=your-super-secret-jwt-key
   
   # Environment
   NODE_ENV=production
   ```

3. **Redeploy** after adding environment variables

### Step 4: Set Up Database

1. **Create a PostgreSQL database** (recommended providers):
   - [Neon](https://neon.tech) - Serverless PostgreSQL
   - [Supabase](https://supabase.com) - PostgreSQL with additional features
   - [Railway](https://railway.app) - Easy PostgreSQL hosting

2. **Get your database connection string** and add it to Vercel environment variables

3. **Run database migrations** (if needed):
   ```bash
   # Locally, connect to your production database
   DATABASE_URL=your-production-db-url npm run db:push
   ```

### Step 5: Test Your Deployment

1. **Visit your Vercel URL** (e.g., `https://your-app.vercel.app`)

2. **Test the health endpoint**: `https://your-app.vercel.app/health`

3. **Test the application flow**:
   - Admin login
   - Resume upload
   - Interview invitation
   - Candidate signup/login
   - Interview completion

## 🔧 Advanced Configuration

### Custom Domain

1. **In Vercel dashboard**, go to Settings → Domains
2. **Add your custom domain**
3. **Update your DNS records** as instructed
4. **Update invitation URLs** in your application code

### Environment-Specific Configurations

Create different environment variables for different deployments:

- **Production**: Set in Vercel dashboard
- **Preview**: Set in Vercel dashboard (for pull requests)
- **Development**: Use `.env` file locally

### Performance Optimization

1. **Enable Vercel Analytics** for performance monitoring
2. **Configure caching** for static assets
3. **Use Vercel Edge Functions** for faster API responses

## 🐛 Troubleshooting

### Common Issues

1. **Build Fails**
   - Check build logs in Vercel dashboard
   - Ensure all dependencies are in `package.json`
   - Verify TypeScript compilation

2. **Database Connection Issues**
   - Verify `DATABASE_URL` is correct
   - Check if database allows external connections
   - Ensure database is running

3. **API Routes Not Working**
   - Check if routes are properly exported
   - Verify `vercel.json` configuration
   - Check function timeout settings

4. **Static Files Not Serving**
   - Verify build output directory
   - Check if `dist/public` contains built files
   - Ensure proper routing in `vercel.json`

### Debug Commands

```bash
# Check build locally
npm run build

# Test production build locally
NODE_ENV=production npm start

# Check database connection
npx drizzle-kit studio
```

## 📊 Monitoring

### Vercel Analytics
- **Function Logs**: View serverless function execution logs
- **Performance**: Monitor page load times and API response times
- **Errors**: Track application errors and exceptions

### Database Monitoring
- **Connection Pool**: Monitor database connection usage
- **Query Performance**: Track slow queries
- **Storage**: Monitor database size and growth

## 🔒 Security Considerations

1. **Environment Variables**: Never commit sensitive data to Git
2. **API Keys**: Rotate API keys regularly
3. **Database**: Use connection pooling and SSL
4. **CORS**: Configure CORS properly for production
5. **Rate Limiting**: Implement rate limiting for API endpoints

## 📈 Scaling

### Automatic Scaling
Vercel automatically scales your application based on traffic.

### Manual Scaling
- **Function Timeout**: Increase timeout for long-running operations
- **Memory**: Increase memory allocation for complex operations
- **Regions**: Deploy to multiple regions for global performance

## 🆘 Support

If you encounter issues:

1. **Check Vercel documentation**: [vercel.com/docs](https://vercel.com/docs)
2. **Review build logs** in Vercel dashboard
3. **Check application logs** for errors
4. **Test locally** with production environment variables

---

**Your AI Interview Master application is now ready for production deployment on Vercel!** 🎉 