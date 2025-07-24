import { Switch, Route, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Brain, Mic, BarChart3, Settings, Bell } from 'lucide-react';
import InterviewUpload from "@/pages/interview-upload";
import InterviewSession from "@/pages/interview-session";
import CandidateDashboard from "@/pages/candidate-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import NotFound from "@/pages/not-found";
import SignupPage from "@/pages/signup";
import LoginPage from "@/pages/login";
import React, { useEffect } from "react";
import AdminInterviewResults from "@/pages/admin-interview-results";
import Signup from './pages/signup';
import { Logo } from '@/components/Logo';

const queryClient = new QueryClient();

function LandingRedirect() {
  const [location, setLocation] = useLocation();
  React.useEffect(() => {
    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
    if (user) {
      setLocation('/interview-upload');
    }
    // else, stay on login page
  }, [setLocation]);
  return <LoginPage />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingRedirect} />
      <Route path="/interview" component={InterviewSession} />
      <Route path="/dashboard" component={CandidateDashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/interview-upload" component={InterviewUpload} />
      <Route path="/admin/interview/:id" component={AdminInterviewResults} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Navigation() {
  const [location, setLocation] = useLocation();
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
  const isLoginPage = location === "/" || location === "/login";
  const isSignupPage = location === "/signup";
  const interviewInProgress = user && user.role !== 'admin' && sessionStorage.getItem('currentInterview');

  if (isLoginPage || isSignupPage) {
    return (
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-16">
            <div className="flex items-center space-x-3">
              <Logo size={40} />
              <h1 className="font-extrabold text-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-purple-500 ml-2">FirstroundAI</h1>
            </div>
          </div>
        </div>
      </header>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('user');
    setLocation('/');
  };

  if (interviewInProgress) {
    return (
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Logo size={40} />
              <h1 className="font-extrabold text-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-purple-500 ml-2">FirstroundAI</h1>
            </div>
            <button onClick={handleLogout} className="ml-4 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Logout</button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <Logo size={40} />
            <h1 className="font-extrabold text-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-purple-500 ml-2">FirstroundAI</h1>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="/" className="text-primary pb-4 font-medium flex items-center">Home</a>
            <a href="/interview" className="text-gray-500 hover:text-gray-700 pb-4 font-medium flex items-center">Interview</a>
            <a href="/dashboard" className="text-gray-500 hover:text-gray-700 pb-4 font-medium flex items-center">Dashboard</a>
            {user && user.role === 'admin' && (
              <a href="/admin" className="text-gray-500 hover:text-gray-700 pb-4 font-medium flex items-center">Admin Console</a>
            )}
            <button onClick={handleLogout} className="ml-4 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Logout</button>
          </nav>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">AI Interview Platform</p>
              <p className="text-xs text-gray-500">Powered by Advanced AI Technology</p>
            </div>
          </div>
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
  const role = user?.role;
  const isAdmin = role === 'admin';
  const isCandidate = role === 'candidate';
  const nav = isAdmin
    ? [
        { label: 'Interviews', path: '/admin?tab=interviews' },
        { label: 'Candidates', path: '/admin?tab=candidates' },
        { label: 'Job Roles', path: '/admin?tab=jobroles' },
        { label: 'Questions', path: '/admin?tab=questions' },
        { label: 'Insights', path: '/admin?tab=insights' },
        { label: 'Settings', path: '/admin?tab=settings' },
        { label: 'Admin Tools', path: '/admin?tab=admin' },
      ]
    : [
        { label: 'Upload Resume', path: '/upload' },
        { label: 'Interview', path: '/interview' },
        { label: 'Results/History', path: '/dashboard' },
      ];
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-white dark:bg-gray-800 shadow-lg flex-shrink-0 flex flex-col">
        <div className="h-16 flex items-center px-6 space-x-2 font-bold text-xl border-b border-gray-200 dark:border-gray-700">
          <Logo size={32} />
          <span className="font-extrabold text-lg tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-purple-500">FirstroundAI</span>
        </div>
        <nav className="flex-1 py-4 space-y-2">
          {nav.map(item => (
            <button
              key={item.label}
              className={`w-full text-left px-6 py-2 rounded ${location === item.path ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              onClick={() => setLocation(item.path)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            className="w-full bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            onClick={() => { localStorage.removeItem('user'); window.location.href = '/'; }}
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  const [location] = useLocation();
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
  if (location === '/login') {
    return (
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>
    );
  }
  if (location === '/signup') {
    return (
      <QueryClientProvider client={queryClient}>
        <Signup />
      </QueryClientProvider>
    );
  }
  if (!user) {
    window.location.href = '/login';
    return null;
  }
  return (
    <QueryClientProvider client={queryClient}>
      <SidebarLayout>
        <Switch>
          {/* Candidate routes */}
          <Route path="/upload" component={InterviewUpload} />
          <Route path="/interview" component={InterviewSession} />
          <Route path="/dashboard" component={CandidateDashboard} />
          {/* Admin route */}
          <Route path="/admin" component={AdminDashboard} />
          {/* Fallback */}
          <Route component={NotFound} />
        </Switch>
      </SidebarLayout>
    </QueryClientProvider>
  );
}
