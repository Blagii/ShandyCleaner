# Shandy Cleaner v3.0

Shandy Cleaner is an advanced, AI-powered code optimization tool designed specifically for FiveM (GTA V) Lua and JavaScript resources. It leverages Google's Gemini AI to clean, format, de-obfuscate, and optimize scripts while maintaining their original logic and functionality.

## 🚀 Features

-   **AI-Powered Cleaning**: Uses Google's Gemini models to intelligently refactor code.
-   **Multi-File Support**: Process single files or entire `.zip` project archives.
-   **Smart Analysis**: Provides performance metrics (complexity, readability, maintainability).
-   **User Authentication**: Secure login and registration system with role-based access (Admin/Editor).
-   **Visitor Tracking**: Built-in server-side visitor counter and statistics.
-   **Modern UI**: Built with React 19, Tailwind CSS v4, and Framer Motion for smooth animations.
-   **Secure**:
    -   JWT-based authentication with HTTP-only cookies.
    -   Rate limiting to prevent abuse.
    -   Helmet for security headers.

## 🏗️ Architecture

-   **Frontend**: React 19 + Vite 6 + Tailwind CSS 4 + Framer Motion
-   **Backend**: Express 5 (Node.js)
-   **Database**: **MySQL 8.0+** (Required)
-   **AI Integration**: Google Gemini AI (via official SDK)
-   **Email**: SMTP support via Nodemailer
-   **Authentication**: JWT (JSON Web Tokens) with HTTP-only cookies

---

## 🛠️ Installation & Setup

For a full, detailed walkthrough of the configuration (MySQL, Secrets, AI Keys), please refer to the:
👉 **[DETAILED_SETUP_GUIDE.md](./DETAILED_SETUP_GUIDE.md)**

### Quick Start:

1.  **Extract the project** and open the folder in your terminal.
2.  **Install Dependencies**
    ```bash
    npm install
    ```
3.  **Configure Environment**
    Copy `.env.example` to `.env` and fill in your MySQL credentials.
4.  **Start Development**
    ```bash
    npm run dev
    ```

## ⚙️ Configuration

### Default Admin
When the server starts, if no admin exists, a default one is created:
-   **Username**: `admin`
-   **Password**: `admin`
*(Change these immediately after first login)*

## 📦 Deployment

This app is ready for deployment on platforms like Railway, Render, or a VPS.

1.  **Build the Project**
    ```bash
    npm run build
    ```

2.  **Start Production Server**
    ```bash
    npm start
    ```

## 📄 License

This project is proprietary. Unauthorized copying or distribution is strictly prohibited.
