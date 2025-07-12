# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BMS (Business Management System) is a full-stack web application for managing business compliance workflows, particularly KYC and BRA processes. Built with React + Vite frontend and Node.js + Express + MongoDB backend.

## Development Commands

### Backend (Node.js/Express)
```bash
cd backend
npm install                # Install dependencies
npm run dev                # Start development server with nodemon
npm start                  # Start production server
```

### Frontend (React + Vite)
```bash
cd frontend
npm install                # Install dependencies
npm run dev                # Start development server
npm run build              # Build for production
npm run preview            # Preview production build
npm run lint               # Run ESLint
```

## Environment Setup

### Backend Environment Variables (.env)
```
MONGO_URI=mongodb://localhost:27017/bms_db
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
VITE_FRONTEND_URL=http://localhost:5173
VITE_BACKEND_URL=http://localhost:5000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend Environment Variables (.env)
```
VITE_BACKEND_URL=http://localhost:5000/api
```

## Architecture Overview

### Backend Architecture
- **MVC Pattern**: Controllers handle requests, models define schemas, routes organize endpoints
- **Authentication**: JWT tokens stored in HTTP-only cookies with role-based permissions
- **Database**: MongoDB with Mongoose ODM, complex permission system with nested roles
- **File Uploads**: Multer for temp storage, Cloudinary for permanent cloud storage
- **Business Logic**: Service layer for notifications, KYC workflows, and file handling
- **Scheduled Tasks**: Node-cron for daily expiry notifications at 9:00 AM

### Frontend Architecture
- **React Router v6**: Layout-based route protection with nested routing
- **State Management**: Context API for authentication and user permissions
- **API Layer**: Axios with interceptors, separate instances for file uploads
- **UI Framework**: Tailwind CSS, Headless UI, Framer Motion animations
- **Component Structure**: Layout wrapper with sidebar navigation and protected routes

## Key Workflows

### Job Management
Jobs follow a complex workflow: Pending → Approved → Assigned → KYC/BRA Processing → Multi-level Approvals → Completion

### Permission System
The system uses nested permissions (e.g., `kycManagement.lmro`) with three approval levels:
- LMRO (Local Money Laundering Reporting Officer)
- DLMRO (Deputy Money Laundering Reporting Officer) 
- CEO approval

### File Handling
Files are temporarily stored locally, then uploaded to Cloudinary. Supported types: PDF, DOC, DOCX, XLS, XLSX, JPEG, PNG (50MB limit).

## Database Models

### Core Entities
- **User**: References Role model for permissions
- **Role**: Complex nested permission structure
- **Client**: Basic client information
- **Job**: Central entity with status workflows, timeline tracking, document attachments
- **Notifications**: Real-time system updates

### Schema Patterns
- All models include timestamps (`createdAt`, `updatedAt`)
- ObjectId references with Mongoose populate
- Compound indexes for performance
- Validation at schema level

## API Structure

RESTful endpoints organized by domain:
- `/api/auth` - Authentication
- `/api/jobs` - Job lifecycle management  
- `/api/kyc` - KYC workflow management
- `/api/bra` - BRA workflow management
- `/api/clients` - Client operations
- `/api/users` - User management
- `/api/roles` - Role management
- `/api/operations` - Business operations
- `/api/notifications` - Notification system
- `/api/account` - Account management
- `/api/services` - Service management
- `/api/monthlypayment` - Payment processing
- `/api/financial-documents` - Document management

## Security Considerations

- JWT authentication with HTTP-only cookies
- CORS configured for specific origins
- Role-based access control at route and component level
- File upload validation and sanitization
- bcryptjs password hashing
- Secure file serving with fallback strategies

## Development Notes

- Backend runs on port 5000, frontend on port 5173
- Migration scripts available in `backend/src/migration/`
- Error logging middleware for debugging
- Toast notifications for user feedback
- Real-time notification system with badges
- Excel export/import functionality available
- Daily cron job handles expiry notifications

## File Structure Highlights

### Backend
- `src/controllers/` - Request handlers
- `src/models/` - MongoDB schemas
- `src/routes/` - Express routes
- `src/middleware/` - Authentication, error handling
- `src/services/` - Business logic
- `src/utils/` - Utility functions
- `temp-uploads/` - Temporary file storage

### Frontend  
- `src/pages/` - Main application pages
- `src/components/` - Reusable UI components
- `src/context/` - React Context providers
- `src/utils/` - API services and utilities
- `src/components/Layout.jsx` - Main layout wrapper