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
import {
  getRoadmap,
  toggleRoadmapBookmark,
  getUserProfile,
} from "../utils/api";
import type { Roadmap, RoadmapContent } from "../types";
import { isAuthenticated } from "../utils/auth";

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

  return (
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
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2 truncate">
              {roadmap.title}
            </h1>
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
                  roadmap.is_bookmarked ? "Remove bookmark" : "Bookmark roadmap"
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
        <div className="bg-smoke-gray rounded-lg mb-8">
          <div className="overflow-x-auto">
            <div
              className="flex border-b border-smoke-light whitespace-nowrap"
              role="tablist"
              aria-label="Roadmap sections"
            >
              <button
                onClick={() => setActiveTab("stages")}
                role="tab"
                aria-selected={activeTab === "stages"}
                className={`px-4 py-3 text-sm sm:px-6 sm:py-4 sm:text-base font-medium transition-colors duration-200 ${
                  activeTab === "stages"
                    ? "text-alien-green border-b-2 border-alien-green"
                    : "text-gray-400 hover:text-white"
                }`}
                type="button"
              >
                Learning Stages ({roadmapContent.stages.length})
              </button>
              <button
                onClick={() => setActiveTab("tools")}
                role="tab"
                aria-selected={activeTab === "tools"}
                className={`px-4 py-3 text-sm sm:px-6 sm:py-4 sm:text-base font-medium transition-colors duration-200 ${
                  activeTab === "tools"
                    ? "text-alien-green border-b-2 border-alien-green"
                    : "text-gray-400 hover:text-white"
                }`}
                type="button"
              >
                Tools & Setup ({roadmapContent.tools.length})
              </button>
              <button
                onClick={() => setActiveTab("certifications")}
                role="tab"
                aria-selected={activeTab === "certifications"}
                className={`px-4 py-3 text-sm sm:px-6 sm:py-4 sm:text-base font-medium transition-colors duration-200 ${
                  activeTab === "certifications"
                    ? "text-alien-green border-b-2 border-alien-green"
                    : "text-gray-400 hover:text-white"
                }`}
                type="button"
              >
                Certifications ({roadmapContent.certifications.length})
              </button>
              <button
                onClick={() => setActiveTab("career")}
                role="tab"
                aria-selected={activeTab === "career"}
                className={`px-4 py-3 text-sm sm:px-6 sm:py-4 sm:text-base font-medium transition-colors duration-200 ${
                  activeTab === "career"
                    ? "text-alien-green border-b-2 border-alien-green"
                    : "text-gray-400 hover:text-white"
                }`}
                type="button"
              >
                Career Path
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {/* Learning Stages Tab */}
            {activeTab === "stages" && (
              <div className="space-y-6">
                {roadmapContent.stages.map((stage, index) => (
                  <div
                    key={index}
                    className="border border-smoke-light rounded-lg whitespace-normal break-words"
                  >
                    <button
                      onClick={() => toggleStageExpansion(index)}
                      className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-royal-black/50 transition-colors duration-200 text-left"
                      type="button"
                      aria-expanded={expandedStages.has(index)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-alien-green text-royal-black rounded-full font-bold shrink-0">
                          {index + 1}
                        </div>
                        <div className="text-left min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white text-base sm:text-lg whitespace-normal break-words">
                              {stage.title}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium ${getDifficultyColor(
                                stage.level
                              )}`}
                            >
                              {stage.level}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm line-clamp-3 sm:line-clamp-none">
                            {stage.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                            <span>⏱️ {stage.timeframe}</span>
                            <span>📚 {stage.resources.length} resources</span>
                            <span>🛠️ {stage.projects.length} projects</span>
                          </div>
                        </div>
                      </div>
                      {expandedStages.has(index) ? (
                        <ChevronDown size={20} />
                      ) : (
                        <ChevronRight size={20} />
                      )}
                    </button>

                    {expandedStages.has(index) && (
                      <div className="border-t border-smoke-light p-4 sm:p-6 bg-royal-black/30">
                        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
                          {/* Skills */}
                          <div>
                            <h4 className="text-base sm:text-lg font-semibold text-alien-green mb-3 sm:mb-4 flex items-center">
                              <Target className="mr-2" size={20} />
                              Skills to Learn
                            </h4>
                            <div className="space-y-3">
                              {stage.skills.map((skill, skillIndex) => (
                                <div
                                  key={skillIndex}
                                  className="bg-smoke-gray/50 rounded-lg p-4"
                                >
                                  <h5 className="font-medium text-white mb-2">
                                    {skill.name}
                                  </h5>
                                  <p className="text-gray-400 text-sm mb-2">
                                    {skill.description}
                                  </p>
                                  <p className="text-alien-green text-xs">
                                    {skill.importance}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Resources */}
                          <div>
                            <div className="space-y-2">
                              <h4 className="text-base  sm:text-lg font-semibold text-alien-green flex items-center">
                                <BookOpen className="mr-2" size={20} />
                                Learning Resources
                              </h4>
                              <p className="text-red-400">⚠️ Some links might not work</p>
                            </div>

                            <div className="space-y-3">
                              {stage.resources.map(
                                (resource, resourceIndex) => (
                                  <div
                                    key={resourceIndex}
                                    className="bg-smoke-gray/50 rounded-lg p-4"
                                  >
                                    <div className="flex items-start justify-between mb-2 gap-2">
                                      <h5 className="font-medium text-white">
                                        {resource.name}
                                      </h5>
                                      {resource.url && (
                                        <a
                                          href={resource.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-alien-green hover:text-alien-green/80 transition-colors duration-200"
                                        >
                                          <ExternalLink size={16} />
                                        </a>
                                      )}
                                    </div>
                                    <p className="text-gray-400 text-sm mb-3">
                                      {resource.description}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      <span className="text-xs bg-smoke-light px-2 py-1 rounded text-gray-300">
                                        {resource.type}
                                      </span>
                                      <span
                                        className={`text-xs px-2 py-1 rounded ${getDifficultyColor(
                                          resource.difficulty
                                        )}`}
                                      >
                                        {resource.difficulty}
                                      </span>
                                      <span
                                        className={`text-xs px-2 py-1 rounded ${getCostColor(
                                          resource.cost
                                        )}`}
                                      >
                                        {resource.cost}
                                      </span>
                                      <span className="text-xs bg-blue-400/20 text-blue-400 px-2 py-1 rounded">
                                        ⏱️ {resource.estimated_time}
                                      </span>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Projects */}
                        {stage.projects.length > 0 && (
                          <div className="mt-6 sm:mt-8">
                            <h4 className="text-base sm:text-lg font-semibold text-alien-green mb-3 sm:mb-4 flex items-center">
                              <Zap className="mr-2" size={20} />
                              Practice Projects
                            </h4>
                            <div className="grid md:grid-cols-2 gap-4">
                              {stage.projects.map((project, projectIndex) => (
                                <div
                                  key={projectIndex}
                                  className="bg-smoke-gray/50 rounded-lg p-4"
                                >
                                  <div className="flex items-start justify-between mb-2 gap-2">
                                    <h5 className="font-medium text-white">
                                      {project.name}
                                    </h5>
                                    <span
                                      className={`text-xs px-2 py-1 rounded ${getDifficultyColor(
                                        project.difficulty
                                      )}`}
                                    >
                                      {project.difficulty}
                                    </span>
                                  </div>
                                  <p className="text-gray-400 text-sm mb-3">
                                    {project.description}
                                  </p>

                                  <div className="space-y-2 text-xs">
                                    <div>
                                      <span className="text-alien-green font-medium">
                                        Learning Objectives:
                                      </span>
                                      <ul className="text-gray-400 mt-1 ml-4">
                                        {project.learning_objectives.map(
                                          (obj, i) => (
                                            <li key={i} className="list-disc">
                                              {obj}
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    </div>
                                    <div>
                                      <span className="text-alien-green font-medium">
                                        Key Features:
                                      </span>
                                      <ul className="text-gray-400 mt-1 ml-4">
                                        {project.features.map((feature, i) => (
                                          <li key={i} className="list-disc">
                                            {feature}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>

                                  <div className="mt-3 pt-3 border-t border-smoke-light/30">
                                    <span className="text-xs text-blue-400">
                                      ⏱️ {project.estimated_time}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Best Practices */}
                        {stage.best_practices.length > 0 && (
                          <div className="mt-6 sm:mt-8">
                            <h4 className="text-base sm:text-lg font-semibold text-alien-green mb-3 sm:mb-4 flex items-center">
                              <CheckCircle className="mr-2" size={20} />
                              Best Practices
                            </h4>
                            <div className="space-y-3">
                              {stage.best_practices.map(
                                (practice, practiceIndex) => (
                                  <div
                                    key={practiceIndex}
                                    className="bg-green-900/20 border border-green-500/30 rounded-lg p-4"
                                  >
                                    <h5 className="font-medium text-green-400 mb-2">
                                      {practice.title}
                                    </h5>
                                    <p className="text-gray-300 text-sm mb-2">
                                      {practice.description}
                                    </p>
                                    {practice.examples.length > 0 && (
                                      <div className="text-xs text-gray-400">
                                        <span className="font-medium">
                                          Examples:
                                        </span>
                                        <ul className="mt-1 ml-4">
                                          {practice.examples.map(
                                            (example, i) => (
                                              <li key={i} className="list-disc">
                                                {example}
                                              </li>
                                            )
                                          )}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {/* Common Pitfalls */}
                        {stage.common_pitfalls.length > 0 && (
                          <div className="mt-6 sm:mt-8">
                            <h4 className="text-base sm:text-lg font-semibold text-alien-green mb-3 sm:mb-4 flex items-center">
                              <AlertTriangle className="mr-2" size={20} />
                              Common Pitfalls
                            </h4>
                            <div className="space-y-3">
                              {stage.common_pitfalls.map(
                                (pitfall, pitfallIndex) => (
                                  <div
                                    key={pitfallIndex}
                                    className="bg-red-900/20 border border-red-500/30 rounded-lg p-4"
                                  >
                                    <h5 className="font-medium text-red-400 mb-2">
                                      ⚠️ {pitfall.issue}
                                    </h5>
                                    <p className="text-gray-300 text-sm">
                                      <span className="text-green-400 font-medium">
                                        Solution:
                                      </span>{" "}
                                      {pitfall.solution}
                                    </p>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Tools Tab */}
            {activeTab === "tools" && (
              <div className="grid md:grid-cols-2 gap-6">
                {roadmapContent.tools.map((tool, index) => (
                  <div
                    key={index}
                    className="bg-royal-black/50 rounded-lg p-6 border border-smoke-light"
                  >
                    <div className="flex items-start justify-between mb-4 gap-2">
                      <div className="min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-white mb-1 truncat">
                          {tool.name}
                        </h3>
                        <span className="text-sm text-alien-green">
                          {tool.category}
                        </span>
                      </div>
                      {tool.url && (
                        <a
                          href={tool.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-alien-green hover:text-alien-green/80 transition-colors duration-200"
                        >
                          <ExternalLink size={20} />
                        </a>
                      )}
                    </div>

                    <p className="text-gray-400 text-sm mb-4">
                      {tool.description}
                    </p>

                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-green-400 font-medium">
                          Pros:
                        </span>
                        <ul className="text-gray-400 mt-1 ml-4">
                          {tool.pros.map((pro, i) => (
                            <li key={i} className="list-disc">
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <span className="text-red-400 font-medium">Cons:</span>
                        <ul className="text-gray-400 mt-1 ml-4">
                          {tool.cons.map((con, i) => (
                            <li key={i} className="list-disc">
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {tool.alternatives.length > 0 && (
                        <div>
                          <span className="text-blue-400 font-medium">
                            Alternatives:
                          </span>
                          <p className="text-gray-400 mt-1">
                            {tool.alternatives.join(", ")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Certifications Tab */}
            {activeTab === "certifications" && (
              <div className="grid md:grid-cols-2 gap-6">
                {roadmapContent.certifications.map((cert, index) => (
                  <div
                    key={index}
                    className="bg-royal-black/50 rounded-lg p-6 border border-smoke-light"
                  >
                    <div className="flex items-start justify-between mb-4 gap-2">
                      <div className="min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-white mb-1 ">
                          {cert.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">
                            {cert.provider}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${getDifficultyColor(
                              cert.level
                            )}`}
                          >
                            {cert.level}
                          </span>
                        </div>
                      </div>
                      {cert.url && (
                        <a
                          href={cert.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-alien-green hover:text-alien-green/80 transition-colors duration-200"
                        >
                          <ExternalLink size={20} />
                        </a>
                      )}
                    </div>

                    <p className="text-gray-400 text-sm mb-4">
                      {cert.description}
                    </p>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Cost:</span>
                        <span className="text-white font-medium">
                          {cert.cost}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Validity:</span>
                        <span className="text-white font-medium">
                          {cert.validity}
                        </span>
                      </div>
                    </div>

                    {cert.preparation_resources.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-smoke-light/30">
                        <span className="text-alien-green font-medium text-sm">
                          Preparation Resources:
                        </span>
                        <ul className="text-gray-400 text-xs mt-2 ml-4">
                          {cert.preparation_resources.map((resource, i) => (
                            <li key={i} className="list-disc">
                              {resource}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Career Path Tab */}
            {activeTab === "career" && (
              <div className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-royal-black/50 rounded-lg p-6 border border-smoke-light">
                    <h3 className="text-lg font-semibold text-alien-green mb-4 flex items-center">
                      <TrendingUp className="mr-2" size={20} />
                      Career Roles
                    </h3>
                    <div className="space-y-2">
                      {roadmapContent.career_path.roles.map((role, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Star className="text-yellow-400" size={16} />
                          <span className="text-white">{role}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-royal-black/50 rounded-lg p-6 border border-smoke-light">
                    <h3 className="text-lg font-semibold text-alien-green mb-4 flex items-center">
                      <DollarSign className="mr-2" size={20} />
                      Salary Range
                    </h3>
                    <p className="text-white text-xl font-bold">
                      {roadmapContent.career_path.salary_range}
                    </p>
                  </div>
                </div>

                <div className="bg-royal-black/50 rounded-lg p-6 border border-smoke-light">
                  <h3 className="text-lg font-semibold text-alien-green mb-4 flex items-center">
                    <Target className="mr-2" size={20} />
                    Required Skills
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {roadmapContent.career_path.skills_required.map(
                      (skill, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="text-green-400" size={16} />
                          <span className="text-gray-300">{skill}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="bg-royal-black/50 rounded-lg p-6 border border-smoke-light">
                  <h3 className="text-lg font-semibold text-alien-green mb-4 flex items-center">
                    <Calendar className="mr-2" size={20} />
                    Career Progression
                  </h3>
                  <div className="space-y-3">
                    {roadmapContent.career_path.progression.map(
                      (step, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="flex items-center justify-center w-6 h-6 bg-alien-green text-royal-black rounded-full font-bold text-xs mt-1 shrink-0">
                            {index + 1}
                          </div>
                          <span className="text-gray-300">{step}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapDetailPage;
