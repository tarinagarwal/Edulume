"use client";

import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FileText,
  BookOpen,
  LogIn,
  LogOut,
  ChevronDown,
  Lock,
  MessageSquare,
  GraduationCap,
  Map,
} from "lucide-react";
import AdminNavLink from "../admin/AdminNavLink";
import { getUserProfile, logout } from "../../utils/api";
import type { User as UserType } from "../../types";
import { removeAuthToken } from "../../utils/auth";

interface NavbarProps {
  authenticated: boolean | null;
  onAuthChange: () => void;
}

export default function ResponsiveNavbar({
  authenticated,
  onAuthChange,
}: NavbarProps) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [aiToolsOpen, setAiToolsOpen] = useState(false);
  const resourcesRef = useRef<HTMLDivElement | null>(null);
  const aiToolsRef = useRef<HTMLDivElement | null>(null);
  const resourcesCloseTimer = useRef<number | null>(null);
  const aiToolsCloseTimer = useRef<number | null>(null);

  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);
  const [mobileAiToolsOpen, setMobileAiToolsOpen] = useState(false);

  // profile state preserved
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authenticated === true) {
      fetchUserProfile();
    } else if (authenticated === false) {
      setUser(null);
    }
  }, [authenticated]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (profileRef.current && !profileRef.current.contains(target)) {
        setIsProfileDropdownOpen(false);
      }
      if (resourcesRef.current && !resourcesRef.current.contains(target)) {
        setResourcesOpen(false);
      }
      if (aiToolsRef.current && !aiToolsRef.current.contains(target)) {
        setAiToolsOpen(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
        setResourcesOpen(false);
        setAiToolsOpen(false);
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await getUserProfile();
      setUser(response.user);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      onAuthChange();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
      removeAuthToken();
    }
    setUser(null);
    onAuthChange();
    window.location.href = "/";
  };

  const isActive = (path: string) => location.pathname === path;

  const openWithClear = (which: "resources" | "ai") => {
    if (which === "resources") {
      if (resourcesCloseTimer.current)
        window.clearTimeout(resourcesCloseTimer.current);
      setResourcesOpen(true);
    } else {
      if (aiToolsCloseTimer.current)
        window.clearTimeout(aiToolsCloseTimer.current);
      setAiToolsOpen(true);
    }
  };
  const closeWithDelay = (which: "resources" | "ai") => {
    const delay = 120;
    if (which === "resources") {
      if (resourcesCloseTimer.current)
        window.clearTimeout(resourcesCloseTimer.current);
      resourcesCloseTimer.current = window.setTimeout(
        () => setResourcesOpen(false),
        delay
      );
    } else {
      if (aiToolsCloseTimer.current)
        window.clearTimeout(aiToolsCloseTimer.current);
      aiToolsCloseTimer.current = window.setTimeout(
        () => setAiToolsOpen(false),
        delay
      );
    }
  };

  // Show loading state while checking authentication (preserve styles/colors)
  if (authenticated === null) {
    return (
      <nav className="bg-smoke-gray/95 border-b border-smoke-light sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/logo.png" alt="AlienVault Logo" className="w-8 h-8 " />
              <span className="glow-text text-xl font-bold">AlienVault</span>
            </Link>
            <div className="w-6 h-6 border-2 border-alien-green border-t-transparent rounded-full animate-spin" />
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

          {/* Mobile hamburger */}
          <div className="md:hidden">
            <button
              aria-label="Open menu"
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-gray-300 hover:text-alien-green p-2"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-6">
            <div
              className="relative"
              ref={resourcesRef}
              onMouseEnter={() => openWithClear("resources")}
              onMouseLeave={() => closeWithDelay("resources")}
            >
              <button
                onClick={() => setResourcesOpen((v) => !v)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                  resourcesOpen || isActive("/pdfs") || isActive("/ebooks")
                    ? "text-alien-green shadow-alien-glow"
                    : "text-gray-300 hover:text-alien-green hover:shadow-alien-glow"
                }`}
                aria-expanded={resourcesOpen}
                aria-haspopup="menu"
              >
                <span>Resources</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${
                    resourcesOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {resourcesOpen && (
                <div
                  className="absolute left-0 mt-2 w-48 bg-smoke-gray border border-smoke-light rounded-lg shadow-lg z-50"
                  role="menu"
                >
                  <Link
                    to="/pdfs"
                    onClick={() => setResourcesOpen(false)}
                    className={`block px-4 py-2 text-sm rounded-t-lg transition-colors duration-200 ${
                      isActive("/pdfs")
                        ? "text-alien-green shadow-alien-glow"
                        : "text-gray-300 hover:text-alien-green hover:bg-smoke-light"
                    }`}
                    role="menuitem"
                  >
                    PDFs
                  </Link>
                  <Link
                    to="/ebooks"
                    onClick={() => setResourcesOpen(false)}
                    className={`block px-4 py-2 text-sm rounded-b-lg transition-colors duration-200 ${
                      isActive("/ebooks")
                        ? "text-alien-green shadow-alien-glow"
                        : "text-gray-300 hover:text-alien-green hover:bg-smoke-light"
                    }`}
                    role="menuitem"
                  >
                    E-books
                  </Link>
                </div>
              )}
            </div>

            {/* Keep Discussions as a normal nav link */}
            <Link
              to="/discussions"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                isActive("/discussions")
                  ? "text-alien-green shadow-alien-glow"
                  : "text-gray-300 hover:text-alien-green hover:shadow-alien-glow"
              }`}
            >
              <span>Discussions</span>
            </Link>

            <div
              className="relative"
              ref={aiToolsRef}
              onMouseEnter={() => openWithClear("ai")}
              onMouseLeave={() => closeWithDelay("ai")}
            >
              <button
                onClick={() => setAiToolsOpen((v) => !v)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                  aiToolsOpen ||
                  isActive("/courses") ||
                  isActive("/roadmaps") ||
                  isActive("/pdf-chatbot")
                    ? "text-alien-green shadow-alien-glow"
                    : "text-gray-300 hover:text-alien-green hover:shadow-alien-glow"
                }`}
                aria-expanded={aiToolsOpen}
                aria-haspopup="menu"
              >
                <span>AI Tools</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${
                    aiToolsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {aiToolsOpen && (
                <div
                  className="absolute left-0 mt-2 w-48 bg-smoke-gray border border-smoke-light rounded-lg shadow-lg z-50"
                  role="menu"
                >
                  <Link
                    to="/courses"
                    onClick={() => setAiToolsOpen(false)}
                    className={`block px-4 py-2 text-sm rounded-t-lg transition-colors duration-200 ${
                      isActive("/courses")
                        ? "text-alien-green shadow-alien-glow"
                        : "text-gray-300 hover:text-alien-green hover:bg-smoke-light"
                    }`}
                    role="menuitem"
                  >
                    Courses
                  </Link>
                  <Link
                    to="/roadmaps"
                    onClick={() => setAiToolsOpen(false)}
                    className={`block px-4 py-2 text-sm transition-colors duration-200 ${
                      isActive("/roadmaps")
                        ? "text-alien-green shadow-alien-glow"
                        : "text-gray-300 hover:text-alien-green hover:bg-smoke-light"
                    }`}
                    role="menuitem"
                  >
                    Roadmaps
                  </Link>
                  <Link
                    to="/pdf-chatbot"
                    onClick={() => setAiToolsOpen(false)}
                    className={`block px-4 py-2 text-sm rounded-b-lg transition-colors duration-200 ${
                      isActive("/pdf-chatbot")
                        ? "text-alien-green shadow-alien-glow"
                        : "text-gray-300 hover:text-alien-green hover:bg-smoke-light"
                    }`}
                    role="menuitem"
                  >
                    PDF Chatbot
                  </Link>
                </div>
              )}
            </div>

            {/* Auth area (preserved) */}
            {authenticated ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen((v) => !v)}
                  className="flex items-center space-x-2 text-gray-300 hover:text-alien-green px-3 py-2 rounded-lg transition-all duration-300"
                >
                  <div className="w-8 h-8 border border-neutral-700 rounded-full flex items-center justify-center shadow-alien-glow">
                    <img
                      className="text-royal-black"
                      src={`https://robohash.org/${user?.username}.png`}
                      alt={
                        user?.username
                          ? user.username.charAt(0).toUpperCase()
                          : "U"
                      }
                    />
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
                      <AdminNavLink
                        authenticated={authenticated}
                        onMobileMenuClose={() =>
                          setIsProfileDropdownOpen(false)
                        }
                        isDropdown={true}
                      />
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
            ) : (
              <Link
                to="/auth"
                className={`flex items-center border border-neutral-700 space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
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

      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[55] bg-black/50 transition-opacity duration-300 ${
          isMobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden={!isMobileMenuOpen}
      />

      {/* Side Sheet */}
      <div
        className={`fixed top-0 left-0 h-screen w-80 max-w-[85vw] bg-smoke-gray border-r border-smoke-light shadow-2xl transform transition-transform duration-300 ease-in-out z-[60] ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Menu"
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-smoke-light bg-smoke-gray">
          <Link
            to="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center space-x-2"
          >
            <img src="/logo.png" alt="AlienVault Logo" className="w-8 h-8" />
            <span className="glow-text text-xl font-bold">AlienVault</span>
          </Link>
          <button
            aria-label="Close menu"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-gray-300 hover:text-alien-green p-2 rounded-lg transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="h-[calc(100vh-4rem)] overflow-y-auto px-2 pt-4 pb-6 space-y-2">
          {/* Resources (collapsible) */}
          <button
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-300 hover:text-alien-green transition-all duration-300"
            onClick={() => setMobileResourcesOpen((v) => !v)}
            aria-expanded={mobileResourcesOpen}
          >
            <span className="flex items-center gap-2">
              <FileText size={20} />
              <span>Resources</span>
            </span>
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${
                mobileResourcesOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          {mobileResourcesOpen && (
            <div className="ml-8 space-y-1">
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
            </div>
          )}

          {/* Discussions (standalone) */}
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

          {/* AI Tools (collapsible) */}
          <button
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-300 hover:text-alien-green transition-all duration-300"
            onClick={() => setMobileAiToolsOpen((v) => !v)}
            aria-expanded={mobileAiToolsOpen}
          >
            <span className="flex items-center gap-2">
              <GraduationCap size={20} />
              <span>AI Tools</span>
            </span>
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${
                mobileAiToolsOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          {mobileAiToolsOpen && (
            <div className="ml-8 space-y-1">
              <Link
                to="/courses"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                  isActive("/courses")
                    ? "text-alien-green shadow-alien-glow bg-alien-green/10"
                    : "text-gray-300 hover:text-alien-green hover:shadow-alien-glow"
                }`}
              >
                <GraduationCap size={20} />
                <span>Courses</span>
              </Link>
              <Link
                to="/roadmaps"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                  isActive("/roadmaps")
                    ? "text-alien-green shadow-alien-glow bg-alien-green/10"
                    : "text-gray-300 hover:text-alien-green hover:shadow-alien-glow"
                }`}
              >
                <Map size={20} />
                <span>Roadmaps</span>
              </Link>
              <Link
                to="/pdf-chatbot"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                  isActive("/pdf-chatbot")
                    ? "text-alien-green shadow-alien-glow bg-alien-green/10"
                    : "text-gray-300 hover:text-alien-green hover:shadow-alien-glow"
                }`}
              >
                <MessageSquare size={20} />
                <span>PDF Chatbot</span>
              </Link>
            </div>
          )}

          {/* Auth (preserved) */}
          {authenticated ? (
            <div className="border-t border-smoke-light pt-2 mt-2">
              <div className="px-3 py-2">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 border border-neutral-700 rounded-full flex items-center justify-center shadow-alien-glow">
                    <img
                      className="text-royal-black"
                      src={`https://robohash.org/${user?.username}.png`}
                      alt={
                        user?.username
                          ? user.username.charAt(0).toUpperCase()
                          : "U"
                      }
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {user?.username}
                    </p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                  </div>
                </div>
              </div>
              <AdminNavLink
                authenticated={authenticated}
                onMobileMenuClose={() => setIsMobileMenuOpen(false)}
                isMobile={true}
              />
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
    </nav>
  );
}
