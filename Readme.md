# 🛸 Edulume - Your Ultimate Learning Hub

_"Where Knowledge Meets Innovation in the Digital Cosmos"_

---

## 🌟 Overview

**Edulume** is a comprehensive, alien-themed educational platform designed specifically for college students. Built with cutting-edge technology and a futuristic design aesthetic, Edulume transforms the way students access, share, and interact with educational content. From PDFs and e-books to interactive courses and AI-powered chatbots, Edulume is your one-stop destination for academic excellence.

### 🎯 Mission Statement

To create an immersive, secure, and collaborative learning environment that empowers students to excel academically while fostering a vibrant community of knowledge sharing.

---

## ✨ Core Features

### 📚 **Resource Library**

- **PDF Repository**: Upload, view, download, and organize thousands of academic PDFs
- **E-book Collection**: Access a vast collection of digital textbooks and reference materials
- **Smart Categorization**: Resources organized by subject, semester, department, and difficulty level
- **Advanced Search**: Powerful search functionality with filters, tags, and semantic search
- **Free Access**: Download any resource without restrictions; upload requires simple registration

### 🎓 **Interactive Courses**

- **AI-Generated Courses**: Create comprehensive courses on any topic using advanced AI (Groq/Llama)
- **Chapter-by-Chapter Learning**: Structured learning paths with detailed content
- **Progress Tracking**: Monitor your learning journey with completion percentages
- **Course Enrollment**: Enroll in courses and track your progress
- **Certificate Tests**: Take comprehensive tests and earn verifiable certificates
- **Multi-Question Types**: MCQ, True/False, Short Answer, Coding, and Situational questions
- **Automated Grading**: Instant feedback with detailed explanations

### 🛣️ **Learning Roadmaps**

- **AI-Powered Roadmaps**: Generate detailed learning paths for any technology or skill
- **Comprehensive Guides**: Include resources, projects, timelines, and career advice
- **Tools & Certifications**: Recommended tools, software, and industry certifications
- **Project Ideas**: Hands-on projects with increasing complexity
- **Community Sharing**: Share and bookmark roadmaps from other users

### 💬 **Discussion Forum**

- **Q&A Platform**: Ask questions and get help from peers and faculty
- **Real-time Interactions**: Live chat with typing indicators and instant notifications
- **Voting System**: Upvote/downvote questions, answers, and replies
- **Best Answer Marking**: Mark the most helpful answers for easy reference
- **Mention System**: Tag other users with @username for direct notifications
- **Thread Replies**: Nested discussions for organized conversations
- **Category Filtering**: Organize discussions by subject, difficulty, and tags

### 🤖 **AI-Powered PDF Chatbot**

- **Document Intelligence**: Upload any PDF and chat with its content
- **RAG Technology**: Retrieval-Augmented Generation for accurate responses
- **Vector Embeddings**: Uses Pinecone vector database for semantic search
- **Session Management**: Maintain conversation context throughout the session
- **Multi-PDF Support**: Handle multiple documents in different sessions
- **Smart Cleanup**: Automatic embedding cleanup to manage storage

### 🔐 **Authentication & Security**

- **JWT-Based Authentication**: Secure token-based user sessions
- **OTP Verification**: Email-based OTP for signup and password reset
- **Role-Based Access**: Admin panel with comprehensive management features
- **Secure File Uploads**: Protected file upload with validation
- **Session Management**: Automatic session cleanup and security monitoring

### 📱 **User Experience**

- **Alien Theme**: Futuristic, space-themed UI with glowing elements
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark Mode**: Eye-friendly dark interface with neon accents
- **Real-time Updates**: WebSocket integration for live notifications
- **Progressive Web App**: Fast loading with offline capabilities
- **Accessibility**: WCAG-compliant design for inclusive access

### 🏆 **Gamification & Certificates**

- **Achievement System**: Earn badges for various activities
- **Certificate Generation**: Downloadable certificates with QR verification
- **Leaderboards**: Compete with peers in learning challenges
- **Progress Tracking**: Visual progress indicators and statistics
- **Social Sharing**: Share achievements on social platforms

