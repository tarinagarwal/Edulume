"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Target,
  BookOpen,
  Zap,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Calendar,
  Star,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import SEO from "../seo/SEO";
import {
  getRoadmap,
  toggleRoadmapBookmark,
  getUserProfile,
} from "../../utils/api";
import type { Roadmap, RoadmapContent } from "../../types";
import { isAuthenticated } from "../../utils/auth";
import { LinkedinIcon, XIcon } from "../ui/Icons";

const RoadmapDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [roadmapContent, setRoadmapContent] = useState<RoadmapContent | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [expandedStages, setExpandedStages] = useState<Set<number>>(
    new Set([0])
  );
  const [activeTab, setActiveTab] = useState<
    "stages" | "tools" | "certifications" | "career"
  >("stages");

  useEffect(() => {
    checkAuth();
    if (id) {
      fetchRoadmap();
    }
  }, [id]);

  const checkAuth = async () => {
    const authenticated = await isAuthenticated();
    setIsAuth(authenticated);
  };

  const fetchRoadmap = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await getRoadmap(id);
      setRoadmap(response.roadmap);

      // Parse the content JSON
      try {
        const content = JSON.parse(response.roadmap.content);
        setRoadmapContent(content);
      } catch (parseError) {
        console.error("Error parsing roadmap content:", parseError);
      }
    } catch (error) {
      console.error("Error fetching roadmap:", error);
      navigate("/roadmaps");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isAuth) {
        try {
          const response = await getUserProfile();
          setCurrentUser(response.user);
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
    };

    fetchUserProfile();
  }, [isAuth]);

  const handleBookmark = async () => {
    if (!roadmap || !isAuth) return;

    try {
      const response = await toggleRoadmapBookmark(roadmap.id);
      setRoadmap((prev) =>
        prev
          ? {
            ...prev,
            is_bookmarked: response.bookmarked,
            bookmark_count: response.bookmarked
              ? prev.bookmark_count + 1
              : prev.bookmark_count - 1,
          }
          : null
      );
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  };

  const toggleStageExpansion = (index: number) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedStages(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "beginner":
        return "text-green-400 bg-green-400/20";
      case "intermediate":
        return "text-yellow-400 bg-yellow-400/20";
      case "advanced":
        return "text-red-400 bg-red-400/20";
      default:
        return "text-gray-400 bg-gray-400/20";
    }
  };

  const getCostColor = (cost: string) => {
    switch (cost.toLowerCase()) {
      case "free":
        return "text-green-400 bg-green-400/20";
      case "paid":
        return "text-yellow-400 bg-yellow-400/20";
      case "subscription":
        return "text-red-400 bg-red-400/20";
      default:
        return "text-gray-400 bg-gray-400/20";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-royal-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-alien-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!roadmap || !roadmapContent) {
    return (
      <div className="min-h-screen bg-royal-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Roadmap not found</h2>
          <p className="text-gray-400 mb-4">
            The roadmap you're looking for doesn't exist.
          </p>
          <Link
            to="/roadmaps"
            className="bg-alien-green text-royal-black px-6 py-3 rounded-lg font-semibold hover:bg-alien-green/90 transition-colors duration-300"
          >
            Back to Roadmaps
          </Link>
        </div>
      </div>
    );
  }

  const roadmapTabs = [
    {
      key: "stages",
      label: "Learning Stages",
      count: (content: RoadmapContent) => content.stages.length,
    },
    {
      key: "tools",
      label: "Tools & Setup",
      count: (content: RoadmapContent) => content.tools.length,
    },
    {
      key: "certifications",
      label: "Certifications",
      count: (content: RoadmapContent) => content.certifications.length,
    },
    {
      key: "career",
      label: "Career Path",
      count: null,
    },
  ];


  return (
    <>
      {roadmap && (
        <SEO
          title={roadmap.title}
          description={roadmap.description.substring(0, 160)}
          keywords={`${roadmap.title}, learning roadmap, career path, tech skills`}
        />
      )}
      <div className="min-h-screen bg-royal-black text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-8">
            <button
              onClick={() => navigate("/roadmaps")}
              className="mr-0 md:mr-4 p-2 rounded-lg hover:bg-smoke-gray transition-colors duration-200"
              aria-label="Back to roadmaps"
              type="button"
            >
              <ArrowLeft size={24} />
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-10 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2 truncate">
                  {roadmap.title}
                </h1>
                {/* Share button */}
                <div className="flex items-center">
                  <span className="text-gray-400">Share on:</span>
                  <button
                    onClick={() => {
                      const url = encodeURIComponent(window.location.href);
                      const text = `Check out this roadmap: ${roadmap.title}`;
                      const xUrl = `https://x.com/intent/tweet?url=${url}&text=${text}`;

                      window.open(xUrl, '_blank', 'width=600,height=400');
                    }}
                    className="p-2 rounded-lg hover:bg-smoke-gray transition-colors duration-200 text-gray-400 hover:text-[#1DA1F2]"
                    title="Share on X (Twitter)"
                  >
                    <XIcon />
                  </button>

                  <button
                    onClick={() => {
                      const url = window.location.href;
                      const text = `Check out this roadmap: ${roadmap.title}`;
                      const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`;
                      window.open(shareUrl, '_blank', 'noopener,noreferrer');
                    }}
                    className="p-2 rounded-lg hover:bg-smoke-gray transition-colors duration-200 text-gray-400 hover:text-[#0A66C2]"
                    title="Share on LinkedIn"
                  >
                    <LinkedinIcon />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-400 text-sm">
                <div className="flex items-center gap-1">
                  <Clock size={16} />
                  <span>{formatDate(roadmap.created_at)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {isAuth && (
                <button
                  onClick={handleBookmark}
                  className="p-3 rounded-lg hover:bg-smoke-gray transition-colors duration-200"
                  aria-label={
                    roadmap.is_bookmarked
                      ? "Remove bookmark"
                      : "Bookmark roadmap"
                  }
                  type="button"
                >
                  {roadmap.is_bookmarked ? (
                    <BookmarkCheck className="text-alien-green" size={24} />
                  ) : (
                    <Bookmark
                      className="text-gray-400 hover:text-alien-green"
                      size={24}
                    />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="bg-smoke-gray rounded-lg p-4 sm:p-6 mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
              About This Roadmap
            </h2>
            <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
              {roadmapContent.description}
            </p>
          </div>

          {/* Navigation Tabs */}
          <div
            className="flex border-b border-smoke-light whitespace-nowrap"
            role="tablist"
            aria-label="Roadmap sections"
          >
            {roadmapTabs.map(({ key, label, count }) => {
              const isActive = activeTab === key;

              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as typeof activeTab)}
                  role="tab"
                  aria-selected={isActive}
                  type="button"
                  className={`px-4 py-3 text-sm sm:px-6 sm:py-4 sm:text-base font-medium transition-colors duration-200 ${isActive
                      ? "text-alien-green border-b-2 border-alien-green"
                      : "text-gray-400 hover:text-white"
                    }`}
                >
                  {label}
                  {count && ` (${count(roadmapContent)})`}
                </button>
              );
            })}
          </div>

        </div>
      </div>
    </>
  );
};

export default RoadmapDetailPage;
