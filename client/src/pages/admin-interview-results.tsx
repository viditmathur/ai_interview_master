import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { getInterviewResults } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ThumbsUp, ThumbsDown, Star, TrendingUp, TrendingDown, Clock, User, Briefcase, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function AdminInterviewResults() {
  const [location, setLocation] = useLocation();
  const id = Number(location.split('/').pop());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is admin
    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
    if (!user || user.role !== 'admin') {
      setError('Access denied. Admin privileges required.');
      setLoading(false);
      return;
    }

    getInterviewResults(id)
      .then(setData)
      .catch(() => setError('Failed to fetch interview results'))
      .finally(() => setLoading(false));
  }, [id]);

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation?.toLowerCase()) {
      case 'hire':
      case 'recommended':
        return <ThumbsUp className="h-5 w-5 text-green-600" />;
      case 'no':
      case 'reject':
      case 'not recommended':
        return <ThumbsDown className="h-5 w-5 text-red-600" />;
      case 'maybe':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation?.toLowerCase()) {
      case 'hire':
      case 'recommended':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'no':
      case 'reject':
      case 'not recommended':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'maybe':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Loading interview results...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 text-lg">{error}</p>
      </div>
    </div>
  );

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.history.back()}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Interview Results</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Candidate Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-primary" />
              <span>Candidate Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-semibold">
                    {data.candidate?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{data.candidate?.name}</p>
                  <p className="text-sm text-gray-600">{data.candidate?.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Briefcase className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Position</p>
                  <p className="font-medium text-gray-900">{data.candidate?.jobRole}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Interview Date</p>
                  <p className="font-medium text-gray-900">
                    {data.interview?.createdAt ? new Date(data.interview.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge variant="secondary" className="capitalize">
                    {data.interview?.status || 'Unknown'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overall Evaluation Card */}
        {data.evaluation && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span>Overall Evaluation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {/* Overall Score */}
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {data.evaluation.overallScore}/100
                  </div>
                  <p className="text-sm text-blue-700 font-medium">Overall Score</p>
                </div>

                {/* Technical Score */}
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {data.evaluation.technicalScore}/100
                  </div>
                  <p className="text-sm text-green-700 font-medium">Technical Score</p>
                </div>

                {/* Behavioral Score */}
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {data.evaluation.behavioralScore}/100
                  </div>
                  <p className="text-sm text-purple-700 font-medium">Behavioral Score</p>
                </div>

                {/* Recommendation */}
                <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    {getRecommendationIcon(data.evaluation.recommendation)}
                    <span className="text-xl font-bold text-orange-600">
                      {data.evaluation.recommendation}
                    </span>
                  </div>
                  <p className="text-sm text-orange-700 font-medium">Recommendation</p>
                </div>
              </div>

              {/* Strengths and Weaknesses */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Strengths */}
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-green-800">
                      <TrendingUp className="h-5 w-5" />
                      <span>Key Strengths</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {data.evaluation.strengths?.split('.').filter(Boolean).map((strength: string, index: number) => (
                        <div key={index} className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-green-700">{strength.trim()}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Areas for Improvement */}
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-red-800">
                      <TrendingDown className="h-5 w-5" />
                      <span>Areas for Improvement</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {data.evaluation.improvementAreas?.split('.').filter(Boolean).map((area: string, index: number) => (
                        <div key={index} className="flex items-start space-x-2">
                          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-red-700">{area.trim()}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Questions & Answers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-primary" />
              <span>Questions & Answers</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {data.answers?.map((answer: any, index: number) => (
                <Card key={index} className="border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold text-sm">{index + 1}</span>
                        </div>
                        <h3 className="font-semibold text-gray-900">Question {index + 1}</h3>
                      </div>
                      <Badge className={getScoreBadgeColor(answer.score * 10)}>
                        {answer.score}/10
                      </Badge>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Question:</p>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{answer.questionText}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Answer:</p>
                        <p className="text-gray-900 bg-blue-50 p-3 rounded-lg border border-blue-200">{answer.answerText}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Feedback:</p>
                        <p className="text-gray-900 bg-yellow-50 p-3 rounded-lg border border-yellow-200">{answer.feedback}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 