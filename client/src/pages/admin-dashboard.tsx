import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Eye, Trash, FolderOutput, Fan, Bot, Trash2 } from 'lucide-react';
import { getAdminInterviews, getAdminStats, deleteInterview, getInterviewResults } from '@/lib/api';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { deleteCandidate } from '@/lib/api';

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  React.useEffect(() => {
    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
    if (!user || user.role !== 'admin') {
      alert("You don't have admin rights.");
      setLocation('/dashboard');
    }
  }, [setLocation]);

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
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Admin Dashboard</h2>
        <p className="text-lg text-gray-600">Manage interviews, candidates, and system settings</p>
      </div>

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

        {/* Admin Controls */}
        <div className="space-y-6">
          {/* System Settings */}
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Questions per Interview</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm">
                  <option value="5" selected>5 Questions</option>
                  <option value="7">7 Questions</option>
                  <option value="10">10 Questions</option>
                </select>
              </div>
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
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Voice Recognition</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary peer-focus:ring-opacity-25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="ghost" className="w-full justify-start h-auto p-4">
                <FolderOutput className="h-5 w-5 text-primary mr-3" />
                <div className="text-left">
                  <p className="font-medium text-gray-900 text-sm">Export All Data</p>
                  <p className="text-xs text-gray-500">Download complete interview database</p>
                </div>
              </Button>
              
              <Button variant="ghost" className="w-full justify-start h-auto p-4">
                <Fan className="h-5 w-5 text-orange-600 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-gray-900 text-sm">System Cleanup</p>
                  <p className="text-xs text-gray-500">Remove old interview data</p>
                </div>
              </Button>
              
              <Button variant="ghost" className="w-full justify-start h-auto p-4">
                <Bot className="h-5 w-5 text-green-600 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-gray-900 text-sm">Test AI Models</p>
                  <p className="text-xs text-gray-500">Verify AI system performance</p>
                </div>
              </Button>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">Connected</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">AI Service</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">Active</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Speech API</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">Available</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Storage</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-yellow-600">75% Used</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
