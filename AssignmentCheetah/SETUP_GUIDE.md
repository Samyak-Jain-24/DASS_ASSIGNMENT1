# Felicity Event Management System - Setup Guide

## Quick Start Guide

### 1. Clone the Repository
```bash
cd AssignmentCheetah
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env with your MongoDB URI and JWT secret
# Required: MONGODB_URI, JWT_SECRET
# Optional: EMAIL credentials for ticket sending

# Start backend server
npm start
# or for development with auto-reload:
npm run dev
```

Backend will run on http://localhost:5000

### 3. Frontend Setup

```bash
# Navigate to frontend (open new terminal)
cd frontend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env with backend API URL
# REACT_APP_API_URL=http://localhost:5000/api

# Start frontend
npm start
```

Frontend will run on http://localhost:3000

### 4. Create Admin Account

Connect to MongoDB and run:

```javascript
use felicity;

// Generate password hash (use bcryptjs)
// For password "admin123", the hash is:
db.admins.insertOne({
  email: "admin@felicity.com",
  password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
  role: "admin",
  createdAt: new Date(),
   updatedAt: new Date()
});
```

Now you can login as admin with:
- Email: admin@felicity.com
- Password: admin123

### 5. Test the Application

1. **Create an Organizer** (as admin):
   - Login as admin
   - Go to "Manage Organizers"
   - Create a new organizer (note the generated credentials!)

2. **Create an Event** (as organizer):
   - Logout and login as the organizer
   - Create a new event with all details
   - Publish the event

3. **Register as Participant**:
   - Logout and register as a new participant
   - Use @iiit.ac.in email for IIIT student
   - Or any email for Non-IIIT participant

4. **Register for Event** (as participant):
   - Browse events
   - Register for the event you created
   - Check your dashboard for the registration

## Deployment Guide

### Backend Deployment on Render

1. Create account on render.com
2. Create New → Web Service
3. Connect GitHub repository
4. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add environment variables (all from .env)
5. Deploy
6. Copy the deployed URL (e.g., https://your-app.onrender.com)

### Frontend Deployment on Vercel

1. Create account on vercel.com
2. Import Git Repository
3. Configure:
   - Framework: Create React App
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Environment Variable: `REACT_APP_API_URL` = your backend URL + /api
4. Deploy
5. Copy the deployed URL

### MongoDB Atlas Setup

1. Create account on mongodb.com/cloud/atlas
2. Create a new cluster (free tier)
3. Create Database User (save credentials)
4. Network Access → Add IP Address → Allow from Anywhere (0.0.0.0/0)
5. Connect → Get connection string
6. Replace <password> and <dbname> in the connection string
7. Use this in backend environment variables

### Update deployment.txt

After deployment, update the deployment.txt file with:
```
Frontend URL: https://your-app.vercel.app
Backend API URL: https://your-api.onrender.com/api
MongoDB Atlas: mongodb+srv://...
```

## Troubleshooting

### Backend won't start
- Check MongoDB connection string is correct
- Ensure all required environment variables are set
- Check if port 5000 is available

### Frontend can't connect to backend
- Verify REACT_APP_API_URL in frontend/.env
- Check backend is running and accessible
- Check CORS is enabled in backend

### Login not working
- Check JWT_SECRET is set in backend
- Verify password hashing is working
- Check network requests in browser DevTools

### Email not sending
- Email is optional for core functionality
- Configure SMTP settings if needed
- Use Gmail App Password, not regular password

## Testing Checklist

### Participant Features
- [ ] Register with IIIT email
- [ ] Register with Non-IIIT email
- [ ] Login as participant
- [ ] Set preferences during onboarding
- [ ] Browse events with filters
- [ ] Register for an event
- [ ] View dashboard with registrations
- [ ] Update profile
- [ ] Follow/unfollow clubs

### Organizer Features
- [ ] Login as organizer
- [ ] Create draft event
- [ ] Publish event
- [ ] View event details
- [ ] See registrations list
- [ ] Export participants CSV
- [ ] View analytics
- [ ] Update profile
- [ ] Add Discord webhook

### Admin Features
- [ ] Login as admin
- [ ] Create organizer account
- [ ] View all organizers
- [ ] Deactivate organizer
- [ ] Reactivate organizer
- [ ] Delete organizer (with no events)
- [ ] View password reset requests

## Assignment Submission

Include in your ZIP file:
- Complete source code (backend and frontend folders)
- README.md with setup instructions
- deployment.txt with deployment URLs
- Screenshots of running application
- .env.example files (NOT actual .env files!)

## Marks Distribution

- Core System Implementation: 70 marks
  - Authentication & Security: 8 marks
  - User Onboarding: 3 marks
  - Data Models: 2 marks
  - Event Types: 2 marks
  - Event Attributes: 2 marks
  - Participant Features: 22 marks
  - Organizer Features: 18 marks
  - Admin Features: 6 marks
  - Deployment: 5 marks

Total: 70 marks

## Contact

For questions or issues:
- Check README.md for detailed documentation
- Review code comments
- Test API endpoints with Postman
- Check browser console for frontend errors
- Check terminal for backend errors

Good luck with your assignment! 🎉
