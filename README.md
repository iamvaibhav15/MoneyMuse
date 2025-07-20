## Working Demo Video

https://youtu.be/NGrGpRZUK8A

---------------------------------------------------------------------------------

## Personal Finance Assistant

A comprehensive full-stack web application for tracking and managing personal finances, built with Next.js, Express.js, and MongoDB.

## Features

### Core Features
- **User Authentication**: Secure login with Google OAuth and email/password
- **Transaction Management**: Create, read, update, and delete income and expense transactions
- **Date Range Filtering**: View transactions by specific time periods
- **Financial Analytics**: Interactive charts and graphs showing spending patterns
- **Receipt Upload**: Upload and store receipt images/PDFs with transactions
- **Category Management**: Custom categories for organizing transactions
- **Multi-user Support**: Secure data isolation between users

### Bonus Features
- **Pagination**: Efficient data loading with paginated transaction lists
- **Real-time Statistics**: Dynamic financial summaries and insights
- **Responsive Design**: Mobile-first approach with excellent UX across devices
- **Data Visualization**: Charts for expense categories and monthly trends

## Technology Stack

### Frontend
- **Next.js 14**: React framework with SSR and static generation
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client for API communication
- **Lucide React**: Beautiful icon library

### Backend
- **Express.js**: Node.js web framework
- **MongoDB**: NoSQL database with Mongoose ODM
- **JWT**: JSON Web Tokens for authentication
- **Google OAuth**: Google Identity Services integration
- **Multer**: File upload handling
- **bcryptjs**: Password hashing
- **Express Validator**: Request validation
- **Rate Limiting**: API protection

### Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS configuration
- Secure file uploads
- Environment variable protection

# Installation and Setup

## Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- Google OAuth credentials (for Google login)

## 1. Clone the Repository
```bash
git clone <repository-url>
cd MoneyMuse
```

## 2. Install Dependencies
```bash
cd client && npm install && cd../server && npm install
```
```bash
cd ..
```

## 3. Environment Configuration

## Server Environment (.env in server folder)
```env
MONGODB_URI=mongodb://localhost:27017/personal-finance
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

## Client Environment (.env.local in client folder)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

### 4. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add Authorised JavaScript origins URIs:
   - `http://localhost:3000` (for development)
   - `hhtp://localhost:5000`
6. Authorised redirect URIs
    - `http://localhost:5000/api/auth/callback` (for development)
7. Copy Client ID and Client Secret to environment variables

### 5. Database Setup
- Install MongoDB locally or use MongoDB Atlas
- The application will automatically create collections on first run
- Default categories will be created for new users

### 6. Start the Application
```bash
# Development mode (runs both client and server)
npm run dev

# Or start individually
npm run client  # Frontend on http://localhost:3000
npm run server  # Backend on http://localhost:5000
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register with email/password
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/google` - Google OAuth authentication
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Transaction Endpoints
- `GET /api/transactions` - Get all transactions (with filtering)
- `POST /api/transactions` - Create new transaction
- `GET /api/transactions/:id` - Get specific transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/stats/summary` - Get transaction statistics

### Category Endpoints
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

## File Structure

```
MoneyMuse/
├── client/                 # Next.js frontend
│   ├── components/        # React components
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Next.js pages
│   ├── styles/           # CSS files
│   ├── utils/            # Utility functions
│   └── package.json
├── server/               # Express.js backend
│   ├── middleware/       # Express middleware
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   ├── uploads/          # File uploads directory
│   ├── server.js         # Main server file
│   └── package.json
├── README.md
└── package.json          # Root package.json
```

## Key Features Explained

### 1. Authentication System
- Supports both traditional email/password and Google OAuth
- JWT tokens stored in HTTP-only cookies for security
- Automatic token refresh and logout on expiration

### 2. Transaction Management
- CRUD operations for financial transactions
- File upload support for receipts
- Automatic categorization and tagging
- Date range filtering and pagination

### 3. Data Visualization
- Interactive charts showing spending patterns
- Category-wise expense breakdown
- Monthly trend analysis
- Real-time dashboard updates

### 4. Security Implementation
- Password hashing with bcrypt
- JWT token authentication
- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS and security headers

### Environment Variables for Production
Ensure all environment variables are properly set for production:
- Update MongoDB URI for production database
- Set strong JWT secret
- Configure Google OAuth for production domain
- Set NODE_ENV to 'production'

### Build Commands
```bash
# Build frontend
cd client && npm run build

# Start production server
cd server && npm start
```

## Code Quality Guidelines

The codebase follows these principles:
- **Clean Code**: Descriptive naming, small functions, clear logic
- **Modularity**: Separated concerns, reusable components
- **Error Handling**: Comprehensive error catching and user feedback
- **Documentation**: Clear README and inline comments where needed
- **Security**: Input validation, authentication, and authorization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

Frontend Origional Github Repo ->  https://github.com/iamvaibhav15/FinanceApp_Frontend
Backend Origional Github Repo ->  https://github.com/iamvaibhav15/FinanceApp_Backend
