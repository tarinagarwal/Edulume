"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  MessageSquare,
  Plus,
  Search,
  Filter,
  TrendingUp,
  MessageCircle,
  Eye,
  Tag,
  User,
  Calendar,
  CheckCircle,
  X,
} from "lucide-react";
import { getDiscussions, getPopularTags } from "../utils/api";
import type { Discussion } from "../types/discussions";
import { DISCUSSION_CATEGORIES } from "../types/discussions";

const DiscussionsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [popularTags, setPopularTags] = useState<
    { tag: string; count: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter states
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "all"
  );
  const [selectedTag, setSelectedTag] = useState(searchParams.get("tag") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "recent");
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(
    Number.parseInt(searchParams.get("page") || "1")
  );
  const [totalPages, setTotalPages] = useState(1);
  const [totalDiscussions, setTotalDiscussions] = useState(0);

  useEffect(() => {
    fetchDiscussions();
    fetchPopularTags();
  }, [searchTerm, selectedCategory, selectedTag, sortBy, currentPage]);

  useEffect(() => {
    // Update URL params
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedTag) params.set("tag", selectedTag);
    if (sortBy !== "recent") params.set("sort", sortBy);
    if (currentPage > 1) params.set("page", currentPage.toString());

    setSearchParams(params);
  }, [searchTerm, selectedCategory, selectedTag, sortBy, currentPage]);

  const fetchDiscussions = async () => {
    try {
      setLoading(true);
      const response = await getDiscussions({
        category: selectedCategory === "all" ? undefined : selectedCategory,
        tag: selectedTag || undefined,
        search: searchTerm || undefined,
        sort: sortBy,
        page: currentPage,
        limit: 10,
      });

      setDiscussions(response.discussions);
      setTotalPages(response.pagination.pages);
      setTotalDiscussions(response.pagination.total);
    } catch (err: any) {
      setError("Failed to load discussions");
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularTags = async () => {
    try {
      const tags = await getPopularTags();
      setPopularTags(tags.slice(0, 10));
    } catch (err) {
      console.error("Failed to fetch popular tags:", err);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedTag("");
    setSortBy("recent");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm || selectedCategory !== "all" || selectedTag;

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getCategoryInfo = (category: string) => {
    return (
      DISCUSSION_CATEGORIES.find((cat) => cat.value === category) || {
        value: category,
        label: category,
        icon: "💬",
      }
    );
  };

  const parseTags = (tagsString?: string): string[] => {
    if (!tagsString) return [];
    try {
      return JSON.parse(tagsString);
    } catch {
      return [];
    }
  };

  if (loading && discussions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-alien-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-alien-green font-alien">Loading discussions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-alien font-bold glow-text mb-2">
              Discussion Forum
            </h1>
            <p className="text-gray-400">
              Ask questions, share knowledge, and help your peers
            </p>
          </div>
          <Link
            to="/discussions/new"
            className="alien-button flex items-center space-x-2 px-6 py-3"
          >
            <Plus size={20} />
            <span>Ask Question</span>
          </Link>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Desktop Sidebar - Hidden on mobile */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="space-y-6">
              {/* Categories */}
              <div className="smoke-card p-6 relative smoke-effect">
                <h3 className="text-lg font-alien font-bold text-alien-green mb-4 flex items-center">
                  <Filter className="mr-2" size={20} />
                  Categories
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-300 ${
                      selectedCategory === "all"
                        ? "bg-alien-green/20 text-alien-green"
                        : "text-gray-400 hover:bg-smoke-light hover:text-alien-green"
                    }`}
                  >
                    All Categories
                  </button>
                  {DISCUSSION_CATEGORIES.map((category) => (
                    <button
                      key={category.value}
                      onClick={() => setSelectedCategory(category.value)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-300 ${
                        selectedCategory === category.value
                          ? "bg-alien-green/20 text-alien-green"
                          : "text-gray-400 hover:bg-smoke-light hover:text-alien-green"
                      }`}
                    >
                      <span className="mr-2">{category.icon}</span>
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Filter Controls */}
            <div className="smoke-card p-6 mb-8 relative smoke-effect">
              {/* Search Bar */}
              <div className="relative mb-4">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search discussions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="alien-input w-full pl-10 pr-4"
                />
              </div>

              {/* Filter Controls */}
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className={`lg:hidden flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-300 ${
                    hasActiveFilters
                      ? "border-alien-green bg-alien-green/10 text-alien-green"
                      : "border-smoke-light text-gray-400 hover:border-alien-green hover:text-alien-green"
                  }`}
                >
                  <Filter size={16} />
                  <span>Filters</span>
                  {hasActiveFilters && (
                    <span className="bg-alien-green text-royal-black text-xs px-2 py-1 rounded-full">
                      {
                        [
                          searchTerm,
                          selectedCategory !== "all",
                          selectedTag,
                        ].filter(Boolean).length
                      }
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`hidden lg:flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-300 ${
                    showFilters || hasActiveFilters
                      ? "border-alien-green bg-alien-green/10 text-alien-green"
                      : "border-smoke-light text-gray-400 hover:border-alien-green hover:text-alien-green"
                  }`}
                >
                  <Filter size={16} />
                  <span>Advanced Filters</span>
                  {hasActiveFilters && (
                    <span className="bg-alien-green text-royal-black text-xs px-2 py-1 rounded-full">
                      {
                        [
                          searchTerm,
                          selectedCategory !== "all",
                          selectedTag,
                        ].filter(Boolean).length
                      }
                    </span>
                  )}
                </button>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="alien-input text-sm"
                  >
                    <option value="recent">Recent</option>
                    {/* <option value="popular">Popular</option> */}
                    <option value="answered">Most Answered</option>
                    <option value="unanswered">Unanswered</option>
                  </select>
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 transition-colors duration-300"
                  >
                    <X size={16} />
                    <span>Clear Filters</span>
                  </button>
                )}
              </div>

              {/* Desktop Advanced Filters */}
              {showFilters && (
                <div className="hidden lg:grid md:grid-cols-2 gap-4 pt-4 border-t border-smoke-light">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="alien-input w-full text-sm"
                    >
                      <option value="all">All Categories</option>
                      {DISCUSSION_CATEGORIES.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.icon} {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Results Count */}
              <div className="mt-4 text-sm text-gray-400">
                Showing {discussions.length} of {totalDiscussions} discussions
              </div>
            </div>

            {/* Discussions List */}
            {discussions.length === 0 ? (
              <div className="text-center py-16">
                <MessageSquare
                  className="mx-auto mb-4 text-gray-500"
                  size={64}
                />
                <h3 className="text-xl font-alien text-gray-400 mb-2">
                  {hasActiveFilters
                    ? "No discussions match your filters"
                    : "No discussions yet"}
                </h3>
                <p className="text-gray-500 mb-6">
                  {hasActiveFilters
                    ? "Try adjusting your search criteria"
                    : "Be the first to start a discussion!"}
                </p>
                {hasActiveFilters ? (
                  <button onClick={clearFilters} className="alien-button">
                    Clear All Filters
                  </button>
                ) : (
                  <Link to="/discussions/new" className="alien-button">
                    Ask First Question
                  </Link>
                )}
              </div>
            ) : (
              <div>
                <div className="max-h-[800px] overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-alien-green/30 scrollbar-track-smoke-light/20">
                  {discussions.map((discussion) => {
                    const categoryInfo = getCategoryInfo(discussion.category);
                    const tags = parseTags(discussion.tags);

                    return (
                      <div
                        key={discussion.id}
                        className="smoke-card p-6 relative smoke-effect hover:shadow-alien-glow transition-all duration-300"
                      >
                        <div className="flex items-start space-x-4">
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <Link
                                to={`/discussions/${discussion.id}`}
                                className="text-lg font-alien font-bold text-white hover:text-alien-green transition-colors duration-300 line-clamp-2"
                              >
                                {discussion.title}
                              </Link>
                              {discussion.has_best_answer === 1 && (
                                <CheckCircle
                                  className="text-alien-green ml-2 flex-shrink-0"
                                  size={20}
                                />
                              )}
                            </div>

                            <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                              {discussion.content.replace(/<[^>]*>/g, "")}
                            </p>

                            {/* Tags */}
                            {tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {tags.slice(0, 3).map((tag) => (
                                  <button
                                    key={tag}
                                    onClick={() => setSelectedTag(tag)}
                                    className="text-xs bg-smoke-light text-alien-green px-2 py-1 rounded-full hover:bg-alien-green/20 transition-colors duration-300"
                                  >
                                    #{tag}
                                  </button>
                                ))}
                                {tags.length > 3 && (
                                  <span className="text-xs text-gray-500">
                                    +{tags.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Meta Information */}
                            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <span className="text-lg">
                                  {categoryInfo.icon}
                                </span>
                                <span>{categoryInfo.label}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <User size={14} />
                                <span>{discussion.author_username}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar size={14} />
                                <span>
                                  {formatTimeAgo(discussion.created_at)}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MessageCircle size={14} />
                                <span>{discussion.answer_count} answers</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-8">
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                      className="px-3 py-2 rounded-lg border border-smoke-light text-gray-400 hover:border-alien-green hover:text-alien-green disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      Previous
                    </button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 rounded-lg border transition-all duration-300 ${
                            currentPage === page
                              ? "border-alien-green bg-alien-green/10 text-alien-green"
                              : "border-smoke-light text-gray-400 hover:border-alien-green hover:text-alien-green"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 rounded-lg border border-smoke-light text-gray-400 hover:border-alien-green hover:text-alien-green disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {showMobileFilters && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 lg:hidden">
            <div className="fixed inset-x-4 top-4 bottom-4 bg-royal-black border border-smoke-light rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-smoke-light">
                <h2 className="text-lg font-alien font-bold text-alien-green">
                  Filters & Categories
                </h2>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="text-gray-400 hover:text-white transition-colors duration-300"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-4 overflow-y-auto max-h-full space-y-6">
                {/* Categories */}
                <div>
                  <h3 className="text-md font-alien font-bold text-alien-green mb-3 flex items-center">
                    <Filter className="mr-2" size={18} />
                    Categories
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setSelectedCategory("all");
                        setShowMobileFilters(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-300 ${
                        selectedCategory === "all"
                          ? "bg-alien-green/20 text-alien-green"
                          : "text-gray-400 hover:bg-smoke-light hover:text-alien-green"
                      }`}
                    >
                      All Categories
                    </button>
                    {DISCUSSION_CATEGORIES.map((category) => (
                      <button
                        key={category.value}
                        onClick={() => {
                          setSelectedCategory(category.value);
                          setShowMobileFilters(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-300 ${
                          selectedCategory === category.value
                            ? "bg-alien-green/20 text-alien-green"
                            : "text-gray-400 hover:bg-smoke-light hover:text-alien-green"
                        }`}
                      >
                        <span className="mr-2">{category.icon}</span>
                        {category.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      clearFilters();
                      setShowMobileFilters(false);
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-red-400 hover:text-red-300 border border-red-400/30 rounded-lg transition-colors duration-300"
                  >
                    <X size={16} />
                    <span>Clear All Filters</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscussionsPage;
