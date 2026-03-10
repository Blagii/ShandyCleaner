import { query } from './database';

export interface User {
  id: string;
  username: string;
  email?: string;
  passwordHash: string;
  role: 'admin' | 'editor';
  createdAt: string;
}

export interface Stats {
  totalFilesProcessed: number;
  totalBytesSaved: number;
  totalErrors: number;
  totalVisits: number;
  lastRun: string | null;
}

export interface HistoryItem {
  id: string;
  user_id: string;
  mode: string;
  original_code: string;
  cleaned_code: string;
  file_name?: string;
  created_at: string;
}

export const db = {
  // ... existing methods ...
  getHistory: async (userId: string): Promise<HistoryItem[]> => {
    const [rows]: any = await query('SELECT * FROM history WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [userId]);
    return rows;
  },
  addHistory: async (item: HistoryItem) => {
    await query(
      'INSERT INTO history (id, user_id, mode, original_code, cleaned_code, file_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [item.id, item.user_id, item.mode, item.original_code, item.cleaned_code, item.file_name, item.created_at]
    );
    return item;
  },
  clearHistory: async (userId: string) => {
    await query('DELETE FROM history WHERE user_id = ?', [userId]);
  },
  updateUserApiKey: async (userId: string, provider: 'gemini' | 'anthropic', apiKey: string) => {
    const column = provider === 'anthropic' ? 'anthropic_api_key' : 'gemini_api_key';
    await query(`UPDATE users SET ${column} = ? WHERE id = ?`, [apiKey, userId]);
  },
  getUserApiKeys: async (userId: string): Promise<{ gemini?: string; anthropic?: string }> => {
    const [rows]: any = await query('SELECT gemini_api_key, anthropic_api_key FROM users WHERE id = ?', [userId]);
    if (!rows[0]) return {};
    return {
      gemini: rows[0].gemini_api_key,
      anthropic: rows[0].anthropic_api_key
    };
  },
  // ... existing methods ...
  getUsers: async (): Promise<User[]> => {
    const [rows]: any = await query('SELECT * FROM users');
    return rows;
  },
  getUserByUsername: async (username: string): Promise<User | undefined> => {
    const [rows]: any = await query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0];
  },
  getUserById: async (id: string): Promise<User | undefined> => {
    const [rows]: any = await query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  },
  createUser: async (user: User) => {
    await query(
      'INSERT INTO users (id, username, email, passwordHash, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [user.id, user.username, user.email, user.passwordHash, user.role, user.createdAt]
    );
    return user;
  },
  updateUser: async (id: string, updates: Partial<User>) => {
    const fields = Object.keys(updates);
    if (fields.length === 0) return null;

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => (updates as any)[f]);
    values.push(id);

    await query(`UPDATE users SET ${setClause} WHERE id = ?`, values);
    
    const [rows]: any = await query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  },
  deleteUser: async (id: string) => {
    const [rows]: any = await query('SELECT * FROM users WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    
    await query('DELETE FROM users WHERE id = ?', [id]);
    return rows[0];
  },
  getStats: async (): Promise<Stats> => {
    const [rows]: any = await query('SELECT * FROM stats WHERE id = 1');
    if (rows.length === 0) {
      return {
        totalFilesProcessed: 0,
        totalBytesSaved: 0,
        totalErrors: 0,
        totalVisits: 0,
        lastRun: null
      };
    }
    return rows[0];
  },
  updateStats: async (updates: Partial<Stats>) => {
    const fields = Object.keys(updates);
    if (fields.length === 0) return null;

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => (updates as any)[f]);
    values.push(1); // id = 1

    await query(`UPDATE stats SET ${setClause} WHERE id = ?`, values);
    
    const [rows]: any = await query('SELECT * FROM stats WHERE id = 1');
    return rows[0];
  },
  incrementStats: async (files: number, bytes: number, errors: number) => {
    const lastRun = new Date().toISOString();
    await query(
      `UPDATE stats SET 
        totalFilesProcessed = totalFilesProcessed + ?, 
        totalBytesSaved = totalBytesSaved + ?, 
        totalErrors = totalErrors + ?, 
        lastRun = ? 
      WHERE id = 1`,
      [files, bytes, errors, lastRun]
    );
    
    const [rows]: any = await query('SELECT * FROM stats WHERE id = 1');
    return rows[0];
  },
  incrementVisits: async () => {
    await query('UPDATE stats SET totalVisits = totalVisits + 1 WHERE id = 1');
    const [rows]: any = await query('SELECT * FROM stats WHERE id = 1');
    return rows[0];
  },
  resetStats: async () => {
    await query(`
      UPDATE stats SET 
        totalFilesProcessed = 0, 
        totalBytesSaved = 0, 
        totalErrors = 0, 
        totalVisits = 0, 
        lastRun = NULL 
      WHERE id = 1
    `);
    
    const [rows]: any = await query('SELECT * FROM stats WHERE id = 1');
    return rows[0];
  }
};
