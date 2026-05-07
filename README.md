# Server Monitor

A full-stack server monitoring system with WhatsApp alerts, SSL/Domain expiry tracking, and analytics dashboard.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Recharts, Socket.io-client |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| WhatsApp | whatsapp-web.js (via Puppeteer + Chrome) |
| Process Manager | PM2 |
| Fonts | Google Fonts (Inter, Poppins) |

---

## Project Structure

```
server-monitor/
├── backend/                    # Express API server
│   ├── models/
│   │   ├── Server.js           # Server schema (url, status, history, ssl/domain expiry)
│   │   ├── Recipient.js        # Alert recipient schema (name, phone, servers)
│   │   └── Alert.js            # Alert history schema
│   ├── routes/
│   │   ├── servers.js          # CRUD + check-now + history endpoints
│   │   ├── recipients.js       # CRUD endpoints
│   │   ├── alerts.js           # Alert history endpoint
│   │   ├── whatsapp.js         # WhatsApp status endpoint
│   │   └── expiry.js           # SSL + Domain check endpoint
│   ├── services/
│   │   ├── monitor.js          # Core monitoring loop (every 60s)
│   │   ├── whatsapp.js         # WhatsApp bot (LocalAuth + Puppeteer)
│   │   └── expiry.js           # SSL (TLS) + Domain (api.whois.vu) checker
│   ├── server.js               # Express app entry point
│   └── .env                    # Environment variables (not committed)
│
├── frontend/                   # React app
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.js    # Site cards with status + modal detail
│   │   │   ├── Charts.js       # Analytics (response time, uptime, alerts)
│   │   │   ├── Servers.js      # Add/edit/delete servers
│   │   │   ├── Recipients.js   # Add/edit recipients + site assignment
│   │   │   ├── Alerts.js       # Alert history with search/filter
│   │   │   ├── DomainSSL.js    # SSL & domain expiry table
│   │   │   └── WhatsApp.js     # WhatsApp connection + QR scan
│   │   ├── api.js              # Axios API calls
│   │   ├── App.js              # Router + navbar + footer
│   │   └── App.css             # Global styles
│   └── public/
│       └── index.html          # Google Fonts loaded here
│
└── README.md
```

---

## Features

- **Site Monitoring** — HTTP status check every 60 seconds (200/301/302 = UP)
- **WhatsApp Alerts** — Instant alert when site goes DOWN, recovery alert when back UP
- **Email Alerts (SMTP)** — Beautiful HTML email alerts via Gmail SMTP — DOWN, RECOVERED, SSL expiry
- **Dual Alerts** — WhatsApp + Email both work together per recipient
- **Multiple Recipients** — Each recipient can have phone, email or both; assign to specific sites or all sites
- **SSL Expiry** — Auto-checked via TLS, alerts at 30 / 15 / 7 days before expiry
- **Domain Expiry** — Auto-checked via [api.whois.vu](https://api.whois.vu), alerts at 30 / 15 / 7 days
- **Analytics** — Response time graph, uptime %, alert frequency charts
- **Search & Filter** — All pages have search and filter functionality
- **Alert History** — Full log of all DOWN/RECOVERED events

---

## Setup

### Prerequisites

- Node.js v18+
- Google Chrome (`/usr/bin/google-chrome`)
- PM2 (`npm install -g pm2`)
- MongoDB Atlas account

### Install Node.js (Ubuntu/EC2)

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v
```

### Install Google Chrome (Ubuntu/EC2)

> Required for WhatsApp Web automation via Puppeteer

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo apt install -y ./google-chrome-stable_current_amd64.deb
google-chrome --version
```

### Install PM2

```bash
npm install -g pm2
```

### 1. Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env` (use `.env.example` as reference):
```env
PORT=5001
FRONTEND_URL=http://localhost:3001
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxx.mongodb.net/monitor_server_prd

# SMTP Email Config (Gmail)
MAIL_USER=your@gmail.com
MAIL_PASS=your_app_password
MAIL_FROM=Server Monitor <your@gmail.com>

# WhatsApp Session Path (optional)
# WA_SESSION_PATH=/home/ubuntu/server-monitor-site/.ww-session
```

#### Gmail App Password Setup (for SMTP)

> Gmail direct password nahi chalega — App Password banana padega

1. Gmail account mein jaao → **Google Account Settings**
2. **Security** → **2-Step Verification** ON karo
3. **App Passwords** → Select app: `Mail` → Select device: `Other` → `Server Monitor`
4. Generated 16-digit password `.env` mein `MAIL_PASS` mein daalo

### 2. Frontend Setup

```bash
cd frontend
npm install
```

### 3. Run with PM2

```bash
# Start backend
cd backend
pm2 start server.js --name "monitor-backend"

# Start frontend
cd frontend
PORT=3001 pm2 start "npm start" --name "monitor-frontend"

# Save processes
pm2 save
```

### 4. WhatsApp Setup

1. Open `http://localhost:3001/whatsapp`
2. Scan the QR code with WhatsApp → Linked Devices → Link a Device
3. Session saves automatically — no re-scan needed after restart

---

## URLs

| Service | URL |
|---------|-----|
| Dashboard | http://localhost:3001 |
| Backend API | http://localhost:5001/api |

---

## PM2 Commands

```bash
pm2 list                        # View all processes
pm2 logs monitor-backend        # View backend logs
pm2 restart monitor-backend     # Restart backend
pm2 restart monitor-frontend    # Restart frontend
```

---

## WhatsApp Alert Examples

**Site Down:**
```
🚨 Site Down Alert!
Site: kandb-main
URL: https://maintenance.kandbnetservice.in
Time: 7/5/2026, 6:30:00 pm
Site is currently DOWN ❌
Please check immediately!
```

**SSL Expiry (15 days left):**
```
⚠️ SSL Certificate Alert!
Site: kandb-main
Expires: Wed Aug 04 2026
Days Left: 15 days
Please renew the SSL certificate before it expires!
```

---

## Managed by

**Narendra Singh** — DevOps Engineer
