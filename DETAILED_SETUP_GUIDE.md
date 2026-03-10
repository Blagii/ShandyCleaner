# Shandy Cleaner - Professional Setup & Configuration Guide

This document provides a comprehensive guide for setting up and configuring **Shandy Cleaner**. The application is architected with a **MySQL-only** database backend and a high-performance **Vite + React** frontend.

---

## 1. Prerequisites
- **Node.js**: Version 18.0 or higher (LTS recommended).
- **MySQL Server**: Version 8.0 or higher.
- **NPM/PNPM**: Standard Node Package Manager.

---

## 2. Initial Installation

1. **Extract the project**: Ensure all files are in your desired working directory.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Database Setup**: Create a new database in your MySQL server (e.g., `shandy_cleaner`). The application will handle table creation automatically on the first run.

---

## 3. Environment Configuration (.env)

Create a file named `.env` in the root directory (or rename `.env.example`). Adjust the following values:

### A. MySQL Database Settings
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password    # Leave empty if no password
DB_NAME=shandy_cleaner
```

### B. Security & System
```env
PORT=3000                    # The port your server will run on
NODE_ENV=development         # Use 'production' for live deployment
JWT_SECRET=j7H5$kL9@p2mN!zQ  # Mandatory: Change this to a unique random string
```

### C. Frontend Configuration (Vite)
**Important:** Variables used by the browser MUST start with `VITE_`.
```env
VITE_GEMINI_API_KEY=your_key  # Your Google Gemini API Key
VITE_GOOGLE_ADSENSE_CLIENT_ID=ca-pub-xxx # Your AdSense Publisher ID
VITE_ADSENSE_SLOT_TOP=1234567 # Your Ad Unit Slot ID
VITE_ANALYTICS_ID=G-XXXXXXX   # Google Analytics 4 Measurement ID
```

### D. SMTP Email Settings
Required for user registration, verification codes, and system alerts:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=app-specific-password
SMTP_FROM="Shandy Cleaner" <noreply@yourdomain.com>
```

---

## 4. Administrative Controls

Default Admin Login:
- **Username**: `admin`
- **Password**: `admin`
*(Change your password immediately after the first login in the User Management section)*

### Admin Panel Features:
- **Dashboard**: Track processed files, bytes saved, and total errors in real-time.
- **Configuration**:
  - **System Instruction**: Customize the AI's cleanup behavior (Prompt).
  - **Model Fallback**: List Gemini models (e.g., `gemini-2.0-flash`, `gemini-1.5-flash`) to ensure reliability.
  - **AdSense/Analytics**: Update IDs without touching code.
- **System Control**:
  - **Maintenance Mode**: Disable the app with a custom message for users.
  - **Announcements**: Push global banners to the home page.
  - **Popup Notifications**: Show important alerts to users on login.
- **Email Templates**: A fully featured HTML editor for all system-sent emails.

---

## 5. Deployment Guide

### Development
```bash
npm run dev
```
Runs the Vite dev server with Hot Module Replacement (HMR).

### Production
```bash
# 1. Build the frontend
npm run build

# 2. Update .env
NODE_ENV=production

# 3. Start the production server
npm start
```

---

## 6. How Configuration Priority Works
1. When the app starts, it reads defaults from your `.env` file.
2. Once you change a setting in the **Admin Panel**, that value is saved to the MySQL `config` table.
3. **Database values always take priority** over `.env` file values for settings like AI Prompts, AdSense IDs, and Announcements.

---

## 7. Troubleshooting
- **Database Connection**: Ensure your MySQL service is running and the user has `ALL PRIVILEGES` on the database.
- **Vite Variables**: If changes to `.env` aren't reflecting in the browser, restart the server and clear your browser cache.
- **Email Errors**: Ensure your SMTP provider allows third-party apps (for Gmail, you **must** use an "App Password").

---
*Shandy Cleaner v2.0 - Built for efficiency and performance.*
