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
    // Autofill email with login email
    setFormData(prev => ({ ...prev, email: user.email }));
    // Block upload if interview is completed
    const interviewResults = sessionStorage.getItem('interviewResults');
    if (interviewResults) {
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
  }, [setLocation, toast]);

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

      // Store interview data for the session
      sessionStorage.setItem('currentInterview', JSON.stringify({
        interviewId: response.interviewId,
        candidateId: response.candidateId,
        questions: response.questions,
        currentQuestionIndex: 0
      }));

      toast({
        title: "Interview Started",
        description: "Your resume has been processed. Good luck!"
      });

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

  if (blockAdmin) return null;

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
            disabled={isSubmitting}
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
    </div>
  );
}
