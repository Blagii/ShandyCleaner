import { query } from '../database';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  variables: string[];
}

const defaultTemplates: EmailTemplate[] = [
  {
    id: 'verification',
    name: 'Email Verification',
    subject: 'Verify your email - Shandy Cleaner',
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #3b82f6;">Verify your email</h1>
      <p>Please use the following code to complete your registration:</p>
      <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; margin: 20px 0;">
        {{code}}
      </div>
      <p>This code will expire in 10 minutes.</p>
      <br/>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
    `,
    variables: ['code']
  },
  {
    id: 'welcome',
    name: 'Welcome Email',
    subject: 'Welcome to Shandy Cleaner!',
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #3b82f6;">Welcome, {{username}}!</h1>
      <p>Thank you for registering with Shandy Cleaner.</p>
      <p>You can now access our advanced code optimization tools.</p>
      <br/>
      <p>Best regards,</p>
      <p>The Shandy Cleaner Team</p>
    </div>
    `,
    variables: ['username']
  },
  {
    id: 'maintenance',
    name: 'Maintenance Alert',
    subject: 'System Maintenance Alert - Shandy Cleaner',
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #f59e0b;">System Maintenance Alert</h1>
      <p>Hello,</p>
      <p>This is an automated alert regarding system maintenance:</p>
      <blockquote style="background: #f3f4f6; padding: 15px; border-left: 4px solid #f59e0b;">
        {{message}}
      </blockquote>
      <p>Please plan your usage accordingly.</p>
      <br/>
      <p>Best regards,</p>
      <p>The Shandy Cleaner Team</p>
    </div>
    `,
    variables: ['message']
  },
  {
    id: 'account_update',
    name: 'Account Update Notification',
    subject: 'Your account details have been updated',
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #3b82f6;">Account Update</h1>
      <p>Hello {{username}},</p>
      <p>Your account details have been updated by an administrator:</p>
      <ul>
        {{changes}}
      </ul>
      <p>If you did not authorize these changes, please contact support immediately.</p>
      <br/>
      <p>Best regards,</p>
      <p>The Shandy Cleaner Team</p>
    </div>
    `,
    variables: ['username', 'changes']
  }
];

// Initialize templates in DB
export const initTemplates = async () => {
  try {
    for (const tmpl of defaultTemplates) {
      try {
        await query(
          `INSERT IGNORE INTO email_templates (id, name, subject, html, variables) VALUES (?, ?, ?, ?, ?)`,
          [tmpl.id, tmpl.name, tmpl.subject, tmpl.html, JSON.stringify(tmpl.variables)]
        );
      } catch (error: any) {
        if (error.code === 'ECONNREFUSED') {
          console.warn('MySQL connection refused in initTemplates. Skipping.');
          return;
        }
        throw error;
      }
    }
  } catch (error) {
    console.error('Failed to initialize email templates:', error);
  }
};

export const templateService = {
  getTemplates: async (): Promise<EmailTemplate[]> => {
    const [rows]: any = await query('SELECT * FROM email_templates');
    return rows.map((row: any) => ({
      ...row,
      variables: typeof row.variables === 'string' ? JSON.parse(row.variables) : row.variables
    }));
  },
  getTemplate: async (id: string): Promise<EmailTemplate | undefined> => {
    const [rows]: any = await query('SELECT * FROM email_templates WHERE id = ?', [id]);
    if (rows.length === 0) return undefined;
    const row = rows[0];
    return {
      ...row,
      variables: typeof row.variables === 'string' ? JSON.parse(row.variables) : row.variables
    };
  },
  updateTemplate: async (id: string, updates: Partial<EmailTemplate>) => {
    const fields = Object.keys(updates);
    if (fields.length === 0) return null;

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => {
      const val = (updates as any)[f];
      return f === 'variables' ? JSON.stringify(val) : val;
    });
    values.push(id);

    await query(`UPDATE email_templates SET ${setClause} WHERE id = ?`, values);
    
    const [rows]: any = await query('SELECT * FROM email_templates WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      ...row,
      variables: typeof row.variables === 'string' ? JSON.parse(row.variables) : row.variables
    };
  },
  render: async (id: string, data: Record<string, string>) => {
    const [rows]: any = await query('SELECT * FROM email_templates WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const template = rows[0];

    let subject = template.subject;
    let html = template.html;

    const escapeHtml = (unsafe: string) => {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      const safeValue = escapeHtml(value);
      subject = subject.replace(regex, safeValue);
      html = html.replace(regex, safeValue);
    });

    return { subject, html };
  }
};
