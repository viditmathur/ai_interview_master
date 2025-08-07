import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Mail, Settings, TestTube, CheckCircle, AlertCircle } from 'lucide-react';

interface EmailConfig {
  provider: 'sendgrid' | 'console';
  apiKey?: string;
  fromEmail?: string;
  fromName?: string;
}

export default function AdminEmailConfig() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [config, setConfig] = useState<EmailConfig>({
    provider: 'console',
    fromEmail: 'noreply@firstroundai.com',
    fromName: 'FirstroundAI'
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

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

    // Load current email configuration
    loadEmailConfig();
  }, [setLocation]);

  const loadEmailConfig = async () => {
    try {
      const response = await fetch('/api/admin/email-config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Failed to load email config:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/email-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        toast({
          title: "Configuration Saved",
          description: "Email configuration has been updated successfully.",
        });
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save email configuration. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST'
      });

      const result = await response.json();
      setTestResult(result);

      if (result.success) {
        toast({
          title: "Test Successful",
          description: result.message,
        });
      } else {
        toast({
          title: "Test Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Test failed due to network error' });
      toast({
        title: "Test Failed",
        description: "Failed to test email connection. Please try again.",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Configuration</h1>
        <p className="text-lg text-gray-600">Configure email settings for interview invitations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Email Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="provider">Email Provider</Label>
              <Select
                value={config.provider}
                onValueChange={(value) => setConfig(prev => ({ ...prev, provider: value as 'sendgrid' | 'console' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="console">Console Mode (Development)</SelectItem>
                  <SelectItem value="sendgrid">SendGrid (Production)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {config.provider === 'sendgrid' && (
              <>
                <div>
                  <Label htmlFor="apiKey">SendGrid API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={config.apiKey || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="SG.your_api_key_here"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Get your API key from <a href="https://sendgrid.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">SendGrid Dashboard</a>
                  </p>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="fromEmail">From Email Address</Label>
              <Input
                id="fromEmail"
                type="email"
                value={config.fromEmail || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, fromEmail: e.target.value }))}
                placeholder="noreply@yourcompany.com"
              />
            </div>

            <div>
              <Label htmlFor="fromName">From Name</Label>
              <Input
                id="fromName"
                value={config.fromName || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, fromName: e.target.value }))}
                placeholder="Your Company Name"
              />
            </div>

            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Saving...' : 'Save Configuration'}
            </Button>
          </CardContent>
        </Card>

        {/* Test & Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Test & Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={config.provider === 'sendgrid' ? 'default' : 'secondary'}>
                {config.provider === 'sendgrid' ? 'SendGrid' : 'Console Mode'}
              </Badge>
              {config.provider === 'sendgrid' && (
                <Badge variant={config.apiKey ? 'default' : 'destructive'}>
                  {config.apiKey ? 'API Key Set' : 'No API Key'}
                </Badge>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Current Status:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Provider: <strong>{config.provider}</strong></li>
                <li>• From: <strong>{config.fromName} &lt;{config.fromEmail}&gt;</strong></li>
                {config.provider === 'sendgrid' && (
                  <li>• API Key: <strong>{config.apiKey ? 'Configured' : 'Missing'}</strong></li>
                )}
              </ul>
            </div>

            <Button 
              onClick={handleTest} 
              disabled={testing || (config.provider === 'sendgrid' && !config.apiKey)}
              variant="outline"
              className="w-full"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </Button>

            {testResult && (
              <div className={`p-4 rounded-lg border ${
                testResult.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`font-medium ${
                    testResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {testResult.success ? 'Test Successful' : 'Test Failed'}
                  </span>
                </div>
                <p className={`text-sm mt-1 ${
                  testResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {testResult.message}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Information Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Configuration Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Console Mode (Development)</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Emails are logged to console</li>
                <li>• No external dependencies</li>
                <li>• Perfect for development/testing</li>
                <li>• No API key required</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">SendGrid Mode (Production)</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Real email delivery</li>
                <li>• Professional email templates</li>
                <li>• Delivery tracking & analytics</li>
                <li>• Requires SendGrid API key</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Getting Started with SendGrid:</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Sign up at <a href="https://sendgrid.com" target="_blank" rel="noopener noreferrer" className="underline">sendgrid.com</a></li>
              <li>2. Get your API key from the dashboard</li>
              <li>3. Verify your sender domain (recommended)</li>
              <li>4. Enter your API key above</li>
              <li>5. Test the connection</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 