### 🔔 **Notification System**

- **Real-time Notifications**: Instant alerts for mentions, replies, and updates
- **Email Integration**: Important notifications sent via email
- **Notification Center**: Centralized notification management
- **Customizable Alerts**: Choose what notifications to receive
- **Push Notifications**: Browser push notifications for engagement

---

## 🏗️ Technical Architecture

### 🎨 **Frontend Stack**

- **Framework**: React 19.1.1 with TypeScript
- **Styling**: Tailwind CSS 4.1.12 with custom alien theme
- **Build Tool**: Vite 7.1.2 for lightning-fast development
- **Routing**: React Router DOM 7.8.1 for SPA navigation
- **Animations**: Framer Motion 12.23.12 for smooth transitions
- **Code Editor**: Monaco Editor integration for coding questions
- **PDF Viewer**: Custom PDF viewer with zoom and navigation
- **Markdown**: React Markdown for rich content rendering
- **Icons**: Lucide React for consistent iconography
- **Real-time**: Socket.IO client for live updates

### ⚙️ **Backend Stack**

- **Runtime**: Node.js with Express.js framework
- **Database**: MongoDB with Prisma ORM for type-safe queries
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Storage**: AWS S3 and Vercel Blob for scalable file management
- **Email Service**: Nodemailer with SMTP integration
- **WebSockets**: Socket.IO for real-time communication
- **API Architecture**: RESTful APIs with middleware-based security

### 🧠 **AI & Machine Learning**

- **Language Models**: Groq API with Llama 3.3 70B for content generation
- **Vector Database**: Pinecone for semantic search and embeddings
- **Embeddings**: Google Generative AI embeddings (768 dimensions)
- **Document Processing**: LangChain for PDF text extraction and chunking
- **RAG Pipeline**: Advanced Retrieval-Augmented Generation system

### 🐍 **Python Backend (AI Services)**

- **Framework**: FastAPI for high-performance API endpoints
- **Document Processing**: PDF upload and text extraction
- **Vector Storage**: Pinecone integration for embeddings
- **Session Management**: User session handling for chat contexts
- **Cloud Storage**: Cloudinary for PDF storage and retrieval

### 🚀 **Deployment & DevOps**

- **Frontend**: Vercel with automatic deployments
- **Backend**: Node.js server (compatible with Vercel, Railway, or AWS)
- **Python Services**: FastAPI deployment (can be containerized)
- **Database**: MongoDB Atlas for cloud database
- **CDN**: Integrated CDN for fast global content delivery
- **Environment Management**: Secure environment variable handling

---

## 📁 Project Structure

```
Eedulume/
├── client/                     # React Frontend Application
│   ├── src/
│   │   ├── components/         # Reusable React components
│   │   │   ├── admin/         # Admin panel components
│   │   │   ├── ai/            # AI chatbot interface
│   │   │   ├── auth/          # Authentication forms
│   │   │   ├── courses/       # Course management & tests
│   │   │   ├── discussions/   # Forum & Q&A components
│   │   │   ├── feedback/      # Bug reports & suggestions
│   │   │   ├── layout/        # Navigation & page layout
│   │   │   ├── resources/     # PDF & ebook management
│   │   │   ├── roadmaps/      # Learning roadmap features
│   │   │   └── ui/            # UI utilities & common components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API service functions
│   │   ├── types/             # TypeScript type definitions
│   │   ├── utils/             # Utility functions
│   │   └── pages/             # Page components
│   ├── public/                # Static assets
│   └── package.json           # Dependencies & scripts
├── server/                     # Node.js Backend API
│   ├── routes/                # API route handlers
│   │   ├── auth.js           # User authentication
│   │   ├── courses.js        # Course management
│   │   ├── discussions.js    # Forum functionality
│   │   ├── pdfs.js           # PDF operations
│   │   ├── ebooks.js         # E-book management
│   │   ├── roadmaps.js       # Learning roadmaps
│   │   ├── feedback.js       # User feedback
│   │   └── pdfChat.js        # AI chatbot endpoints
│   ├── middleware/            # Express middleware
│   ├── socket/                # WebSocket handlers
│   ├── utils/                 # Server utilities
│   └── lib/                   # Database configuration
└── python-backend/             # Python AI Services
    ├── RAGresponse/           # RAG chatbot logic
    ├── fileUpload/            # PDF processing
    ├── sessionCleanup/       # Session management
    └── main.py                # FastAPI application
```

