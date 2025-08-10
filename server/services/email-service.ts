import * as sgMail from '@sendgrid/mail';
import { storage } from '../storage';

export interface EmailConfig {
  provider: 'sendgrid' | 'console';
  apiKey?: string;
  fromEmail?: string;
  fromName?: string;
}

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private config: EmailConfig = {
    provider: 'console',
    fromEmail: 'noreply@firstroundai.com',
    fromName: 'FirstroundAI'
  };

  async initialize() {
    try {
      // Load email configuration from database
      const provider = await storage.getSetting('email_provider') || 'console';
      const apiKey = await storage.getSetting('sendgrid_api_key');
      const fromEmail = await storage.getSetting('email_from_address') || 'noreply@firstroundai.com';
      const fromName = await storage.getSetting('email_from_name') || 'FirstroundAI';

      this.config = {
        provider: provider as 'sendgrid' | 'console',
        apiKey,
        fromEmail,
        fromName
      };

      // Initialize SendGrid if configured
      if (this.config.provider === 'sendgrid' && this.config.apiKey) {
        sgMail.setApiKey(this.config.apiKey);
        console.log('SendGrid initialized with API key');
      } else {
        console.log('Email service using console mode');
      }
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      this.config.provider = 'console';
    }
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      if (this.config.provider === 'sendgrid' && this.config.apiKey) {
        return await this.sendWithSendGrid(emailData);
      } else {
        return await this.sendToConsole(emailData);
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      // Fallback to console
      return await this.sendToConsole(emailData);
    }
  }

  private async sendWithSendGrid(emailData: EmailData): Promise<boolean> {
    try {
      const msg = {
        to: emailData.to,
        from: {
          email: this.config.fromEmail!,
          name: this.config.fromName!
        },
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || this.htmlToText(emailData.html)
      };

      await sgMail.send(msg);
      console.log(`Email sent via SendGrid to: ${emailData.to}`);
      return true;
    } catch (error) {
      console.error('SendGrid error:', error);
      throw error;
    }
  }

  private async sendToConsole(emailData: EmailData): Promise<boolean> {
    console.log('\n=== EMAIL SENT (CONSOLE MODE) ===');
    console.log(`To: ${emailData.to}`);
    console.log(`From: ${this.config.fromName} <${this.config.fromEmail}>`);
    console.log(`Subject: ${emailData.subject}`);
    console.log('Body:');
    console.log(emailData.html);
    console.log('=====================================\n');
    return true;
  }

  private htmlToText(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  async updateConfig(newConfig: Partial<EmailConfig>): Promise<void> {
    // Update database settings
    if (newConfig.provider) {
      await storage.setSetting('email_provider', newConfig.provider);
    }
    if (newConfig.apiKey) {
      await storage.setSetting('sendgrid_api_key', newConfig.apiKey);
    }
    if (newConfig.fromEmail) {
      await storage.setSetting('email_from_address', newConfig.fromEmail);
    }
    if (newConfig.fromName) {
      await storage.setSetting('email_from_name', newConfig.fromName);
    }

    // Reinitialize with new config
    await this.initialize();
  }

  getConfig(): EmailConfig {
    return { ...this.config };
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (this.config.provider === 'sendgrid' && this.config.apiKey) {
        // Test SendGrid connection by sending a test email to a test address
        const testEmail: EmailData = {
          to: 'test@example.com',
          subject: 'SendGrid Connection Test',
          html: '<p>This is a test email to verify SendGrid connection.</p>'
        };
        
        await this.sendWithSendGrid(testEmail);
        return { success: true, message: 'SendGrid connection successful' };
      } else {
        return { success: true, message: 'Console mode active - no external connection needed' };
      }
    } catch (error) {
      return { success: false, message: `Connection failed: ${error}` };
    }
  }
}

export const emailService = new EmailService(); 