import nodemailer from 'nodemailer';
import { templateService } from './templateService';

export const sendEmail = async (to: string, subject: string, html: string) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('Email service not configured (SMTP_USER/PASS missing). Skipping email send.');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Shandy Cleaner" <noreply@shandycleaner.com>',
      to,
      subject,
      html,
    });
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw, just log, so we don't break the main flow if email fails
  }
};

export const sendVerificationCode = async (email: string, code: string) => {
  const rendered = await templateService.render('verification', { code });
  if (!rendered) {
    console.error('Template verification not found');
    return;
  }
  await sendEmail(email, rendered.subject, rendered.html);
};

export const sendWelcomeEmail = async (email: string, username: string) => {
  const rendered = await templateService.render('welcome', { username });
  if (!rendered) {
    console.error('Template welcome not found');
    return;
  }
  await sendEmail(email, rendered.subject, rendered.html);
};

export const sendMaintenanceAlert = async (email: string, message: string) => {
  const rendered = await templateService.render('maintenance', { message });
  if (!rendered) {
    console.error('Template maintenance not found');
    return;
  }
  await sendEmail(email, rendered.subject, rendered.html);
};

export const sendAccountUpdateEmail = async (email: string, username: string, changes: string[]) => {
  const changesHtml = changes.map(c => `<li>${c}</li>`).join('');
  const rendered = await templateService.render('account_update', { username, changes: changesHtml });
  
  if (!rendered) {
    console.error('Template account_update not found');
    return;
  }
  await sendEmail(email, rendered.subject, rendered.html);
};
