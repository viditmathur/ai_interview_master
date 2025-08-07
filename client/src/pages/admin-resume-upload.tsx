import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUpload } from '@/components/file-upload';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Mail, User, Phone, Briefcase } from 'lucide-react';

interface ExtractedInfo {
  name: string;
  email: string;
  phone: string;
  designation: string;
  pastCompanies: string[];
  skillset: string[];
}

export default function AdminResumeUpload() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [jobRole, setJobRole] = useState('');
  const [skillset, setSkillset] = useState('');
  const [extractedInfo, setExtractedInfo] = useState<ExtractedInfo | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  useEffect(() => {
    // Check if user is admin
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      setLocation('/login');
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== 'admin') {
      setLocation('/admin');
      return;
    }
  }, [setLocation]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setExtractedInfo(null); // Reset extracted info when new file is selected
  };

  const handleExtractInfo = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a resume file first.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('resume', selectedFile);

      const response = await fetch('/api/admin/extract-resume-info', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to extract information from resume');
      }

      const data = await response.json();
      setExtractedInfo(data);
      setInviteEmail(data.email);
      
      // Auto-populate skillset from resume if available
      if (data.skillset && data.skillset.length > 0) {
        setSkillset(data.skillset.join(', '));
      }
      
      toast({
        title: "Information Extracted",
        description: "Candidate information has been extracted from the resume using AI.",
      });
    } catch (error) {
      toast({
        title: "Extraction Failed",
        description: "Failed to extract information from resume. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendInvite = async () => {
    if (!extractedInfo || !jobRole || !skillset) {
      toast({
        title: "Missing Information",
        description: "Please ensure all fields are filled and information is extracted.",
        variant: "destructive"
      });
      return;
    }

    setSendingInvite(true);
    try {
      const response = await fetch('/api/admin/send-interview-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          candidateInfo: {
            ...extractedInfo,
            email: inviteEmail // Use the manually entered email from the dialog
          },
          jobRole,
          skillset
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send interview invite');
      }

      toast({
        title: "Invitation Sent",
        description: `Interview invitation has been sent to ${inviteEmail}`,
      });

      setShowInviteDialog(false);
      // Reset form
      setSelectedFile(undefined);
      setJobRole('');
      setSkillset('');
      setExtractedInfo(null);
    } catch (error) {
      toast({
        title: "Failed to Send Invite",
        description: "Failed to send interview invitation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSendingInvite(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Candidate Resume</h1>
        <p className="text-lg text-gray-600">Upload a candidate's resume to extract information and send interview invitation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Resume</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="resume">Resume File</Label>
              <FileUpload
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
                onFileRemove={() => setSelectedFile(undefined)}
              />
            </div>

            <div>
              <Label htmlFor="jobRole">Job Role</Label>
              <Input
                id="jobRole"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                placeholder="e.g., Software Engineer, QA Manager"
              />
            </div>

            <div>
              <Label htmlFor="skillset">Required Skillset</Label>
              <Input
                id="skillset"
                value={skillset}
                onChange={(e) => setSkillset(e.target.value)}
                placeholder="e.g., React, Node.js, Testing (will be auto-populated from resume)"
              />
              {extractedInfo?.skillset && extractedInfo.skillset.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  💡 Skillset auto-populated from resume. You can modify as needed.
                </p>
              )}
            </div>

            <Button 
              onClick={handleExtractInfo} 
              disabled={!selectedFile || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Extracting...' : 'Extract Information'}
            </Button>
          </CardContent>
        </Card>

        {/* Extracted Information */}
        <Card>
          <CardHeader>
            <CardTitle>Extracted Information</CardTitle>
          </CardHeader>
          <CardContent>
            {extractedInfo ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-500" />
                  <div>
                    <Label className="text-sm text-gray-500">Name</Label>
                    <p className="font-medium">{extractedInfo.name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <div className="flex-1">
                    <Label className="text-sm text-gray-500">Email</Label>
                    <Input
                      value={extractedInfo.email}
                      onChange={(e) => setExtractedInfo(prev => prev ? { ...prev, email: e.target.value } : null)}
                      placeholder="Enter candidate email"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <div className="flex-1">
                    <Label className="text-sm text-gray-500">Phone</Label>
                    <Input
                      value={extractedInfo.phone}
                      onChange={(e) => setExtractedInfo(prev => prev ? { ...prev, phone: e.target.value } : null)}
                      placeholder="Enter candidate phone"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Briefcase className="h-5 w-5 text-gray-500" />
                  <div className="flex-1">
                    <Label className="text-sm text-gray-500">Current Designation</Label>
                    <Input
                      value={extractedInfo.designation}
                      onChange={(e) => setExtractedInfo(prev => prev ? { ...prev, designation: e.target.value } : null)}
                      placeholder="Current job title"
                      className="mt-1"
                    />
                  </div>
                </div>

                {extractedInfo.pastCompanies.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-500">Past Companies</Label>
                    <div className="flex flex-wrap gap-2">
                      {extractedInfo.pastCompanies.map((company, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {company}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {extractedInfo.skillset.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-500">Skillset (from resume)</Label>
                    <div className="flex flex-wrap gap-2">
                      {extractedInfo.skillset.map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  <p>💡 <strong>Note:</strong> Information extracted using AI. Please verify and update details if needed.</p>
                </div>

                <div className="flex items-center space-x-3">
                  <Briefcase className="h-5 w-5 text-gray-500" />
                  <div>
                    <Label className="text-sm text-gray-500">Job Role</Label>
                    <Input
                      value={jobRole}
                      readOnly
                      className="bg-gray-50 mt-1"
                    />
                  </div>
                </div>
                <div className="text-xs text-gray-500 ml-8 mb-2">(Set by admin above)</div>

                <Button 
                  onClick={() => setShowInviteDialog(true)}
                  className="w-full"
                  disabled={!jobRole || !skillset}
                >
                  Send Interview Invitation
                </Button>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Upload a resume and extract information to see candidate details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invitation Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Interview Invitation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="inviteEmail">Email Address</Label>
              <Input
                id="inviteEmail"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="candidate@example.com"
              />
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Invitation Details:</h4>
              <p className="text-sm text-gray-600">
                An email will be sent to <strong>{inviteEmail}</strong> with:
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• Interview invitation link</li>
                <li>• Job role: <strong>{jobRole}</strong></li>
                <li>• Required skills: <strong>{skillset}</strong></li>
                <li>• Instructions to sign up and start the interview</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendInvite} disabled={sendingInvite}>
              {sendingInvite ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 