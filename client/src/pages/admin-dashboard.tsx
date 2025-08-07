import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Eye, Trash, FolderOutput, Fan, Bot, Trash2, Moon, Sun, Search } from 'lucide-react';
import { getAdminInterviews, getAdminStats, deleteInterview, getInterviewResults } from '@/lib/api';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { deleteCandidate } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';

export default function AdminDashboard() {
  const [queryString, setQueryString] = useState(window.location.search);

  useEffect(() => {
    const onPopState = () => setQueryString(window.location.search);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const origPushState = window.history.pushState;
    const origReplaceState = window.history.replaceState;
    window.history.pushState = function (...args) {
      origPushState.apply(this, args);
      setQueryString(window.location.search);
    };
    window.history.replaceState = function (...args) {
      origReplaceState.apply(this, args);
      setQueryString(window.location.search);
    };
    return () => {
      window.history.pushState = origPushState;
      window.history.replaceState = origReplaceState;
    };
  }, []);

  const tab = new URLSearchParams(queryString).get('tab') || 'interviews';
  React.useEffect(() => {
    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
    if (!user || user.role !== 'admin') {
      alert("You don't have admin rights.");
      window.location.href = '/login';
    }
  }, []);

  const { data: interviews = [], isLoading: interviewsLoading } = useQuery({
    queryKey: ['/api/admin/interviews'],
    queryFn: getAdminInterviews,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: getAdminStats,
  });

  // AI Provider State
  const [aiProvider, setAIProvider] = useState<'openai' | 'gemini'>('openai');
  const [providerLoading, setProviderLoading] = useState(true);
  const [providerSaving, setProviderSaving] = useState(false);
  const [providerError, setProviderError] = useState('');

  useEffect(() => {
    setProviderLoading(true);
    fetch('/api/admin/ai-provider')
      .then(res => res.json())
      .then(data => {
        setAIProvider(data.provider);
        setProviderLoading(false);
      })
      .catch(() => {
        setProviderError('Failed to load AI provider');
        setProviderLoading(false);
      });
  }, []);

  const handleSystemAIModelChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provider = e.target.value as 'openai' | 'gemini';
    setAIProvider(provider);
    setProviderSaving(true);
    setProviderError('');
    try {
      const res = await fetch('/api/admin/ai-provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'admin',
        },
        body: JSON.stringify({ provider })
      });
      if (!res.ok) {
        setProviderError('Failed to save AI provider');
      }
    } catch {
      setProviderError('Failed to save AI provider');
    } finally {
      setProviderSaving(false);
    }
  };

  // Voice Provider State
  const [voiceProvider, setVoiceProvider] = useState<'elevenlabs' | 'pyttsx3'>('pyttsx3');
  const [voiceLoading, setVoiceLoading] = useState(true);
  const [voiceSaving, setVoiceSaving] = useState(false);
  const [voiceError, setVoiceError] = useState('');

  useEffect(() => {
    setVoiceLoading(true);
    fetch('/api/admin/voice-provider')
      .then(res => res.json())
      .then(data => {
        setVoiceProvider(data.provider);
        setVoiceLoading(false);
      })
      .catch(() => {
        setVoiceError('Failed to load voice provider');
        setVoiceLoading(false);
      });
  }, []);

  const handleVoiceProviderChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provider = e.target.value as 'elevenlabs' | 'pyttsx3';
    setVoiceProvider(provider);
    setVoiceSaving(true);
    setVoiceError('');
    try {
      const res = await fetch('/api/admin/voice-provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'admin',
        },
        body: JSON.stringify({ provider })
      });
      if (!res.ok) {
        setVoiceError('Failed to save voice provider');
      }
    } catch {
      setVoiceError('Failed to save voice provider');
    } finally {
      setVoiceSaving(false);
    }
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'Hire': return 'bg-green-100 text-green-800';
      case 'Maybe': return 'bg-yellow-100 text-yellow-800';
      case 'No': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const [viewedInterview, setViewedInterview] = useState<any>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingCandidateId, setDeletingCandidateId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this interview?')) return;
    setDeletingId(id);
    try {
      await deleteInterview(id);
      window.location.reload();
    } catch (err) {
      alert('Failed to delete interview');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteCandidate = async (candidateId: number) => {
    if (!window.confirm('Are you sure you want to delete this candidate and all their data?')) return;
    setDeletingCandidateId(candidateId);
    try {
      await deleteCandidate(candidateId);
      window.location.reload();
    } catch (err) {
      alert('Failed to delete candidate');
    } finally {
      setDeletingCandidateId(null);
    }
  };

  const handleView = (id: number) => {
    window.open(`/admin/interview/${id}`, '_blank');
  };

  // Users tab state
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users');
      return res.json();
    },
    enabled: tab === 'users',
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
  }, [darkMode]);

  if (statsLoading || interviewsLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center space-x-2">
              <i className="fas fa-spinner fa-spin"></i>
              <span>Loading admin dashboard...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
          <button className="md:hidden mr-4" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <span className="sr-only">Open sidebar</span>
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex-1 flex items-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search candidates, interviews, questions..." className="w-full pl-10 pr-4 py-2 rounded bg-gray-100 dark:bg-gray-800 text-sm focus:outline-none" />
            </div>
          </div>
          <button className="ml-6 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600" onClick={() => { localStorage.removeItem('user'); window.location.href = '/'; }}>Logout</button>
        </header>
        {/* Content Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          {tab === 'interviews' && (
            <>
              {/* Admin Stats */}
              <div className="grid md:grid-cols-5 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{stats?.total || 0}</p>
                      <p className="text-sm text-gray-600">Total Interviews</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{stats?.recommended || 0}</p>
                      <p className="text-sm text-gray-600">Recommended</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-600">{stats?.maybe || 0}</p>
                      <p className="text-sm text-gray-600">Maybe</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{stats?.rejected || 0}</p>
                      <p className="text-sm text-gray-600">Not Recommended</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{stats?.avgScore?.toFixed(1) || 0}</p>
                      <p className="text-sm text-gray-600">Avg Score</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Recent Interviews */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Recent Interviews</CardTitle>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Candidate</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {interviews.map((interview: any) => (
                            <TableRow key={interview.id}>
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
                                    <span className="text-primary text-sm font-medium">
                                      {getInitials(interview.candidate.name)}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900 text-sm">{interview.candidate.name}</p>
                                    <p className="text-xs text-gray-500">{interview.candidate.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {interview.candidate.jobRole}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {formatDate(interview.createdAt)}
                              </TableCell>
                              <TableCell>
                                {interview.evaluation ? (
                                  <Badge 
                                    variant="secondary" 
                                    className={`${getScoreColor(interview.evaluation.overallScore)} bg-opacity-10`}
                                  >
                                    {(interview.evaluation.overallScore / 10).toFixed(1)}
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">Pending</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {interview.evaluation ? (
                                  <Badge className={getRecommendationColor(interview.evaluation.recommendation)}>
                                    {interview.evaluation.recommendation}
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">In Progress</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Button variant="ghost" size="sm" onClick={() => handleView(interview.id)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleDelete(interview.id)} disabled={deletingId === interview.id}>
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleDeleteCandidate(interview.candidate.id)} disabled={deletingCandidateId === interview.candidate.id}>
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
                {/* Admin Controls (System Settings, Quick Actions, System Status) */}
                <div className="space-y-6">
                  {/* ...existing settings UI... */}
                  {/* System Settings, Quick Actions, System Status cards go here */}
                </div>
              </div>
            </>
          )}
          {tab === 'users' && (
            <div className="bg-white rounded shadow p-6">
              <h3 className="text-xl font-bold mb-4">All Users</h3>
              {usersLoading ? (
                <div>Loading users...</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Signup Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user: any) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
          {tab === 'candidates' && (
            <div className="bg-white rounded shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Candidates</h2>
              <CandidatesTable />
            </div>
          )}
          {tab === 'jobroles' && (
            <div className="bg-white rounded shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Job Roles</h2>
              <JobRolesTable />
            </div>
          )}
          {tab === 'questions' && (
            <div className="bg-white rounded shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Questions</h2>
              <QuestionsTable />
            </div>
          )}
          {tab === 'insights' && (
            <div className="bg-white rounded shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Evaluation Insights</h2>
              <InsightsPanel />
            </div>
          )}
          {tab === 'settings' && (
            <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded shadow p-6">
              <h2 className="text-2xl font-bold mb-4">System Settings</h2>
              <div className="space-y-6">
                {/* AI Model */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">AI Model</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    value={aiProvider}
                    onChange={handleSystemAIModelChange}
                    disabled={providerLoading || providerSaving}
                  >
                    <option value="openai">OpenAI</option>
                    <option value="gemini">Gemini</option>
                  </select>
                  {providerError && <span className="text-red-500 ml-2">{providerError}</span>}
                  <div className="text-xs text-gray-500 mt-2">
                    Select which AI provider to use for question generation. This setting is global.
                  </div>
                </div>
                {/* Voice Provider */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Voice Provider</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    value={voiceProvider}
                    onChange={handleVoiceProviderChange}
                    disabled={voiceLoading || voiceSaving}
                  >
                    <option value="pyttsx3">Python TTS</option>
                    <option value="elevenlabs">ElevenLabs (Human Voice)</option>
                  </select>
                  {voiceError && <span className="text-red-500 ml-2">{voiceError}</span>}
                  <div className="text-xs text-gray-500 mt-2">
                    Select which voice provider to use for reading out interview questions.
                  </div>
                </div>
                {/* ENV Viewer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Environment Variables (keys only)</label>
                  <div className="bg-gray-100 dark:bg-gray-900 rounded p-3 text-xs text-gray-700 dark:text-gray-300">
                    <div>OPENAI_API_KEY</div>
                    <div>GEMINI_API_KEY</div>
                    <div>ELEVENLABS_API_KEY</div>
                    <div>DATABASE_URL</div>
                    {/* Add more as needed */}
                  </div>
                </div>
                {/* Model/Token Usage Stats (placeholder) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Model/Token Usage</label>
                  <div className="bg-gray-100 dark:bg-gray-900 rounded p-3 text-xs text-gray-700 dark:text-gray-300">
                    <div>Coming soon: Model and token usage stats</div>
                  </div>
                </div>
                {/* Deployment Info (placeholder) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deployment Environment</label>
                  <div className="bg-gray-100 dark:bg-gray-900 rounded p-3 text-xs text-gray-700 dark:text-gray-300">
                    <div>Render</div>
                    <div>Localhost</div>
                    {/* Add more as needed */}
                  </div>
                </div>
              </div>
            </div>
          )}
          {tab === 'admin' && (
            <div className="bg-white rounded shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Admin Tools</h2>
              <AdminToolsPanel />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function CandidatesTable() {
  const { data: candidates = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/candidates'],
    queryFn: async () => {
      const res = await fetch('/api/admin/candidates');
      return res.json();
    },
  });
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [disqualifyingId, setDisqualifyingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this candidate and all their data?')) return;
    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/candidates/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      // Force a fresh refetch to update the UI
      await refetch();
      // Also invalidate any cached data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/candidates'] });
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(`Failed to delete candidate: ${error?.message || 'Unknown error'}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDisqualify = async (id: number) => {
    if (!window.confirm('Disqualify this candidate? This will prevent them from taking interviews.')) return;
    setDisqualifyingId(id);
    try {
      await fetch(`/api/admin/candidates/${id}/disqualify`, { method: 'POST' });
      refetch();
    } catch {
      alert('Failed to disqualify candidate');
    } finally {
      setDisqualifyingId(null);
    }
  };

  const handleSendInvite = async (candidate: any) => {
    try {
      // Call the backend API to send invitation
      const response = await fetch('/api/admin/send-interview-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateInfo: {
            name: candidate.name,
            email: candidate.email,
            phone: candidate.phone || '+1-555-123-4567'
          },
          jobRole: candidate.jobRole || 'Software Engineer',
          skillset: 'React, Node.js, TypeScript' // Default skillset, can be made configurable
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Failed to send invitation: ${errorData.message}`);
        return;
      }

      const result = await response.json();
      
      // Since you're using console mode, display the invitation URL
      const invitationUrl = `${window.location.origin}/signup?token=${result.token || result.invitationId || result.id || 'generated-token'}`;
      
      console.log('=== INVITATION SENT ===');
      console.log('Candidate:', candidate.name);
      console.log('Email:', candidate.email);
      console.log('Job Role:', candidate.jobRole);
      console.log('Invitation URL:', invitationUrl);
      console.log('Response:', result);
      console.log('========================');
      
      alert(`Invitation sent to ${candidate.email}!\n\nCheck the console for the invitation URL.\n\nURL: ${invitationUrl}`);
      
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('Failed to send invitation. Please try again.');
    }
  };

  if (isLoading) return <div>Loading candidates...</div>;
  if (!candidates.length) return <div>No candidates found.</div>;

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead>
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Role</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {candidates.map((c: any) => (
          <tr key={c.id}>
            <td className="px-6 py-4 whitespace-nowrap">{c.name}</td>
            <td className="px-6 py-4 whitespace-nowrap">{c.email}</td>
            <td className="px-6 py-4 whitespace-nowrap">{c.jobRole}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              {c.disqualified ? (
                <span className="text-red-600 font-semibold">Disqualified</span>
              ) : (
                <span className="text-green-600 font-semibold">Active</span>
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <Button size="sm" variant="ghost" onClick={() => window.open(`/admin/candidate/${c.id}`, '_blank')}>View</Button>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(c.id)} disabled={deletingId === c.id}>Delete</Button>
              {!c.disqualified && (
                <Button size="sm" variant="ghost" onClick={() => handleDisqualify(c.id)} disabled={disqualifyingId === c.id}>Disqualify</Button>
              )}
              <Button size="sm" variant="outline" onClick={() => handleSendInvite(c)}>Send Invite</Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function JobRolesTable() {
  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ['/api/admin/candidates'],
    queryFn: async () => {
      const res = await fetch('/api/admin/candidates');
      return res.json();
    },
  });
  const [showAdd, setShowAdd] = useState(false);
  const [newRole, setNewRole] = useState('');

  // Aggregate unique roles and counts
  const roleCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of candidates) {
      if (!c.jobRole) continue;
      counts[c.jobRole] = (counts[c.jobRole] || 0) + 1;
    }
    return Object.entries(counts).map(([role, count]) => ({ role, count }));
  }, [candidates]);

  const handleAddRole = () => {
    if (!newRole.trim()) return;
    // Placeholder: In a real app, this would call a backend endpoint to add a job role
    alert(`Added job role: ${newRole}`);
    setShowAdd(false);
    setNewRole('');
  };

  if (isLoading) return <div>Loading job roles...</div>;

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowAdd(true)}>Add Job Role</Button>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"># Candidates</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {roleCounts.map(({ role, count }) => (
            <tr key={role}>
              <td className="px-6 py-4 whitespace-nowrap">{role}</td>
              <td className="px-6 py-4 whitespace-nowrap">{count}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Button size="sm" variant="ghost" onClick={() => alert(`Edit role: ${role}`)}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => alert(`Delete role: ${role}`)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showAdd && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white rounded shadow p-6 w-96">
            <h3 className="text-lg font-bold mb-4">Add Job Role</h3>
            <input
              className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
              placeholder="Job role name"
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={handleAddRole}>Add</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function QuestionsTable() {
  const [roleFilter, setRoleFilter] = useState('');
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['/api/admin/questions', roleFilter],
    queryFn: async () => {
      const url = roleFilter ? `/api/admin/questions?role=${encodeURIComponent(roleFilter)}` : '/api/admin/questions';
      const res = await fetch(url);
      return res.json();
    },
  });
  const [showAdd, setShowAdd] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newRole, setNewRole] = useState('');

  const handleAddQuestion = () => {
    if (!newQuestion.trim() || !newRole.trim()) return;
    // Placeholder: In a real app, this would call a backend endpoint to add a question
    alert(`Added question: ${newQuestion} (Role: ${newRole})`);
    setShowAdd(false);
    setNewQuestion('');
    setNewRole('');
  };

  // Get unique roles for filter dropdown
  const uniqueRoles = React.useMemo(() => {
    const set = new Set(questions.map((q: any) => q.role));
    return Array.from(set);
  }, [questions]);

  if (isLoading) return <div>Loading questions...</div>;

  return (
    <>
      <div className="flex justify-between mb-4">
        <div>
          <label className="mr-2 text-sm">Filter by Role:</label>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="border rounded px-2 py-1 text-sm">
            <option value="">All</option>
            {uniqueRoles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
        <Button onClick={() => setShowAdd(true)}>Add Question</Button>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {questions.map((q: any) => (
            <tr key={q.id}>
              <td className="px-6 py-4 whitespace-pre-line max-w-xl">{q.questionText}</td>
              <td className="px-6 py-4 whitespace-nowrap">{q.role}</td>
              <td className="px-6 py-4 whitespace-nowrap">{q.source}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{q.createdAt ? new Date(q.createdAt).toLocaleDateString() : ''}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Button size="sm" variant="ghost" onClick={() => alert(`Edit question: ${q.id}`)}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => alert(`Delete question: ${q.id}`)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showAdd && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white rounded shadow p-6 w-96">
            <h3 className="text-lg font-bold mb-4">Add Question</h3>
            <input
              className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
              placeholder="Question text"
              value={newQuestion}
              onChange={e => setNewQuestion(e.target.value)}
            />
            <input
              className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
              placeholder="Role"
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={handleAddQuestion}>Add</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function InsightsPanel() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/stats');
      return res.json();
    },
  });
  const { data: interviews = [], isLoading: interviewsLoading } = useQuery({
    queryKey: ['/api/admin/interviews'],
    queryFn: async () => {
      const res = await fetch('/api/admin/interviews');
      return res.json();
    },
  });

  if (statsLoading || interviewsLoading) return <div>Loading insights...</div>;

  // Prepare data for chart
  const recCounts: Record<string, number> = { Hire: 0, Maybe: 0, No: 0 };
  for (const i of interviews) {
    if (i.evaluation && (i.evaluation.recommendation === 'Hire' || i.evaluation.recommendation === 'Maybe' || i.evaluation.recommendation === 'No')) {
      recCounts[i.evaluation.recommendation as 'Hire' | 'Maybe' | 'No'] = (recCounts[i.evaluation.recommendation as 'Hire' | 'Maybe' | 'No'] || 0) + 1;
    }
  }

  return (
    <>
      <div className="grid md:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{stats?.total || 0}</p>
              <p className="text-sm text-gray-600">Total Interviews</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats?.recommended || 0}</p>
              <p className="text-sm text-gray-600">Recommended</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats?.maybe || 0}</p>
              <p className="text-sm text-gray-600">Maybe</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats?.rejected || 0}</p>
              <p className="text-sm text-gray-600">Not Recommended</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats?.avgScore?.toFixed(1) || 0}</p>
              <p className="text-sm text-gray-600">Avg Score</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-2">Hiring Recommendations</h3>
        <div className="flex space-x-8 items-end h-32">
          {Object.entries(recCounts).map(([rec, count]) => (
            <div key={rec} className="flex flex-col items-center flex-1">
              <div className={`w-10 rounded-t bg-primary ${count > 0 ? '' : 'bg-gray-200'} transition-all`} style={{ height: `${count * 20 + 10}px` }}></div>
              <span className="mt-2 text-sm font-medium">{rec}</span>
              <span className="text-xs text-gray-500">{count}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-bold mb-2">Recent Interviews</h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recommendation</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {interviews.slice(0, 10).map((i: any) => (
              <tr key={i.id}>
                <td className="px-6 py-4 whitespace-nowrap">{i.candidate?.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{i.candidate?.jobRole}</td>
                <td className="px-6 py-4 whitespace-nowrap">{i.evaluation ? (i.evaluation.overallScore / 10).toFixed(1) : '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{i.evaluation ? i.evaluation.recommendation : '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{i.createdAt ? new Date(i.createdAt).toLocaleDateString() : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function AdminToolsPanel() {
  const [section, setSection] = useState('audit');
  const sections = [
    { key: 'audit', label: 'Audit Logs' },
    { key: 'prompt', label: 'Prompt Playground' },
    { key: 'roles', label: 'Admin Role Manager' },
    { key: 'env', label: 'Env & Config' },
    { key: 'db', label: 'Database Tools' },
    { key: 'health', label: 'System Health' },
    { key: 'features', label: 'Feature Toggles' },
    { key: 'experimental', label: 'Experimental' },
  ];
  return (
    <div>
      <div className="flex space-x-2 mb-6">
        {sections.map(s => (
          <Button key={s.key} variant={section === s.key ? 'default' : 'secondary'} onClick={() => setSection(s.key)}>{s.label}</Button>
        ))}
      </div>
      <div className="space-y-8">
        {section === 'audit' && <AuditLogsSection />}
        {section === 'prompt' && <PromptPlaygroundSection />}
        {section === 'roles' && <AdminRoleManagerSection />}
        {section === 'env' && <EnvConfigSection />}
        {section === 'db' && <DatabaseToolsSection />}
        {section === 'health' && <SystemHealthSection />}
        {section === 'features' && <FeatureTogglesSection />}
        {section === 'experimental' && <ExperimentalSection />}
      </div>
    </div>
  );
}

function AuditLogsSection() {
  const [action, setAction] = useState('');
  const [performedBy, setPerformedBy] = useState('');
  const [date, setDate] = useState('');
  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/audit-logs', action, performedBy, date],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (action) params.append('action', action);
      if (performedBy) params.append('performedBy', performedBy);
      if (date) params.append('date', date);
      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      return res.json();
    },
  });
  const logsArray = Array.isArray(logs) ? logs : [];
  return (
    <div>
      <h3 className="text-lg font-bold mb-2">Audit Logs</h3>
      <div className="mb-4 flex space-x-2">
        <input className="border rounded px-2 py-1 text-sm" placeholder="Filter by action" value={action} onChange={e => setAction(e.target.value)} />
        <input className="border rounded px-2 py-1 text-sm" placeholder="Filter by admin" value={performedBy} onChange={e => setPerformedBy(e.target.value)} />
        <input className="border rounded px-2 py-1 text-sm" placeholder="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <Button size="sm" onClick={() => refetch()}>Filter</Button>
      </div>
      {isLoading ? <div>Loading logs...</div> : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performed By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logsArray.map((log: any, i: number) => (
              <tr key={i}>
                <td className="px-6 py-4 whitespace-nowrap">{log.action}</td>
                <td className="px-6 py-4 whitespace-nowrap">{log.target}</td>
                <td className="px-6 py-4 whitespace-nowrap">{log.performedBy}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function PromptPlaygroundSection() {
  const [resume, setResume] = useState('');
  const [role, setRole] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setQuestions([]);
    setFeedback('');
    try {
      // Use existing API for question generation
      const res = await fetch('/api/interviews/start', {
        method: 'POST',
        body: (() => { const f = new FormData(); f.append('name', 'Test'); f.append('email', 'test@playground.com'); f.append('phone', '123'); f.append('jobRole', role); f.append('resume', new Blob([resume], { type: 'text/plain' }), 'resume.txt'); return f; })()
      });
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch {
      setQuestions(['Error generating questions.']);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    setLoading(true);
    setFeedback('');
    try {
      // Use existing API for answer evaluation (simulate)
      const res = await fetch('/api/interviews/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId: 1, questionIndex: 0, answerText: answer })
      });
      const data = await res.json();
      setFeedback(data.feedback || 'No feedback');
    } catch {
      setFeedback('Error evaluating answer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-bold mb-2">Prompt Playground</h3>
      <div className="mb-4">
        <textarea className="w-full border rounded px-3 py-2 mb-2" rows={3} placeholder="Paste resume text here..." value={resume} onChange={e => setResume(e.target.value)} />
        <input className="w-full border rounded px-3 py-2 mb-2" placeholder="Job Role" value={role} onChange={e => setRole(e.target.value)} />
        <Button onClick={handleGenerate} disabled={loading || !resume || !role}>Generate Questions</Button>
      </div>
      {questions.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold mb-2">AI-Generated Questions:</h4>
          <ul className="list-disc ml-6">
            {questions.map((q, i) => <li key={i}>{q}</li>)}
          </ul>
        </div>
      )}
      {questions.length > 0 && (
        <div className="mb-4">
          <textarea className="w-full border rounded px-3 py-2 mb-2" rows={2} placeholder="Type a sample answer to Q1..." value={answer} onChange={e => setAnswer(e.target.value)} />
          <Button onClick={handleEvaluate} disabled={loading || !answer}>Evaluate Answer</Button>
        </div>
      )}
      {feedback && <div className="mt-2 text-green-700">Feedback: {feedback}</div>}
      <div className="text-xs text-gray-500 mt-2">(Uses real backend APIs for question generation and evaluation.)</div>
    </div>
  );
}

function AdminRoleManagerSection() {
  const { data: admins = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/admins'],
    queryFn: async () => {
      const res = await fetch('/api/admin/admins');
      return res.json();
    },
  });
  const [showAdd, setShowAdd] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('SuperAdmin');
  const [editing, setEditing] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('Evaluator');

  const handleAdd = async () => {
    await fetch('/api/admin/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, password: newPassword, adminRole: newRole })
    });
    setShowAdd(false);
    setNewEmail('');
    setNewPassword('');
    setNewRole('SuperAdmin');
    refetch();
  };
  const handleEdit = async (email: string) => {
    await fetch(`/api/admin/admins/${email}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminRole: editRole })
    });
    setEditing(null);
    refetch();
  };
  const handleRemove = async (email: string) => {
    if (!window.confirm('Remove this admin?')) return;
    await fetch(`/api/admin/admins/${email}`, { method: 'DELETE' });
    refetch();
  };
  return (
    <div>
      <h3 className="text-lg font-bold mb-2">Admin Role Manager</h3>
      <table className="min-w-full divide-y divide-gray-200 mb-4">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {admins.map((a: any) => (
            <tr key={a.email}>
              <td className="px-6 py-4 whitespace-nowrap">{a.email}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {editing === a.email ? (
                  <select value={editRole} onChange={e => setEditRole(e.target.value)} className="border rounded px-2 py-1">
                    <option value="SuperAdmin">SuperAdmin</option>
                    <option value="Evaluator">Evaluator</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                ) : (
                  a.adminRole || 'N/A'
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {editing === a.email ? (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(a.email)}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(a.email); setEditRole(a.adminRole || 'Evaluator'); }}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => handleRemove(a.email)}>Remove</Button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button onClick={() => setShowAdd(true)}>Add Admin</Button>
      {showAdd && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white rounded shadow p-6 w-96">
            <h3 className="text-lg font-bold mb-4">Add Admin</h3>
            <input className="w-full border border-gray-300 rounded px-3 py-2 mb-2" placeholder="Email" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
            <input className="w-full border border-gray-300 rounded px-3 py-2 mb-2" placeholder="Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            <select className="w-full border border-gray-300 rounded px-3 py-2 mb-4" value={newRole} onChange={e => setNewRole(e.target.value)}>
              <option value="SuperAdmin">SuperAdmin</option>
              <option value="Evaluator">Evaluator</option>
              <option value="Viewer">Viewer</option>
            </select>
            <div className="flex justify-end space-x-2">
              <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={handleAdd}>Add</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EnvConfigSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/admin/env-config'],
    queryFn: async () => {
      const res = await fetch('/api/admin/env-config');
      return res.json();
    },
  });
  if (isLoading) return <div>Loading environment/config...</div>;
  return (
    <div>
      <h3 className="text-lg font-bold mb-2">Environment & Config Viewer</h3>
      <div className="mb-2">Active Environment Variables (keys only):</div>
      <ul className="list-disc ml-6 mb-4">
        {data.envKeys.map((k: string, i: number) => <li key={i}>{k}</li>)}
      </ul>
      <a href="/api/admin/env-example" download className="inline-block mb-4"><Button>Download .env.example</Button></a>
      <div className="mt-4 mb-2">Active Features:</div>
      <ul className="list-disc ml-6 mb-4">
        {data.features.map((f: string, i: number) => <li key={i}>{f}</li>)}
      </ul>
    </div>
  );
}

function DatabaseToolsSection() {
  const handleExport = () => {
    window.open('/api/admin/export-interviews', '_blank');
  };
  const handleBackup = () => {
    window.open('/api/admin/backup-candidates', '_blank');
  };
  const handleClear = async () => {
    if (!window.confirm('Are you sure you want to clear test data?')) return;
    await fetch('/api/admin/clear-test-data', { method: 'POST' });
    alert('Test data cleared!');
  };
  return (
    <div>
      <h3 className="text-lg font-bold mb-2">Database Tools</h3>
      <div className="flex space-x-2 mb-4">
        <Button onClick={handleExport}>Download Interview Data (.json)</Button>
        <Button onClick={handleClear}>Clear Test Data</Button>
        <Button onClick={handleBackup}>Backup Candidates</Button>
      </div>
    </div>
  );
}

function SystemHealthSection() {
  const { data: health = [], isLoading } = useQuery({
    queryKey: ['/api/admin/health'],
    queryFn: async () => {
      const res = await fetch('/api/admin/health');
      return res.json();
    },
  });
  if (isLoading) return <div>Loading system health...</div>;
  return (
    <div>
      <h3 className="text-lg font-bold mb-2">System Health Monitor</h3>
      <table className="min-w-full divide-y divide-gray-200 mb-4">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uptime</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Error</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {health.map((h: any, i: number) => (
            <tr key={i}>
              <td className="px-6 py-4 whitespace-nowrap">{h.name}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={h.status === 'OK' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{h.status}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">{h.uptime}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{h.lastError || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FeatureTogglesSection() {
  const { data: toggles = {}, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/feature-toggles'],
    queryFn: async () => {
      const res = await fetch('/api/admin/feature-toggles');
      return res.json();
    },
  });
  const handleToggle = async (key: string, value: boolean) => {
    await fetch('/api/admin/feature-toggles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: value ? 'false' : 'true' })
    });
    refetch();
  };
  if (isLoading) return <div>Loading feature toggles...</div>;
  const labels: any = {
    ai_feedback: 'AI Feedback',
    whisper_mic: 'Whisper Mic Mode',
    summary_generation: 'Summary Generation',
    login_required: 'Login Requirement',
  };
  return (
    <div>
      <h3 className="text-lg font-bold mb-2">Feature Toggles</h3>
      <table className="min-w-full divide-y divide-gray-200 mb-4">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feature</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enabled</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Object.entries(toggles).map(([key, enabled]: any) => (
            <tr key={key}>
              <td className="px-6 py-4 whitespace-nowrap">{labels[key] || key}</td>
              <td className="px-6 py-4 whitespace-nowrap">{enabled ? 'Yes' : 'No'}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Button size="sm" variant="ghost" onClick={() => handleToggle(key, enabled)}>{enabled ? 'Disable' : 'Enable'}</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExperimentalSection() {
  const [files, setFiles] = useState<File[]>([]);
  const [jobRole, setJobRole] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files));
  };
  const handleFindBest = async () => {
    if (!files.length || !jobRole) return;
    setLoading(true);
    setResults([]);
    const formData = new FormData();
    files.forEach(f => formData.append('resumes', f));
    formData.append('jobRole', jobRole);
    const res = await fetch('/api/admin/bulk-resume-upload', { method: 'POST', body: formData });
    const data = await res.json();
    setResults(data);
    setLoading(false);
  };
  return (
    <div>
      <h3 className="text-lg font-bold mb-2">Bulk Resume Upload</h3>
      <input type="file" multiple accept=".pdf,.doc,.docx,.txt" onChange={handleFiles} className="mb-2" />
      <input className="border rounded px-2 py-1 mb-2 ml-2" placeholder="Job Role" value={jobRole} onChange={e => setJobRole(e.target.value)} />
      <Button onClick={handleFindBest} disabled={!files.length || !jobRole || loading}>{loading ? 'Evaluating...' : 'Find Best Resume'}</Button>
      {results.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Ranked Resumes:</h4>
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Best</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((r, i) => (
                <tr key={i} className={r.best ? 'bg-green-100' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">{r.filename}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{r.score}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{r.best ? '✅' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="text-xs text-gray-500 mt-2">(AI-powered resume ranking by job role. Best match highlighted.)</div>
    </div>
  );
}
