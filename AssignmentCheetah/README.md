# Felicity Event Management System

A comprehensive event management platform for IIIT's annual fest, built with the MERN stack (MongoDB, Express.js, React, Node.js).

## 🎯 Features

### For Participants
- **Registration & Authentication**: Secure signup with email validation (IIIT email required for IIIT students)
- **Personalized Dashboard**: View upcoming events, participation history, and registrations
- **Event Browsing**: Search, filter, and browse events with trending recommendations
- **Easy Registration**: One-click registration with instant QR ticket generation
- **Club Following**: Follow favorite clubs and get personalized event recommendations
- **Profile Management**: Update personal information and preferences

### For Organizers
- **Event Creation**: Create normal events or merchandise sales with custom forms
- **Event Management**: Track registrations, attendance, and revenue analytics
- **Participant Management**: Export participant data, mark attendance
- **Dashboard Analytics**: View comprehensive stats on event performance
- **Discord Integration**: Auto-post new events to Discord via webhooks
- **Profile Customization**: Manage organizer profile and contact information

### For Admins
- **Organizer Management**: Create, activate, deactivate, or delete organizer accounts
- **Password Reset Management**: Review and approve password reset requests
- **System Administration**: Full control over clubs and organizers

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcrypt** for password hashing
- **nodemailer** for email notifications
- **qrcode** for ticket generation

### Frontend
- **React** 18 with Hooks
- **React Router** for navigation
- **Axios** for API calls
- **React Toastify** for notifications
- **CSS3** for styling

## 📦 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Git

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key_min_32_characters
JWT_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Optional: Email configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

4. Start the backend server:
```bash
npm start
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the frontend development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## 📝 Default Admin Account

To create the first admin account, insert directly into MongoDB:

```javascript
// Connect to your MongoDB database
use felicity;

// Insert admin user
db.admins.insertOne({
  email: "admin@felicity.com",
  password: "$2a$10$YourHashedPasswordHere",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date()
});
```

Or use bcrypt to hash a password and insert it manually.

## 🚀 Deployment

### Backend Deployment (Render/Railway/Heroku)

1. Create a new web service on your platform
2. Connect your GitHub repository
3. Set environment variables in the platform dashboard
4. Deploy the backend folder
5. Note the deployed API URL

### Frontend Deployment (Vercel/Netlify)

1. Create a new project on Vercel/Netlify
2. Connect your GitHub repository
3. Set build command: `npm run build`
4. Set output directory: `build`
5. Add environment variable:
   - `REACT_APP_API_URL`: Your deployed backend URL
6. Deploy

### Database (MongoDB Atlas)

1. Create a cluster on MongoDB Atlas
2. Create a database user
3. Whitelist your IP (or 0.0.0.0/0 for all IPs)
4. Get the connection string
5. Update backend environment variables

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register/participant` - Register new participant
- `POST /api/auth/login` - Login (participant/organizer/admin)
- `GET /api/auth/me` - Get current user

### Participants
- `GET /api/participants/profile` - Get profile
- `PUT /api/participants/profile` - Update profile
- `PUT /api/participants/preferences` - Update preferences
- `POST /api/participants/follow/:organizerId` - Follow/unfollow organizer

### Events
- `GET /api/events` - Get all events (with filters)
- `GET /api/events/:id` - Get event by ID
- `POST /api/events` - Create event (organizer)
- `PUT /api/events/:id` - Update event (organizer)
- `DELETE /api/events/:id` - Delete event (organizer)

### Registrations
- `POST /api/registrations/:eventId` - Register for event
- `GET /api/registrations` - Get my registrations
- `PUT /api/registrations/:id/cancel` - Cancel registration
- `GET /api/registrations/event/:eventId` - Get event registrations (organizer)
- `PUT /api/registrations/:id/attendance` - Mark attendance (organizer)

### Organizers
- `GET /api/organizers` - Get all organizers
- `GET /api/organizers/:id` - Get organizer by ID
- `GET /api/organizers/me/profile` - Get own profile
- `PUT /api/organizers/me/profile` - Update profile
- `GET /api/organizers/me/analytics` - Get analytics

### Admin
- `POST /api/admin/organizers` - Create organizer
- `GET /api/admin/organizers` - Get all organizers
- `PUT /api/admin/organizers/:id/toggle-active` - Activate/deactivate
- `DELETE /api/admin/organizers/:id` - Delete organizer
- `GET /api/admin/password-resets` - Get reset requests
- `PUT /api/admin/password-resets/:id/approve` - Approve reset
- `PUT /api/admin/password-resets/:id/reject` - Reject reset

## 🔒 Security Features

- Password hashing with bcrypt (10 salt rounds)
- JWT-based authentication with secure token generation
- Role-based access control (RBAC)
- Email validation for IIIT participants
- Protected routes with middleware
- Session management with automatic logout on token expiry

## 📊 Database Models

### Participant
- Personal information (name, email, contact)
- Participant type (IIIT/Non-IIIT)
- College/Organization name
- Areas of interest
- Followed clubs

### Organizer
- Organizer details (name, category, description)
- Contact information
- Discord webhook URL
- Active status
- Created by admin reference

### Event
- Event information (name, description, type)
- Dates and deadlines
- Registration details (limit, fee, count)
- Custom form fields (for normal events)
- Item variants (for merchandise)
- Status (Draft/Published/Ongoing/Completed/Closed)

### Registration
- Event and participant references
- Ticket ID and QR code
- Registration type
- Form data or purchased items
- Payment and attendance status

## 🎨 User Roles & Permissions

### Participant
- ✅ Register and login
- ✅ Browse and search events
- ✅ Register for events
- ✅ View participation history
- ✅ Follow clubs
- ✅ Update profile and preferences

### Organizer
- ✅ Create and manage events
- ✅ View event analytics
- ✅ Manage participants
- ✅ Export participant data
- ✅ Mark attendance
- ✅ Update profile

### Admin
- ✅ Create organizer accounts
- ✅ Activate/deactivate organizers
- ✅ Delete organizers
- ✅ Manage password reset requests
- ✅ Full system access

## 🐛 Known Limitations

- Email sending requires proper SMTP configuration
- QR code scanning requires separate implementation
- File uploads for custom forms not implemented in this version
- Real-time notifications not included

## 👨‍💻 Development

### Running in Development Mode

Backend:
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

Frontend:
```bash
cd frontend
npm start
```

### Building for Production

Backend:
```bash
cd backend
npm start
```

Frontend:
```bash
cd frontend
npm run build
```

## 📄 License

This project is developed as part of the DASS (Design & Analysis of Software Systems) course assignment.

## 👥 Contributors

- [Your Name]
- IIIT Hyderabad

## 📞 Support

For issues or questions:
- Create an issue on GitHub
- Contact: [your-email@iiit.ac.in]

---

**Note**: Update the `deployment.txt` file with actual deployment URLs after deploying the application.
