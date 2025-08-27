import React from "react";
import { useState, useEffect, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import LandingPage from "./components/LandingPage";
import AuthForm from "./components/AuthForm";
import PDFsPage from "./components/PDFsPage";
import EbooksPage from "./components/EbooksPage";
import UploadForm from "./components/UploadForm";
import ForgotPasswordForm from "./components/ForgotPasswordForm";
import NotFoundPage from "./components/NotFoundPage";
import DiscussionsPage from "./components/DiscussionsPage";
import CreateDiscussionPage from "./components/CreateDiscussionPage";
import DiscussionDetailPage from "./components/DiscussionDetailPage";
import CoursesPage from "./components/CoursesPage";
import CreateCoursePage from "./components/CreateCoursePage";
import CourseDetailPage from "./components/CourseDetailPage";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import ScrollToTopOnRouteChange from "./components/ScrollToTopOnRouteChange";
import { isAuthenticated } from "./utils/auth";

interface AppProps {}

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
          <Route path="/pdfs" element={<PDFsPage />} />
          <Route path="/ebooks" element={<EbooksPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordForm />} />
          <Route path="/discussions" element={<DiscussionsPage />} />
          <Route path="/discussions/:id" element={<DiscussionDetailPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:id" element={<CourseDetailPage />} />
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
            path="/upload"
            element={
              <ProtectedRoute authenticated={isLoggedIn}>
                <UploadForm />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <Footer />
        <ScrollToTop />
      </div>
    </Router>
  );
};

export default App;
