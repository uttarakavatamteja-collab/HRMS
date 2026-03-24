# 🏢 HRMS - Human Resource Management System

A full-stack HRMS inspired by greytHR with React frontend, Node.js/Express backend, and PostgreSQL database.

## 📁 Project Structure

```
hrms/
├── frontend/          # React app (Vite + TailwindCSS)
├── backend/           # Node.js + Express REST API
├── database/          # SQL schema + seed data
└── README.md
```

## 🚀 Quick Start (VS Code)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Database Setup
```bash
psql -U postgres -f database/schema.sql
psql -U postgres -f database/seed.sql
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env   # Edit with your DB credentials
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 🔐 Default Login
- **Admin**: admin@company.com / admin123
- **Employee**: employee@company.com / emp123

## 📦 Modules
1. Dashboard
2. Employee Management
3. Attendance Tracking
4. Leave Management
5. Payroll Processing
6. Recruitment
7. Performance Management
8. HR Helpdesk
9. Reports & Analytics
10. Settings
