import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUpload } from '@/components/file-upload';
import { AIStatusBanner } from '@/components/ai-status-banner';
import { startInterview } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function InterviewUpload() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    jobRole: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [blockAdmin, setBlockAdmin] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  useEffect(() => {
    // Redirect to login if not logged in
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      setLocation('/login');
      return;
    }
    const user = JSON.parse(userStr);
    // Block admin users from accessing this page
    if (user.role === 'admin') {
      setBlockAdmin(true);
      toast({
        title: "Admins cannot attend interviews",
        description: "Admin users are not allowed to upload resumes or attend interviews.",
        variant: "destructive"
      });
      setTimeout(() => setLocation('/admin'), 1500);
      return;
    }
    // Block if interview is in progress (any tab) for candidates only
    if (user && user.role !== 'admin' && sessionStorage.getItem('currentInterview')) {
      toast({
        title: 'Interview In Progress',
        description: 'You cannot upload a resume while an interview is in progress.',
        variant: 'destructive'
      });
      setTimeout(() => {
        localStorage.removeItem('user');
        sessionStorage.clear();
        setLocation('/login');
      }, 1500);
      return;
    }
    // Autofill email with login email
    setFormData(prev => ({ ...prev, email: user.email }));
    // Block upload if interview is completed (client-side check)
    const interviewResults = sessionStorage.getItem('interviewResults');
    if (interviewResults) {
      setAlreadyCompleted(true);
      toast({
        title: "Interview Already Completed",
        description: "You have already completed your interview. You cannot upload another resume.",
        variant: "destructive"
      });
      setTimeout(() => {
        localStorage.removeItem('user');
        sessionStorage.clear();
        setLocation('/login');
      }, 2000);
      return;
    }
    // Backend check for completed interview
    if (userStr) {
      const user = JSON.parse(userStr);
      fetch(`/api/admin/candidates`).then(res => res.json()).then(candidates => {
        const candidate = candidates.find((c: any) => c.email.toLowerCase() === user.email.toLowerCase());
        if (candidate) {
          fetch(`/api/admin/interviews`).then(res => res.json()).then(interviews => {
            const completed = interviews.some((i: any) => i.candidate.id === candidate.id && i.status === 'completed');
            if (completed) {
              setAlreadyCompleted(true);
              toast({
                title: "Interview Already Completed",
                description: "You have already completed your interview. You cannot upload another resume.",
                variant: "destructive"
              });
              setTimeout(() => {
                localStorage.removeItem('user');
                sessionStorage.clear();
                setLocation('/login');
              }, 2000);
            }
          });
        }
      });
    }
  }, [setLocation, toast]);

  useEffect(() => {
    // Check if user is invited
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user && user.role === 'candidate') {
      fetch('/api/admin/candidates')
        .then(res => res.json())
        .then(candidates => {
          const candidate = candidates.find((c: any) => c.email === user.email);
          if (candidate && candidate.invited) {
            setLocation('/interview-session');
          }
        });
    }
  }, [setLocation]);

  // Remove all state and handlers related to resume intelligence preview
  // const [resumeIntel, setResumeIntel] = useState<any>(null);
  // const [intelLoading, setIntelLoading] = useState(false);
  // const [showConfirm, setShowConfirm] = useState(false);
  // const [editedJobRole, setEditedJobRole] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: "Resume Required",
        description: "Please upload your resume to continue.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.name || !formData.email || !formData.phone || !formData.jobRole) {
      toast({
        title: "Missing Information", 
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await startInterview({
        ...formData,
        resume: selectedFile
      });

      toast({
        title: "Interview Started",
        description: "Your resume has been processed. Good luck!"
      });

      // Store interviewId and candidateId for the session page to fetch interview data
      sessionStorage.setItem('interviewId', response.interviewId.toString());
      sessionStorage.setItem('candidateId', response.candidateId.toString());

      setLocation('/interview');
      
    } catch (error: any) {
      if (error?.response?.status === 403 || (error instanceof Error && error.message.includes('Only one interview'))) {
        toast({
          title: "Interview Already Completed",
          description: "You have already completed your interview. You will be logged out.",
          variant: "destructive"
        });
        localStorage.removeItem('user');
        setTimeout(() => setLocation('/login'), 2000);
        return;
      }
      console.error('Error starting interview:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start interview",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      jobRole: ''
    });
    setSelectedFile(undefined);
  };

  // Add handler for confirmation
  // const handleConfirm = () => {
  //   setFormData(prev => ({ ...prev, jobRole: editedJobRole || resumeIntel?.inferredRole || '' }));
  //   setShowConfirm(false);
  // };

  if (blockAdmin) return null;
  if (alreadyCompleted) {
    return (
      <div className="max-w-2xl mx-auto mt-24 text-center">
        <h2 className="text-2xl font-bold mb-4 text-red-600">Interview Already Completed</h2>
        <p className="text-lg text-gray-700 mb-8">You have already completed your interview. You cannot upload another resume or take the interview again.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Start Your AI Interview</h2>
        <p className="text-lg text-gray-600">Upload your resume and begin the intelligent interview process</p>
      </div>

      <AIStatusBanner />

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Resume Upload Card */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Resume Upload</CardTitle>
                <p className="text-sm text-gray-600">Upload your resume in PDF, DOC, or TXT format</p>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onFileSelect={setSelectedFile}
                  selectedFile={selectedFile}
                  onFileRemove={() => setSelectedFile(undefined)}
                />
                {/* Remove all state and handlers related to resume intelligence preview */}
                {/* {intelLoading && (
                  <div className="mt-4 text-center text-gray-500"><i className="fas fa-spinner fa-spin"></i> Parsing resume...</div>
                )} */}
                {/* {resumeIntel && !intelLoading && (
                  <div className="mt-6">
                    <h3 className="font-bold mb-2">Resume Intelligence Preview</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                          {resumeIntel.skills?.length ? resumeIntel.skills.map((s: string, i: number) => <Badge key={i}>{s}</Badge>) : <span className="text-gray-400">None detected</span>}
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader><CardTitle>Technologies/Tools</CardTitle></CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                          {resumeIntel.technologies?.length ? resumeIntel.technologies.map((t: string, i: number) => <Badge key={i}>{t}</Badge>) : <span className="text-gray-400">None detected</span>}
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader><CardTitle>Most Recent Experience</CardTitle></CardHeader>
                        <CardContent>
                          {resumeIntel.mostRecentExperience || <span className="text-gray-400">Not found</span>}
                          {resumeIntel.mostRecentCompany && <div className="text-xs text-gray-500 mt-1">Company: {resumeIntel.mostRecentCompany}</div>}
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader><CardTitle>Education</CardTitle></CardHeader>
                        <CardContent>
                          {resumeIntel.education?.length ? resumeIntel.education.map((e: string, i: number) => <div key={i}>{e}</div>) : <span className="text-gray-400">Not found</span>}
                        </CardContent>
                      </Card>
                    </div>
                    <div className="mt-4 grid md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader><CardTitle>Inferred Role</CardTitle></CardHeader>
                        <CardContent>
                          <input
                            className="border rounded px-2 py-1 w-full"
                            value={editedJobRole}
                            onChange={e => setEditedJobRole(e.target.value)}
                            placeholder="Edit job role if needed"
                          />
                          <div className="text-xs text-gray-500 mt-1">Domain: {resumeIntel.inferredDomain}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader><CardTitle>AI Summary</CardTitle></CardHeader>
                        <CardContent>{resumeIntel.aiSummary || <span className="text-gray-400">Not available</span>}</CardContent>
                      </Card>
                    </div>
                    <div className="mt-4 grid md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader><CardTitle>Weaknesses</CardTitle></CardHeader>
                        <CardContent>
                          {resumeIntel.weaknesses?.length ? resumeIntel.weaknesses.map((w: string, i: number) => <div key={i} className="text-red-600">{w}</div>) : <span className="text-gray-400">None detected</span>}
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader><CardTitle>Suggested Focus Areas</CardTitle></CardHeader>
                        <CardContent>
                          {resumeIntel.focusAreas?.length ? resumeIntel.focusAreas.map((f: string, i: number) => <div key={i} className="text-blue-600">{f}</div>) : <span className="text-gray-400">None detected</span>}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )} */}
              </CardContent>
            </Card>
          </div>

          {/* Candidate Information Card */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Candidate Information</CardTitle>
                <p className="text-sm text-gray-600">Please provide your contact details</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="john@example.com"
                    readOnly
                  />
                </div>
                
                <div>
                  <Label htmlFor="jobRole">Job Role Applying For *</Label>
                  <Select value={formData.jobRole} onValueChange={(value) => handleInputChange('jobRole', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="frontend">Frontend Developer</SelectItem>
                      <SelectItem value="backend">Backend Developer</SelectItem>
                      <SelectItem value="fullstack">Full Stack Developer</SelectItem>
                      <SelectItem value="qa">QA Engineer</SelectItem>
                      <SelectItem value="devops">DevOps Engineer</SelectItem>
                      <SelectItem value="ml">ML Engineer</SelectItem>
                      <SelectItem value="mobile">Mobile Developer</SelectItem>
                      <SelectItem value="hr_manager">HR Manager</SelectItem>
                      <SelectItem value="hr_executive">HR Executive</SelectItem>
                      <SelectItem value="hrbp">HR Business Partner</SelectItem>
                      <SelectItem value="recruiter">Recruiter</SelectItem>
                      <SelectItem value="qa_director">QA Director</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isSubmitting}
          >
            <i className="fas fa-redo mr-2"></i>Reset
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !selectedFile}
            className="bg-primary text-white hover:bg-blue-700 shadow-lg"
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>Processing...
              </>
            ) : (
              <>
                <i className="fas fa-arrow-right mr-2"></i>Start Interview
              </>
            )}
          </Button>
        </div>
      </form>
      {/* Confirmation Modal */}
      {/* <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Resume Insights</DialogTitle>
          </DialogHeader>
          <div className="mb-4">
            <div className="mb-2">Please review your resume insights and job role before proceeding.</div>
            <div className="mb-2 font-semibold">Job Role: <span className="text-primary">{editedJobRole || resumeIntel?.inferredRole}</span></div>
            <div className="mb-2 text-xs text-gray-500">You can edit the job role above if needed.</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelectedFile(undefined); setShowConfirm(false); }}>Upload Different Resume</Button>
            <Button onClick={handleConfirm}>Looks Good, Proceed</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}
    </div>
  );
}