---

## 🚀 Getting Started

### 📋 Prerequisites

- **Node.js** >= 18.0.0
- **Python** >= 3.8
- **MongoDB** (Atlas or local)
- **npm** or **yarn**
- **Git**

### 🔧 Environment Setup

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd Edulume
```

#### 2. Backend Environment Variables

Create `.env` file in the `server/` directory:

```env
# Database
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/edulume"

# Authentication
JWT_SECRET="your-super-secret-jwt-key"

# AI Services
GROQ_API_KEY="your-groq-api-key"

# File Storage
VERCEL_BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"

# Email Service (Optional)
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
EMAIL_FROM="Edulume <noreply@edulume.com>"

# Server Configuration
PORT=3001
NODE_ENV="development"
CLIENT_ORIGIN="http://localhost:5173"
```

#### 3. Python Backend Environment Variables

Create `.env` file in the `python-backend/` directory:

```env
# AI Services
PINECONE_API_KEY="your-pinecone-api-key"
PINECONE_INDEX_NAME="edulume-embeddings"
PINECONE_ENVIRONMENT="your-pinecone-environment"
GOOGLE_API_KEY="your-google-ai-api-key"

# Cloud Storage
CLOUDINARY_CLOUD_NAME="your-cloudinary-name"
CLOUDINARY_API_KEY="your-cloudinary-key"
CLOUDINARY_API_SECRET="your-cloudinary-secret"
```

#### 4. Frontend Environment Variables

Create `.env` file in the `client/` directory:

```env
VITE_API_URL="http://localhost:3001/api"
VITE_PYTHON_API_URL="http://localhost:8000"
```

### 📦 Installation

#### Install Node.js Dependencies

```bash
# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../server
npm install
```

#### Install Python Dependencies

```bash
cd ../python-backend
pip install -r requirements.txt
# Or if using virtual environment:
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install fastapi uvicorn python-dotenv langchain pinecone-client google-generativeai cloudinary
```

#### Database Setup

```bash
# Generate Prisma client
cd server
npx prisma generate

# Push database schema (for development)
npx prisma db push

# Optional: View database in Prisma Studio
npx prisma studio
```

### 🏃‍♂️ Running the Application

#### Development Mode

**Terminal 1 - Backend Server:**

```bash
cd server
npm run dev
# Server runs on http://localhost:3001
```

**Terminal 2 - Python AI Services:**

```bash
cd python-backend
uvicorn main:app --reload --port 8000
# AI services run on http://localhost:8000
```

**Terminal 3 - Frontend:**

```bash
cd client
npm run dev
# Frontend runs on http://localhost:5173
```

#### Production Build

```bash
# Build frontend
cd client
npm run build

