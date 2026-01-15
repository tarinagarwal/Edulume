import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  BookOpen,
  MessageSquare,
  Upload,
  Mail,
  Heart,
  Zap,
  Shield,
  Users,
  Map,
} from "lucide-react";
import { getPDFs, getEbooks, getDiscussions } from "../../utils/api";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [stats, setStats] = useState({
    totalResources: 0,
    totalDiscussions: 0,
    loading: true,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [pdfs, ebooks, discussions] = await Promise.all([
          getPDFs().catch(() => []),
          getEbooks().catch(() => []),
          getDiscussions({ limit: 1 }).catch(() => ({
            pagination: { total: 0 },
          })),
        ]);

        setStats({
          // @ts-ignore
          totalResources: pdfs.length + ebooks.length,
          totalDiscussions: discussions.pagination?.total || 0,
          loading: false,
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  /* ------------------ CONFIG ------------------ */
  const quickLinks = [
    { to: "/pdfs", label: "Browse PDFs", Icon: FileText },
    { to: "/ebooks", label: "E-book Library", Icon: BookOpen },
    { to: "/discussions", label: "Discussions", Icon: MessageSquare },
    { to: "/roadmaps", label: "Learning Roadmaps", Icon: Map },
    { to: "/upload", label: "Upload Resource", Icon: Upload },
  ];

  const communityLinks = [
    { to: "/discussions/new", label: "Ask Question" },
    { to: "/discussions?category=academic", label: "Academic Help" },
    { to: "/discussions?category=technical", label: "Technical Support" },
    { to: "/discussions?category=career", label: "Career Guidance" },
  ];

  return (
    <footer className="bg-gray-900 border-t border-smoke-dark mt-20 relative">
      {/* Main Footer */}
      <div
        data-aos="fade-up"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img src="/logo.png" alt="Edulume" className="w-8 h-8" />
              <span className="text-matcha-muted text-xl font-alien font-bold">
                Edulume
              </span>
            </div>

            <p className="text-olive-gold text-sm mb-6 leading-relaxed">
              Your college's ultimate resource hub. Share knowledge, discover
              resources, and connect with fellow students in our secure digital
              vault.
            </p>

            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-matcha-muted rounded-full animate-pulse" />
              <span className="text-xs text-matcha-muted font-cyber">
                SYSTEM ONLINE
              </span>
            </div>
          </div>

          {/* Quick Access */}
          <div>
            <h3 className="text-matcha-muted font-alien font-bold mb-4 flex items-center">
              <Zap className="mr-2" size={16} />
              Quick Access
            </h3>

            <ul className="space-y-3">
              {quickLinks.map(({ to, label, Icon }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="flex items-center text-gray-400 hover:text-moss-accent transition-colors text-sm"
                  >
                    <Icon className="mr-2" size={14} />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-matcha-muted font-alien font-bold mb-4 flex items-center">
              <Users className="mr-2" size={16} />
              Community
            </h3>

            <ul className="space-y-3">
              {communityLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="flex items-center text-gray-400 hover:text-moss-accent transition-colors text-sm"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Security & Contact */}
          <div>
            <h3 className="text-matcha-muted font-alien font-bold mb-4 flex items-center">
              <Shield className="mr-2" size={16} />
              Security & Contact
            </h3>

            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:tarinagarwal@gmail.com"
                  className="flex items-center text-gray-400 hover:text-moss-accent transition-colors text-sm"
                >
                  <Mail className="mr-2" size={14} />
                  Contact Support
                </a>
              </li>

              <li className="flex items-center text-gray-400 text-sm">
                <Shield className="mr-2" size={14} />
                Secure & Private
              </li>

              <li className="flex items-center text-gray-400 text-sm">
                <Zap className="mr-2" size={14} />
                Always Free
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-gray-900 border-t border-smoke-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-sm text-gray-400 text-center sm:text-left">
              <span>© {currentYear} Edulume</span>
              <span className="hidden md:inline">•</span>
              <span className="flex items-center">
                Made with <Heart className="mx-1 text-red-400" size={14} /> for
                students
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-sm">
              <button className="text-gray-400 hover:text-moss-accent transition-colors">
                Privacy Policy
              </button>
              <button className="text-gray-400 hover:text-moss-accent transition-colors">
                Terms of Service
              </button>

              <div className="flex items-center space-x-2 text-matcha-muted">
                <div className="w-2 h-2 bg-matcha-muted rounded-full animate-pulse" />
                <span className="font-cyber text-xs">
                  SECURE CONNECTION
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Dots */}
      <div className="absolute bottom-20 left-10 w-2 h-2 bg-alien-green-light rounded-full animate-pulse opacity-30" />
      <div className="absolute bottom-32 right-20 w-1 h-1 bg-alien-green-light rounded-full animate-pulse opacity-40" />
      <div className="absolute bottom-16 right-32 w-3 h-3 bg-alien-green-light rounded-full animate-pulse opacity-20" />
    </footer>
  );
};

export default Footer;
