# 🚀 HRMS Deployment Guide

## 📋 Table of Contents
1. [Local Development (VS Code)](#local-development)
2. [Server Deployment (Ubuntu VPS)](#server-deployment)
3. [Docker Deployment](#docker-deployment)
4. [Nginx Configuration](#nginx)
5. [SSL Certificate](#ssl)
6. [PM2 Process Manager](#pm2)
7. [Troubleshooting](#troubleshooting)

---

## 1. Local Development (VS Code) <a name="local-development"></a>

### Prerequisites
- Node.js 18+ — https://nodejs.org
- PostgreSQL 14+ — https://www.postgresql.org/download
- VS Code — https://code.visualstudio.com

### Step 1: Database Setup
```bash
# Open terminal in VS Code (Ctrl+`)
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE hrms_db;
\q

# Run schema
psql -U postgres -d hrms_db -f database/schema.sql

# Seed data
psql -U postgres -d hrms_db -f database/seed.sql
```

### Step 2: Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your DB credentials:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hrms_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
JWT_SECRET=your_random_secret_key_here
```

Start backend:
```bash
npm run dev
# Backend runs at http://localhost:5000
```

### Step 3: Frontend Setup
Open a **new terminal** in VS Code:
```bash
cd frontend
npm install
npm run dev
# Frontend runs at http://localhost:5173
```

### Step 4: Open in Browser
- http://localhost:5173
- Login: admin@company.com / admin123

### VS Code Extensions Recommended
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- PostgreSQL (by Chris Kolkman)
- REST Client (for API testing)
- GitLens

---

## 2. Server Deployment (Ubuntu VPS) <a name="server-deployment"></a>

### Server Requirements
- Ubuntu 22.04 LTS
- Minimum 2 GB RAM, 2 vCPU
- 20 GB SSD
- Open ports: 22 (SSH), 80 (HTTP), 443 (HTTPS)

### Step 1: Connect & Update Server
```bash
ssh root@YOUR_SERVER_IP
apt update && apt upgrade -y
```

### Step 2: Install Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs
node --version  # Should show v20.x.x
```

### Step 3: Install PostgreSQL
```bash
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# Set postgres password
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'your_strong_password';"

# Create DB and run schema
sudo -u postgres psql -c "CREATE DATABASE hrms_db;"
sudo -u postgres psql -d hrms_db -f /path/to/database/schema.sql
sudo -u postgres psql -d hrms_db -f /path/to/database/seed.sql
```

### Step 4: Install Nginx
```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

### Step 5: Install PM2
```bash
npm install -g pm2
```

### Step 6: Upload Project Files
From your local machine:
```bash
# Using SCP
scp -r ./hrms root@YOUR_SERVER_IP:/var/www/hrms

# OR using rsync
rsync -avz ./hrms root@YOUR_SERVER_IP:/var/www/hrms
```

### Step 7: Build Frontend
```bash
cd /var/www/hrms/frontend
npm install
npm run build
# Creates /var/www/hrms/frontend/dist/
```

### Step 8: Setup Backend
```bash
cd /var/www/hrms/backend
npm install --production
cp .env.example .env
nano .env   # Edit with production values
```

Production `.env`:
```
PORT=5000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hrms_db
DB_USER=postgres
DB_PASSWORD=your_strong_password
JWT_SECRET=use_a_long_random_string_here_64_chars_minimum
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=https://yourdomain.com
```

### Step 9: Start with PM2
```bash
cd /var/www/hrms/backend
pm2 start server.js --name "hrms-api"
pm2 save
pm2 startup   # Follow the printed command to auto-start on reboot
```

---

## 3. Nginx Configuration <a name="nginx"></a>

```bash
nano /etc/nginx/sites-available/hrms
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend (React build)
    location / {
        root /var/www/hrms/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API Proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploaded files
    location /uploads {
        proxy_pass http://localhost:5000/uploads;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    client_max_body_size 20M;
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/hrms /etc/nginx/sites-enabled/
nginx -t          # Test config
systemctl reload nginx
```

---

## 4. SSL Certificate (HTTPS) <a name="ssl"></a>

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get certificate (replace with your domain)
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up automatically
# Test renewal:
certbot renew --dry-run
```

---

## 5. PM2 Management <a name="pm2"></a>

```bash
# View running processes
pm2 list

# View logs
pm2 logs hrms-api

# Restart
pm2 restart hrms-api

# Stop
pm2 stop hrms-api

# Monitor
pm2 monit
```

### Ecosystem config (advanced)
Create `/var/www/hrms/ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'hrms-api',
    script: 'backend/server.js',
    cwd: '/var/www/hrms',
    instances: 'max',        // Use all CPU cores
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000,
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: '/var/log/hrms/error.log',
    out_file: '/var/log/hrms/out.log',
  }]
};
```

Run with: `pm2 start ecosystem.config.js --env production`

---

## 6. Docker Deployment <a name="docker"></a>

### docker-compose.yml (save in project root)
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: hrms_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_strong_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
      - ./database/seed.sql:/docker-entrypoint-initdb.d/02-seed.sql
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      NODE_ENV: production
      PORT: 5000
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: hrms_db
      DB_USER: postgres
      DB_PASSWORD: your_strong_password
      JWT_SECRET: your_jwt_secret_here
    ports:
      - "5000:5000"
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Backend Dockerfile (`backend/Dockerfile`):
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

### Frontend Dockerfile (`frontend/Dockerfile`):
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Run with Docker:
```bash
docker compose up -d
docker compose logs -f
```

---

## 7. Troubleshooting <a name="troubleshooting"></a>

### Backend not starting
```bash
pm2 logs hrms-api
# Check .env file is correct
# Verify PostgreSQL is running: systemctl status postgresql
```

### Database connection error
```bash
psql -U postgres -h localhost -d hrms_db
# If fails, check pg_hba.conf:
nano /etc/postgresql/14/main/pg_hba.conf
# Change 'peer' to 'md5' for local connections
systemctl restart postgresql
```

### Frontend 404 on refresh
Make sure Nginx `try_files` includes `/index.html` fallback:
```nginx
try_files $uri $uri/ /index.html;
```

### Port already in use
```bash
lsof -i :5000  # Find what's using port 5000
kill -9 PID    # Kill it
```

### CORS errors
Update `ALLOWED_ORIGINS` in `.env`:
```
ALLOWED_ORIGINS=https://yourdomain.com
```

---

## 🔐 Security Checklist for Production

- [ ] Change default JWT_SECRET to a long random string
- [ ] Change default DB password
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS with SSL certificate
- [ ] Set up firewall (ufw): `ufw allow 22,80,443/tcp && ufw enable`
- [ ] Regular PostgreSQL backups: `pg_dump hrms_db > backup_$(date +%Y%m%d).sql`
- [ ] Configure log rotation
- [ ] Use environment variables — never commit .env files

---

## 📁 Final File Structure

```
hrms/
├── database/
│   ├── schema.sql          ← All table definitions
│   └── seed.sql            ← Sample data
├── backend/
│   ├── config/
│   │   └── database.js     ← PostgreSQL connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── employeeController.js
│   │   ├── leaveController.js
│   │   ├── attendanceController.js
│   │   ├── payrollController.js
│   │   ├── helpdeskController.js
│   │   └── recruitmentController.js
│   ├── middleware/
│   │   └── auth.js         ← JWT middleware
│   ├── routes/
│   │   └── index.js        ← All API routes
│   ├── .env.example
│   ├── package.json
│   └── server.js           ← Entry point
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── Layout/     ← Sidebar, Topbar, Layout
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Employees.jsx
    │   │   ├── EmployeeDetail.jsx
    │   │   ├── Attendance.jsx
    │   │   ├── Leave.jsx
    │   │   ├── Payroll.jsx
    │   │   ├── Recruitment.jsx
    │   │   ├── Performance.jsx
    │   │   ├── Helpdesk.jsx
    │   │   ├── Reports.jsx
    │   │   ├── Settings.jsx
    │   │   └── MyProfile.jsx
    │   ├── services/
    │   │   └── api.js       ← Axios instance
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    ├── postcss.config.js
    └── vite.config.js
```
