# BMS - Business Management System

A full-stack web application for managing business compliance workflows, KYC (Know Your Customer), and BRA (Business Risk Assessment) processes.

## Tech Stack

### Backend
- Node.js + Express.js
- MongoDB with Mongoose ODM
- JWT Authentication
- Cloudinary for file storage
- Node-cron for scheduled tasks

### Frontend
- React 18 + Vite
- Tailwind CSS
- Framer Motion
- React Router v6
- Axios

## Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB
- Cloudinary account

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env  # Configure your environment variables
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Features

### Core Features
- User Management with Role-Based Access Control
- Job Lifecycle Management (Create, Approve, Assign, Complete)
- KYC & BRA Workflow Processing
- Multi-level Approval System (LMRO, DLMRO, CEO)
- Document Management with Cloudinary integration
- Real-time Notifications

### Service-Role System
- Services can be associated with specific roles
- Role-based filtering for job creation
- My Role Clients page shows clients based on accessible services

### Admin Features
- All Jobs management (admin only)
- All Clients view (admin only)
- Service management with role assignments
- User and Role management

### Document Library
- Automatic document archiving (10-year retention)
- Search and filter functionality
- Grid and list view options
- Admin-only delete functionality

### Account Management
- Payment tracking
- Invoice management
- Financial reports

## Project Structure

```
BMS_New/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth, error handling
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utilities
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── pages/          # Application pages
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React Context
│   │   └── utils/          # API services
│   └── vite.config.js
└── CLAUDE.md               # AI assistant instructions
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/auth` | Authentication |
| `/api/jobs` | Job management |
| `/api/kyc` | KYC workflows |
| `/api/bra` | BRA workflows |
| `/api/clients` | Client operations |
| `/api/users` | User management |
| `/api/roles` | Role management |
| `/api/services` | Service management |
| `/api/notifications` | Notifications |
| `/api/account` | Account management |

## Environment Variables

### Backend (.env)
```
MONGO_URI=mongodb://localhost:27017/bms_db
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend (.env)
```
VITE_BACKEND_URL=http://localhost:5000/api
```

## Development

- Backend runs on port 5000
- Frontend runs on port 5173
- Hot reload enabled for both

## License

Private - All rights reserved
