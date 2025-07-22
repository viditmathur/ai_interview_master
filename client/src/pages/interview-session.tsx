import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { joinAgoraChannel, leaveAgoraChannel } from '@/lib/agora';
import { submitAnswer } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface InterviewData {
  interviewId: number;
  candidateId: number;
  questions: string[];
  currentQuestionIndex: number;
  candidateName?: string;
  candidateRole?: string;
  candidatePhone?: string;
}

export default function InterviewSession() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [interviewData, setInterviewData] = useState<InterviewData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [latestFeedback, setLatestFeedback] = useState<string>('');
  const [answeredQuestions, setAnsweredQuestions] = useState<number[]>([]);
  const [joined, setJoined] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('currentInterview');
    if (stored) {
      const data = JSON.parse(stored);
      setInterviewData(data);
    }
  }, []);

  const startAgora = async () => {
    if (!interviewData) return;
    const channel = `interview_${interviewData.interviewId}`;
    await joinAgoraChannel(channel);
    setJoined(true);
    // Attach local video to DOM
    setTimeout(() => {
      const videoTrack = (window as any).AgoraRTC?.localTracks?.find((t: any) => t.trackMediaType === 'video');
      if (videoTrack && videoRef.current) {
        videoTrack.play(videoRef.current);
      }
    }, 500);
    // Start transcription
    startTranscription();
  };

  const leaveAgora = async () => {
    await leaveAgoraChannel();
    setJoined(false);
    stopTranscription();
  };

  const startTranscription = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        finalTranscript += event.results[i][0].transcript;
      }
      setTranscript(finalTranscript);
    };
    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopTranscription = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  const handleAnswerSubmit = async () => {
    if (!interviewData) return;
    setIsSubmitting(true);
    try {
      const response = await submitAnswer({
        interviewId: interviewData.interviewId,
        questionIndex: interviewData.currentQuestionIndex,
        answerText: transcript
      });
      setCurrentScore(response.score);
      setLatestFeedback(response.feedback);
      setAnsweredQuestions(prev => [...prev, interviewData.currentQuestionIndex]);
      toast({
        title: "Answer Submitted",
        description: `Score: ${response.score}/10 - ${response.feedback}`
      });
      setTranscript('');
      if (response.completed) {
        sessionStorage.setItem('interviewResults', JSON.stringify({
          candidateId: interviewData.candidateId,
          interviewId: interviewData.interviewId,
          summary: response.summary
        }));
        toast({
          title: "Interview Complete!",
          description: "Redirecting to your results dashboard..."
        });
        setTimeout(() => {
          setLocation('/dashboard');
        }, 2000);
      } else {
        const updatedData = {
          ...interviewData,
          currentQuestionIndex: response.questionIndex!
        };
        setInterviewData(updatedData);
        sessionStorage.setItem('currentInterview', JSON.stringify(updatedData));
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit answer",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!interviewData) {
    return <div>Loading...</div>;
  }

  const currentQuestion = interviewData.questions[interviewData.currentQuestionIndex];
  const progress = ((interviewData.currentQuestionIndex + 1) / interviewData.questions.length) * 100;
  const questionTypes = ['Technical', 'Technical', 'Technical', 'Technical', 'Behavioral'];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold text-gray-900">AI Interview in Progress</h2>
          <span className="text-sm text-gray-600">
            Question {interviewData.currentQuestionIndex + 1} of {interviewData.questions.length}
          </span>
        </div>
        <Progress value={progress} className="w-full h-2" />
      </div>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {!joined ? (
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={startAgora}>
              Join Video Interview
            </button>
          ) : (
            <>
              <div ref={videoRef} className="w-full h-64 bg-black rounded mb-4"></div>
              <button className="bg-red-500 text-white px-4 py-2 rounded mb-4" onClick={leaveAgora}>
                Leave Call
              </button>
              <div className="mb-4">
                <b>Current Question:</b> {currentQuestion}
              </div>
              <div className="mb-4">
                <b>Transcribed Answer:</b>
                <textarea
                  className="w-full border rounded p-2 mt-2"
                  rows={3}
                  value={transcript}
                  onChange={e => setTranscript(e.target.value)}
                  placeholder="Your answer will appear here..."
                />
              </div>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded"
                onClick={handleAnswerSubmit}
                disabled={isSubmitting || !transcript.trim()}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Answer'}
              </button>
            </>
          )}
        </div>
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h4 className="font-medium text-gray-900 mb-4">Candidate Information</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <i className="fas fa-user text-gray-400 w-4"></i>
                  <span className="text-sm text-gray-600">{interviewData.candidateName || 'Candidate'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <i className="fas fa-briefcase text-gray-400 w-4"></i>
                  <span className="text-sm text-gray-600">{interviewData.candidateRole || 'Developer'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <i className="fas fa-phone text-gray-400 w-4"></i>
                  <span className="text-sm text-gray-600">{interviewData.candidatePhone || 'Phone'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h4 className="font-medium text-gray-900 mb-4">Questions Progress</h4>
              <div className="space-y-3">
                {interviewData.questions.map((_, index) => {
                  const isCurrent = index === interviewData.currentQuestionIndex;
                  const isAnswered = answeredQuestions.includes(index);
                  const isPending = index > interviewData.currentQuestionIndex;
                  return (
                    <div
                      key={index}
                      className={`flex items-center space-x-3 p-3 rounded-lg ${
                        isCurrent ? 'bg-primary bg-opacity-10 border border-primary border-opacity-20' : ''
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCurrent ? 'bg-primary' : isAnswered ? 'bg-green-600' : 'bg-gray-200'
                      }`}>
                        <span className={`text-xs font-medium ${
                          isCurrent || isAnswered ? 'text-white' : 'text-gray-600'
                        }`}>
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          isCurrent ? 'text-gray-900' : 'text-gray-600'
                        }`}>
                          {questionTypes[index] || 'Question'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {isCurrent ? 'Current Question' : isAnswered ? 'Answered' : 'Pending'}
                        </p>
                      </div>
                      <div className="flex items-center">
                        {isAnswered && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Done
                          </Badge>
                        )}
                        {isCurrent && (
                          <Badge variant="default" className="bg-orange-100 text-orange-800">
                            Active
                          </Badge>
                        )}
                        {isPending && (
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h4 className="font-medium text-gray-900 mb-4">Live Evaluation</h4>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{currentScore || '--'}</div>
                  <div className="text-sm text-gray-600">Latest Score</div>
                </div>
                {latestFeedback && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-600 mb-1">Latest Feedback</div>
                    <p className="text-sm text-gray-800">{latestFeedback}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
