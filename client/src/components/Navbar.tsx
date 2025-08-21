import React from "react";
import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FileText,
  BookOpen,
  LogIn,
  LogOut,
  Upload,
  User,
  ChevronDown,
  Lock,
  MessageSquare,
} from "lucide-react";
import { getUserProfile, logout } from "../utils/api";
import { User as UserType } from "../types";
import NotificationDropdown from "./NotificationDropdown";

interface NavbarProps {
  authenticated: boolean | null;
  onAuthChange: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ authenticated, onAuthChange }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authenticated === true) {
      fetchUserProfile();
    } else if (authenticated === false) {
      setUser(null);
    }
  }, [authenticated]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await getUserProfile();
      setUser(response.user);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      // If fetching profile fails, it might mean the token is invalid
      onAuthChange();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      onAuthChange(); // Notify parent to re-check auth status
      // Small delay to ensure state updates before redirect
      setTimeout(() => {
        window.location.href = "/";
      }, 100);
    } catch (error) {
      console.error("Logout failed:", error);
      // Force logout on client side even if server request fails
      setUser(null);
      onAuthChange();
      setTimeout(() => {
        window.location.href = "/";
      }, 100);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  // Show loading state while checking authentication
  if (authenticated === null) {
    return (
      <nav className="bg-smoke-gray/95 border-b border-smoke-light sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/logo.png" alt="AlienVault Logo" className="w-8 h-8 " />
              <span className="glow-text text-xl font-bold">AlienVault</span>
            </Link>
            <div className="w-6 h-6 border-2 border-alien-green border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-smoke-gray/95 border-b border-smoke-light sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/logo.png" alt="AlienVault Logo" className="w-8 h-8 " />
            <span className="glow-text text-xl font-bold">AlienVault</span>
          </Link>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-300 hover:text-alien-green p-2"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/pdfs"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                isActive("/pdfs")
                  ? "text-alien-green shadow-alien-glow"
                  : "text-gray-300 hover:text-alien-green hover:shadow-alien-glow"
              }`}
            >
              {/* <FileText size={20} /> */}
              <span>PDFs</span>
            </Link>

            <Link
              to="/ebooks"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                isActive("/ebooks")
                  ? "text-alien-green shadow-alien-glow"
                  : "text-gray-300 hover:text-alien-green hover:shadow-alien-glow"
              }`}
            >
              {/* <BookOpen size={20} /> */}
              <span>E-books</span>
            </Link>

            <Link
              to="/discussions"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                isActive("/discussions")
                  ? "text-alien-green shadow-alien-glow"
                  : "text-gray-300 hover:text-alien-green hover:shadow-alien-glow"
              }`}
            >
              {/* <MessageSquare size={20} /> */}
              <span>Discussions</span>
            </Link>

            {authenticated ? (
              <>
                <Link
                  to="/upload"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                    isActive("/upload")
                      ? "text-alien-green shadow-alien-glow"
                      : "text-gray-300 hover:text-alien-green hover:shadow-alien-glow"
                  }`}
                >
                  {/* <Upload size={20} /> */}
                  <span>Upload</span>
                </Link>

                {/* Notifications */}
                {/* <NotificationDropdown /> */}

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() =>
                      setIsProfileDropdownOpen(!isProfileDropdownOpen)
                    }
                    className="flex items-center space-x-2 text-gray-300 hover:text-alien-green px-3 py-2 rounded-lg transition-all duration-300"
                  >
                    <div className="w-8 h-8 bg-alien-green rounded-full flex items-center justify-center shadow-alien-glow">
                      <User className="text-royal-black" size={16} />
                    </div>
                    <span className="hidden sm:block">
                      {user?.username || "User"}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200 ${
                        isProfileDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-smoke-gray border border-smoke-light rounded-lg shadow-lg z-50">
                      <div className="px-4 py-3 border-b border-smoke-light">
                        <p className="text-sm font-medium text-white">
                          {user?.username}
                        </p>
                        <p className="text-xs text-gray-400">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          to="/forgot-password"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-smoke-light hover:text-alien-green transition-colors duration-200"
                        >
                          <Lock size={16} className="mr-3" />
                          Change Password
                        </Link>
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            handleLogout();
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-smoke-light hover:text-red-400 transition-colors duration-200"
                        >
                          <LogOut size={16} className="mr-3" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                to="/auth"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                  isActive("/auth")
                    ? "text-alien-green shadow-alien-glow"
                    : "text-gray-300 hover:text-alien-green hover:shadow-alien-glow"
                }`}
              >
                <LogIn size={20} />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-smoke-gray border-t border-smoke-light">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/pdfs"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                isActive("/pdfs")
                  ? "text-alien-green shadow-alien-glow bg-alien-green/10"
                  : "text-gray-300 hover:text-alien-green hover:shadow-alien-glow"
              }`}
            >
              <FileText size={20} />
              <span>PDFs</span>
            </Link>

            <Link
              to="/ebooks"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                isActive("/ebooks")
                  ? "text-alien-green shadow-alien-glow bg-alien-green/10"
                  : "text-gray-300 hover:text-alien-green hover:shadow-alien-glow"
              }`}
            >
              <BookOpen size={20} />
              <span>E-books</span>
            </Link>

            <Link
              to="/discussions"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                isActive("/discussions")
                  ? "text-alien-green shadow-alien-glow bg-alien-green/10"
                  : "text-gray-300 hover:text-alien-green hover:shadow-alien-glow"
              }`}
            >
              <MessageSquare size={20} />
              <span>Discussions</span>
            </Link>

            {authenticated ? (
              <>
                <Link
                  to="/upload"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                    isActive("/upload")
                      ? "text-alien-green shadow-alien-glow bg-alien-green/10"
                      : "text-gray-300 hover:text-alien-green hover:shadow-alien-glow"
                  }`}
                >
                  <Upload size={20} />
                  <span>Upload</span>
                </Link>

                {/* Mobile Profile Section */}
                <div className="border-t border-smoke-light pt-2 mt-2">
                  <div className="px-3 py-2">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-alien-green rounded-full flex items-center justify-center shadow-alien-glow">
                        <User className="text-royal-black" size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {user?.username}
                        </p>
                        <p className="text-xs text-gray-400">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/forgot-password"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 text-gray-300 hover:text-alien-green transition-colors duration-300"
                  >
                    <Lock size={20} />
                    <span>Change Password</span>
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center space-x-2 text-gray-300 hover:text-red-400 px-3 py-2 rounded-lg transition-all duration-300 w-full text-left"
                  >
                    <LogOut size={20} />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <Link
                to="/auth"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                  isActive("/auth")
                    ? "text-alien-green shadow-alien-glow bg-alien-green/10"
                    : "text-gray-300 hover:text-alien-green hover:shadow-alien-glow"
                }`}
              >
                <LogIn size={20} />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