# Start production server
cd ../server
npm start
```

---

## 🌐 API Documentation

### 🔐 Authentication Endpoints

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Reset password with OTP
- `POST /api/auth/send-otp` - Send OTP for verification
- `POST /api/auth/verify-otp` - Verify OTP

### 📚 Resource Management

- `GET /api/pdfs` - List all PDFs with filters
- `POST /api/upload` - Upload new resources
- `GET /api/ebooks` - Browse e-book collection
- `DELETE /api/pdfs/:id` - Delete resources (admin)

### 🎓 Course Management

- `GET /api/courses` - List courses with pagination
- `GET /api/courses/:id` - Get course details
- `POST /api/courses` - Create new course
- `POST /api/courses/generate-outline` - AI course generation
- `POST /api/courses/:id/enroll` - Enroll in course
- `POST /api/courses/:courseId/chapters/:chapterId/generate-content` - Generate chapter content
- `POST /api/courses/:id/bookmark` - Bookmark course

### 💬 Discussion Forum

- `GET /api/discussions` - List discussions
- `GET /api/discussions/:id` - Get discussion details
- `POST /api/discussions` - Create discussion
- `POST /api/discussions/:id/answers` - Add answer
- `POST /api/discussions/answers/:answerId/replies` - Add reply
- `POST /api/discussions/:id/vote` - Vote on discussion
- `POST /api/discussions/answers/:answerId/best` - Mark best answer

### 🛣️ Roadmap Features

- `GET /api/roadmaps` - List learning roadmaps
- `GET /api/roadmaps/:id` - Get roadmap details
- `POST /api/roadmaps/generate` - AI roadmap generation
- `POST /api/roadmaps` - Create roadmap
- `POST /api/roadmaps/:id/bookmark` - Bookmark roadmap

### 🤖 AI Chatbot

- `POST /api/pdf-chat/sessions` - Create chat session
- `POST /api/pdf-chat/messages` - Send message
- `GET /api/pdf-chat/history` - Get chat history
- `DELETE /api/pdf-chat/sessions/:id` - Delete session

### 🐍 Python AI Services

- `POST /upload` - Upload PDF for processing
- `POST /query` - Query document with RAG
- `POST /cleanup` - Clean up embeddings

---

## 🎨 Design System

### 🎨 Color Palette

```css
/* Primary Colors */
--royal-black: #0A0A0A      /* Main background */
--smoke-gray: #1A1A1A       /* Card backgrounds */
--smoke-light: #2A2A2A      /* Borders and dividers */
--alien-green: #00FF88      /* Primary accent */

/* Text Colors */
--text-primary: #FFFFFF     /* Primary text */
--text-secondary: #B0B0B0   /* Secondary text */
--text-muted: #808080       /* Muted text */

/* Status Colors */
--success: #00FF88          /* Success states */
--warning: #FFB800          /* Warning states */
--error: #FF4444            /* Error states */
--info: #00AAFF             /* Information */
```

### 🔤 Typography

- **Primary Font**: Fredoka (Google Fonts)
- **Monospace**: Monaco, Consolas, 'Courier New'
- **Font Sizes**: Responsive scale from 12px to 48px

### 🎭 UI Components

- **Buttons**: Glowing hover effects with alien-green accents
- **Cards**: Dark smoke-gray backgrounds with subtle borders
- **Modals**: Overlay design with backdrop blur
- **Forms**: Consistent styling with focus states
- **Loading**: Animated spinners and progress bars

---

## 🔧 Configuration

### 🌐 Environment Variables

| Variable                       | Description               | Required |
| ------------------------------ | ------------------------- | -------- |
| `DATABASE_URL`                 | MongoDB connection string | ✅       |
| `JWT_SECRET`                   | Secret key for JWT tokens | ✅       |
| `GROQ_API_KEY`                 | Groq AI API key           | ✅       |
| `PINECONE_API_KEY`             | Pinecone vector DB key    | ✅       |
| `GOOGLE_API_KEY`               | Google AI API key         | ✅       |
| `VERCEL_BLOB_READ_WRITE_TOKEN` | File storage token        | ❌       |
| `EMAIL_USER`                   | SMTP email user           | ❌       |
| `EMAIL_PASS`                   | SMTP email password       | ❌       |

### ⚙️ Feature Flags

- **OTP Verification**: Can be disabled for development
- **AI Features**: Configurable AI model selection
- **File Upload**: Multiple storage options (S3, Vercel Blob)
- **Email Notifications**: Optional email integration

---

## 🧪 Testing

### 🔍 Testing Strategy

- **Unit Tests**: Component and function testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full user journey testing
- **Performance Tests**: Load and stress testing

### 🚀 Test Commands

```bash
# Run frontend tests
cd client
npm test

# Run backend tests
cd server
npm test

# Run E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

---

## 📈 Performance Optimization

### ⚡ Frontend Optimizations

