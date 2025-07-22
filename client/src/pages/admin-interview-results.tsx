import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { getInterviewResults } from '@/lib/api';

export default function AdminInterviewResults() {
  const [location] = useLocation();
  const id = Number(location.split('/').pop());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getInterviewResults(id)
      .then(setData)
      .catch(() => setError('Failed to fetch interview results'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!data) return null;

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-4">Interview Results</h2>
      <div className="mb-2"><b>Candidate:</b> {data.candidate?.name} ({data.candidate?.email})</div>
      <div className="mb-2"><b>Role:</b> {data.candidate?.jobRole}</div>
      <div className="mb-2"><b>Date:</b> {data.interview?.createdAt ? new Date(data.interview.createdAt).toLocaleString() : ''}</div>
      <div className="mb-4"><b>Status:</b> {data.interview?.status}</div>
      <div className="mb-4">
        <b>Questions & Answers:</b>
        <ul className="list-disc ml-6 mt-2">
          {data.answers?.map((a: any, i: number) => (
            <li key={i} className="mb-2">
              <div><b>Q{i+1}:</b> {a.questionText}</div>
              <div><b>Answer:</b> {a.answerText}</div>
              <div><b>Score:</b> {a.score}/10</div>
              <div><b>Feedback:</b> {a.feedback}</div>
            </li>
          ))}
        </ul>
      </div>
      {data.evaluation && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <div><b>Overall Score:</b> {data.evaluation.overallScore}/100</div>
          <div><b>Technical Score:</b> {data.evaluation.technicalScore}/100</div>
          <div><b>Behavioral Score:</b> {data.evaluation.behavioralScore}/100</div>
          <div><b>Strengths:</b> {data.evaluation.strengths}</div>
          <div><b>Improvement Areas:</b> {data.evaluation.improvementAreas}</div>
          <div><b>Recommendation:</b> {data.evaluation.recommendation}</div>
        </div>
      )}
    </div>
  );
} 