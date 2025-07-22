import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
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
import React from "react";
import AdminInterviewResults from "@/pages/admin-interview-results";

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

  if (isLoginPage) {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white text-2xl font-bold">AI</span>
              </div>
              <h1 className="font-bold text-xl text-gray-900">FirstRoundAI</h1>
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

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white text-2xl font-bold">AI</span>
            </div>
            <h1 className="font-bold text-xl text-gray-900">FirstRoundAI</h1>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="/" className="text-primary border-b-2 border-primary pb-4 font-medium flex items-center">Home</a>
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
    <footer className="bg-white border-t border-gray-200 mt-16">
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

function App() {
  const [location] = useLocation();
  const isLoginPage = location === "/" || location === "/login";
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {!isLoginPage && <Navigation />}
        <main>
          <Router />
        </main>
        {!isLoginPage && <Footer />}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