- **Code Splitting**: Lazy loading for route components
- **Image Optimization**: WebP format with lazy loading
- **Bundle Analysis**: Webpack bundle analyzer integration
- **Caching**: Service worker for offline functionality
- **Compression**: Gzip compression for static assets

### 🔧 Backend Optimizations

- **Database Indexing**: Optimized MongoDB indexes
- **Query Optimization**: Efficient Prisma queries
- **Caching**: Redis caching for frequent queries
- **Rate Limiting**: API rate limiting for security
- **Connection Pooling**: Database connection optimization

### 🤖 AI Performance

- **Vector Caching**: Pinecone index optimization
- **Embedding Efficiency**: Batch processing for embeddings
- **Response Streaming**: Real-time response streaming
- **Session Management**: Optimized session cleanup
- **Model Selection**: Dynamic model selection based on load

---

## 🔒 Security Features

### 🔐 Authentication Security

- **JWT Tokens**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Session Management**: Automatic token expiration
- **OTP Verification**: Two-factor authentication option
- **Rate Limiting**: Brute force protection

### 🛡️ Data Protection

- **Input Validation**: Comprehensive input sanitization
- **SQL Injection**: Prisma ORM protection
- **XSS Prevention**: Content Security Policy headers
- **CORS Configuration**: Secure cross-origin requests
- **File Upload Security**: Type validation and size limits

### 🔍 Monitoring

- **Error Tracking**: Comprehensive error logging
- **Access Logs**: Request logging and monitoring
- **Security Headers**: Helmet.js security headers
- **Health Checks**: System health monitoring

---

## 📊 Analytics & Monitoring

### 📉 User Analytics

- **Usage Statistics**: Page views, user engagement
- **Feature Adoption**: Track feature usage patterns
- **Performance Metrics**: Response times, error rates
- **User Journey**: Conversion funnel analysis

### 🔍 System Monitoring

- **Server Health**: CPU, memory, disk usage
- **Database Performance**: Query execution times
- **AI Service Metrics**: Model response times
- **Error Tracking**: Real-time error monitoring

---

## 🌐 Deployment Options

### ☁️ Cloud Deployment

#### Vercel (Recommended for Frontend)

```bash
# Deploy frontend to Vercel
cd client
npm run build
vercel --prod
```

#### Railway (Backend)

```bash
# Deploy backend to Railway
cd server
railway deploy
```

#### AWS (Full Stack)

- **EC2**: Server deployment
- **RDS**: Database hosting
- **S3**: File storage
- **CloudFront**: CDN distribution

### 🐳 Docker Deployment

