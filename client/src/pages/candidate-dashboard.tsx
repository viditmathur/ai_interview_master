import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Code, Users, ThumbsUp, Download, Calendar } from 'lucide-react';
import { getCandidateResults } from '@/lib/api';

interface InterviewResults {
  interview: any;
  answers: any[];
  evaluation: any;
}

export default function CandidateDashboard() {
  const [candidateId, setCandidateId] = useState<number | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('interviewResults');
    if (stored) {
      const data = JSON.parse(stored);
      setCandidateId(data.candidateId);
    }
  }, []);

  const { data: results, isLoading } = useQuery({
    queryKey: ['/api/candidates', candidateId, 'results'],
    enabled: !!candidateId,
    queryFn: () => getCandidateResults(candidateId!),
  });

  if (!candidateId) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">No interview results found. Please complete an interview first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center space-x-2">
              <i className="fas fa-spinner fa-spin"></i>
              <span>Loading your results...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const latestResult: InterviewResults = results?.[0];
  if (!latestResult?.evaluation) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">No evaluation found. Please complete your interview.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { evaluation, answers } = latestResult;
  
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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Interview Results Dashboard</h2>
        <p className="text-lg text-gray-600">Comprehensive analysis of your interview performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overall Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(evaluation.overallScore)}`}>
                  {(evaluation.overallScore / 10).toFixed(1)}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                <Star className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Technical Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(evaluation.technicalScore)}`}>
                  {(evaluation.technicalScore / 10).toFixed(1)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Code className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Behavioral Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(evaluation.behavioralScore)}`}>
                  {(evaluation.behavioralScore / 10).toFixed(1)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recommendation</p>
                <Badge className={getRecommendationColor(evaluation.recommendation)}>
                  {evaluation.recommendation.toUpperCase()}
                </Badge>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <ThumbsUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Detailed Results */}
        <Card>
          <CardHeader>
            <CardTitle>Question-by-Question Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {answers.map((answer, index) => (
                <div key={answer.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">
                        Question {index + 1} - {index < 4 ? 'Technical' : 'Behavioral'}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">{answer.questionText}</p>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`${getScoreColor(answer.score * 10)} bg-opacity-10`}
                    >
                      {answer.score}/10
                    </Badge>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <p className="text-sm text-gray-700">{answer.feedback}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Strengths and Improvements */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Key Strengths</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {evaluation.strengths.split('.').filter(Boolean).map((strength: string, index: number) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-700">{strength.trim()}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Areas for Improvement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {evaluation.improvementAreas.split('.').filter(Boolean).map((area: string, index: number) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-700">{area.trim()}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <div className="bg-gradient-to-r from-primary to-blue-600 rounded-xl p-6 text-white">
            <h3 className="text-xl font-semibold mb-4">Next Steps</h3>
            <p className="text-blue-100 mb-4">
              {evaluation.recommendation === 'Hire' 
                ? "Congratulations! Based on your performance, we recommend proceeding to the technical round with our senior developers."
                : evaluation.recommendation === 'Maybe'
                ? "Good performance! We'd like to schedule a follow-up interview to discuss specific areas in more detail."
                : "Thank you for your time. We encourage you to continue developing your skills and apply again in the future."
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="secondary"
                className="bg-white text-primary hover:bg-gray-100"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Next Round
              </Button>
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white hover:bg-opacity-10"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
