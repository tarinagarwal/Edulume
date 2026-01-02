import React from "react";
import { useState, useEffect, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Navbar from "./components/layout/Navbar";
import LandingPage from "./components/layout/LandingPage";
import AuthForm from "./components/auth/AuthForm";
import AuthCallback from "./components/auth/AuthCallback";
import CompleteProfile from "./components/auth/CompleteProfile";
import ChangeUsernameForm from "./components/auth/ChangeUsernameForm";
import PDFsPage from "./components/resources/PDFsPage";
import EbooksPage from "./components/resources/EbooksPage";
import InterviewResourcesPage from "./components/resources/InterviewResourcesPage";
import UploadForm from "./components/resources/UploadForm";
import ForgotPasswordForm from "./components/auth/ForgotPasswordForm";
import NotFoundPage from "./components/layout/NotFoundPage";
import DiscussionsPage from "./components/discussions/DiscussionsPage";
import CreateDiscussionPage from "./components/discussions/CreateDiscussionPage";
import DiscussionDetailPage from "./components/discussions/DiscussionDetailPage";
import CoursesPage from "./components/courses/CoursesPage";
import CreateCoursePage from "./components/courses/CreateCoursePage";
import CourseDetailPage from "./components/courses/CourseDetailPage";
import TestPageStandalone from "./components/courses/TestPageStandalone";
import TestResultsPageStandalone from "./components/courses/TestResultsPageStandalone";
import TestProcessingPage from "./components/courses/TestProcessingPage";
import RoadmapsPage from "./components/roadmaps/RoadmapPage";
import CreateRoadmapPage from "./components/roadmaps/CreateRoadmapPage";
import RoadmapDetailPage from "./components/roadmaps/RoadmapDetailPage";
import FeatureSuggestionPage from "./components/feedback/FeatureSuggestionPage";
import BugReportPage from "./components/feedback/BugReportPage";
import AdminPanel from "./components/admin/AdminPanel";
import AdminRoute from "./components/admin/AdminRoute";
import PdfChatbotPage from "./components/ai/PdfChatbotPage";
import CertificateVerificationPage from "./pages/CertificateVerificationPage";
import Footer from "./components/layout/Footer";
import ScrollToTop from "./components/ui/ScrollToTop";
import ScrollToTopOnRouteChange from "./components/ui/ScrollToTopOnRouteChange";
import { isAuthenticated } from "./utils/auth";
import { SocketProvider } from "./contexts/SocketContext";

interface AppProps { }

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  authenticated: boolean | null;
}> = ({ children, authenticated }) => {
  if (authenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-alien-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return authenticated ? <>{children}</> : <Navigate to="/auth" />;
};

const AuthRoute: React.FC<{
  children: React.ReactNode;
  authenticated: boolean | null;
}> = ({ children, authenticated }) => {
  if (authenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-alien-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return !authenticated ? <>{children}</> : <Navigate to="/" />;
};

const App: React.FC<AppProps> = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  const checkAuthStatus = useCallback(async () => {
    try {
      const isAuth = await isAuthenticated();
      setIsLoggedIn(isAuth);
    } catch (error) {
      console.error("Auth check failed:", error);
      setIsLoggedIn(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return (
    <Router>
      <SocketProvider>
        <div className="min-h-screen bg-royal-black">
          <ScrollToTopOnRouteChange />
          <Navbar authenticated={isLoggedIn} onAuthChange={checkAuthStatus} />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/auth"
              element={
                <AuthRoute authenticated={isLoggedIn}>
                  <AuthForm onAuthChange={checkAuthStatus} />
                </AuthRoute>
              }
            />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route
              path="/auth/complete-profile"
              element={<CompleteProfile />}
            />
            <Route path="/pdfs" element={<PDFsPage />} />
            <Route path="/ebooks" element={<EbooksPage />} />
            <Route
              path="/interview-resources"
              element={<InterviewResourcesPage />}
            />
            <Route path="/forgot-password" element={<ForgotPasswordForm />} />
            <Route
              path="/change-username"
              element={
                <ProtectedRoute authenticated={isLoggedIn}>
                  <ChangeUsernameForm />
                </ProtectedRoute>
              }
            />
            <Route path="/discussions" element={<DiscussionsPage />} />
            <Route path="/discussions/:id" element={<DiscussionDetailPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/:id" element={<CourseDetailPage />} />
            <Route
              path="/courses/:courseId/test/:testId"
              element={
                <ProtectedRoute authenticated={isLoggedIn}>
                  <TestPageStandalone />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/:courseId/test/:testId/processing"
              element={
                <ProtectedRoute authenticated={isLoggedIn}>
                  <TestProcessingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/:courseId/test/:testId/results"
              element={
                <ProtectedRoute authenticated={isLoggedIn}>
                  <TestResultsPageStandalone />
                </ProtectedRoute>
              }
            />
            <Route path="/roadmaps" element={<RoadmapsPage />} />
            <Route path="/roadmaps/:id" element={<RoadmapDetailPage />} />
            <Route path="/pdf-chatbot" element={<PdfChatbotPage />} />
            <Route
              path="/suggest-feature"
              element={<FeatureSuggestionPage />}
            />
            <Route path="/report-bug" element={<BugReportPage />} />
            <Route
              path="/admin"
              element={
                <AdminRoute authenticated={isLoggedIn}>
                  <AdminPanel />
                </AdminRoute>
              }
            />
            <Route
              path="/discussions/new"
              element={
                <ProtectedRoute authenticated={isLoggedIn}>
                  <CreateDiscussionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/create"
              element={
                <ProtectedRoute authenticated={isLoggedIn}>
                  <CreateCoursePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/roadmaps/create"
              element={
                <ProtectedRoute authenticated={isLoggedIn}>
                  <CreateRoadmapPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute authenticated={isLoggedIn}>
                  <UploadForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/verify-certificate"
              element={<CertificateVerificationPage />}
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <Footer />
          <ScrollToTop />
          <Analytics />
          <SpeedInsights />
        </div>
      </SocketProvider>
      <Toaster
        position="top-center"
        gutter={12}
        containerStyle={{ top: 40 }}
        toastOptions={{
          style: {
            fontSize: "14px",
            maxWidth: "500px",
            padding: "12px 20px",
            backgroundColor: "#1e1e1e", 
            color: "#fff",
            border: "2px solid #00cc33",
            borderRadius: "12px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
          },
          success: {
            style: {
              border: "2px solid #00cc33",
              color: "#00cc33",
            },
          },
          error: {
            style: {
              border: "2px solid #ef4444",
              color: "#fff",
              background: "#1e1e1e",
            },
          },
        }}
      />
    </Router>
  );
};

export default App;