```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### 🏠 Self-Hosted

- **Server Requirements**: 2GB RAM, 20GB storage
- **Node.js**: Version 18 or higher
- **MongoDB**: Local or cloud instance
- **Python**: For AI services
- **Nginx**: Reverse proxy configuration

---

## 🛠️ Maintenance & Updates

### 🔄 Regular Updates

- **Dependencies**: Weekly dependency updates
- **Security Patches**: Immediate security updates
- **Feature Releases**: Monthly feature deployments
- **Database Migrations**: Automated schema updates

### 🧩 Backup Strategy

- **Database Backups**: Daily automated backups
- **File Storage**: Redundant file storage
- **Configuration**: Environment variable backups
- **Code Repository**: Git-based version control

### 📊 Monitoring & Alerts

- **Uptime Monitoring**: 24/7 availability tracking
- **Performance Alerts**: Threshold-based notifications
- **Error Notifications**: Real-time error alerts
- **Capacity Planning**: Resource usage forecasting

---

## 📚 API Rate Limits

| Endpoint Category | Rate Limit   | Window     |
| ----------------- | ------------ | ---------- |
| Authentication    | 5 requests   | 15 minutes |
| File Upload       | 10 requests  | 1 hour     |
| AI Generation     | 20 requests  | 1 hour     |
| General API       | 100 requests | 15 minutes |
| Search            | 50 requests  | 1 minute   |

---

## 🌍 Internationalization

### 🌏 Language Support

- **English**: Primary language
- **Spanish**: Planned support
- **French**: Planned support
- **German**: Planned support
- **Japanese**: Planned support

### 🌐 Localization Features

- **Date Formatting**: Region-specific date formats
- **Number Formatting**: Locale-specific number display
- **Currency**: Multi-currency support
- **Time Zones**: Automatic timezone detection

---

## 🔥 Contributing

### 👥 How to Contribute

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### 📋 Contribution Guidelines

- **Code Style**: Follow ESLint and Prettier configurations
- **Testing**: Include tests for new features
- **Documentation**: Update documentation for changes
- **Commits**: Use conventional commit messages
- **Issues**: Report bugs using issue templates

### 🏆 Recognition

Contributors are recognized in:

- **README Contributors**: Listed in the contributors section
- **Release Notes**: Mentioned in feature releases
- **Hall of Fame**: Special recognition page

---

## 🐛 Known Issues & Limitations

### ⚠️ Current Limitations

- **File Size**: PDF uploads limited to 50MB
- **Concurrent Users**: Optimized for up to 1000 concurrent users
- **AI Responses**: Response time varies based on document size
- **Browser Support**: Modern browsers only (Chrome 90+, Firefox 88+)

### 🕰️ Roadmap Items

- **Mobile App**: Native iOS/Android applications
- **Offline Mode**: Full offline functionality
- **Video Support**: Video lecture integration
- **Live Sessions**: Real-time virtual classrooms
- **Advanced Analytics**: Detailed learning analytics

---

## 📝 Changelog

### Version 2.0.0 (Current)

- ✨ **New**: AI-powered course generation
- ✨ **New**: Learning roadmaps with AI
- ✨ **New**: PDF chatbot with RAG
- ✨ **New**: Certificate system
- ✨ **New**: Real-time discussions
- 🐛 **Fixed**: Performance optimizations
- 🐛 **Fixed**: Mobile responsiveness

### Version 1.5.0

- ✨ **New**: Discussion forum
- ✨ **New**: User notifications
- ✨ **New**: Advanced search
- 🐛 **Fixed**: Authentication issues

### Version 1.0.0

- ✨ **Initial**: PDF and e-book sharing
- ✨ **Initial**: User authentication
- ✨ **Initial**: Basic file management

---

## 📞 Support & Community

### 🎆 Get Help

- **Email Support**: tarinagarwal@gmail.com
- **Bug Reports**: GitHub issues
- **Feature Requests**: GitHub discussions

---

## 🏆 Acknowledgments

### 🚀 Technologies Used

- **React Team**: For the amazing React framework
- **Vercel**: For deployment and hosting solutions
- **Prisma**: For the excellent ORM
- **Tailwind CSS**: For the utility-first CSS framework
- **Groq**: For AI language model API
- **Pinecone**: For vector database services
- **MongoDB**: For reliable database solutions

### 🎆 Special Thanks

- **Open Source Community**: For the incredible tools and libraries
- **Beta Testers**: For valuable feedback and bug reports
- **Design Inspiration**: From modern space and alien-themed UIs
- **Educational Community**: For insights into learning platforms

---

## 📜 License

```
MIT License

Copyright (c) 2024 Edulume

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🌠 Final Words

**Edulume** represents the future of educational technology - where AI meets human curiosity, where knowledge transcends boundaries, and where learning becomes an adventure through the cosmos of information.

Built with passion, designed for students, and powered by cutting-edge technology, Edulume is more than just a platform - it's a gateway to academic excellence.

_"In the vast universe of knowledge, Edulume is your spaceship to the stars."_ 🚀✨

---

<div align="center">

### ✨ Ready to Transform Your Learning Experience? ✨

**[Get Started](http://localhost:5173)** | **[Documentation](docs/)** | **[Community](https://discord.gg/edulume)** | **[Support](mailto:support@edulume.com)**

---

_Made with ❤️ by Tarin Agarwal_

**🛸 Welcome to the Future of Learning 🛸**

</div>
