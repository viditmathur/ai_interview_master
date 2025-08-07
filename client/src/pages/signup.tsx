import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Logo } from '@/components/Logo';

function validateEmail(email: string) {
  // Improved email regex
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password: string) {
  // At least 8 chars, one uppercase, one lowercase, one number, one special char
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(password);
}

export default function Signup() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [invitationToken, setInvitationToken] = useState('');
  const [invitationData, setInvitationData] = useState<any>(null);
  const [invitationError, setInvitationError] = useState<string | null>(null);

  // Check for invitation token in URL
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    setInvitationToken(token || '');
    if (token) {
      fetch(`/api/invitations/${token}`)
        .then(async (res) => {
          if (!res.ok) {
            throw new Error('Invitation not found');
          }
          return res.json();
        })
        .then((data) => {
          setInvitationData(data);
          setEmail(data.email || '');
          setInvitationError(null);
        })
        .catch(() => {
          setInvitationError('Invitation link is invalid or expired. Please contact your administrator.');
        });
    }
  }, []);

  const fetchInvitationData = async (token: string) => {
    try {
      const response = await fetch(`/api/invitations/${token}`);
      if (response.ok) {
        const data = await response.json();
        setInvitationData(data);
        // Pre-fill email if available
        if (data.email) {
          setEmail(data.email);
        }
      }
    } catch (error) {
      console.error('Failed to fetch invitation data:', error);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // Client-side validation
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!number.trim()) {
      setError('Number is required');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
      return;
    }
    setLoading(true);
    try {
      const signupData: any = { name, number, email, password };
      if (invitationToken) {
        signupData.invitationToken = invitationToken;
      }
      
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Signup failed');
      } else {
        if (invitationToken) {
          setLocation('/interview');
        } else {
          setLocation('/login');
        }
      }
    } catch (err) {
      setError('Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <form onSubmit={handleSignup} className="bg-white dark:bg-gray-800 p-8 rounded shadow w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <Logo size={48} />
          <span className="font-extrabold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-purple-500 mt-2">FirstroundAI</span>
        </div>
        <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>
        {invitationError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
            {invitationError}
          </div>
        )}
        {invitationData && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Interview Invitation</h3>
            <p className="text-sm text-blue-700 mb-1">
              <strong>Job Role:</strong> {invitationData.jobRole}
            </p>
            <p className="text-sm text-blue-700 mb-1">
              <strong>Required Skills:</strong> {invitationData.skillset}
            </p>
            <p className="text-sm text-blue-700">
              Please complete your registration to start the interview.
            </p>
          </div>
        )}
        {error && (
          <div className="mb-4 text-red-600 text-center">
            {error}
            {(error.includes('already have an account') || error.includes('You already have an account')) && (
              <div className="mt-2">
                <a href="/login" className="text-blue-600 underline">Go to Login</a>
              </div>
            )}
          </div>
        )}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium">Name</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium">Number</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={number}
            onChange={e => setNumber(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium">Email</label>
          <input
            type="email"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label className="block mb-1 text-sm font-medium">Password</label>
          <input
            type="password"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-primary text-white py-2 rounded font-semibold hover:bg-primary-dark"
          disabled={loading}
        >
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
        <div className="mt-4 text-sm text-center">
          Already have an account? <a href="/login" className="text-blue-600 underline">Login</a>
        </div>
      </form>
    </div>
  );
} 