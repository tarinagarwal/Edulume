import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  X,
  ExternalLink,
  Code,
  Briefcase,
  BookOpen,
  Database,
  Globe,
  Smartphone,
  Server,
  Brain,
  Layers,
  Zap,
  ChevronUp,
} from "lucide-react";

interface InterviewResource {
  id: string;
  title: string;
  url: string;
  category: string;
  subcategory?: string;
  description?: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced" | "All Levels";
  type: "Questions" | "Tutorial" | "Practice" | "Guide" | "Collection";
}

const InterviewResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<InterviewResource[]>([]);
  const [filteredResources, setFilteredResources] = useState<
    InterviewResource[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [sortBy, setSortBy] = useState<"title" | "category">("category");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showFilters, setShowFilters] = useState(false);

  // Get unique values for filter dropdowns
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);

  useEffect(() => {
    // Parse the interview.md content and create resource objects
    const parseInterviewResources = async () => {
      try {
        const response = await fetch("/interview.md");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const content = await response.text();
        // console.log("Fetched content length:", content.length);

        const parsedResources = parseMarkdownToResources(content);
        console.log("Parsed resources count:", parsedResources.length);
        setResources(parsedResources);

        // Extract unique values for filters
        const categories = [
          ...new Set(parsedResources.map((r) => r.category)),
        ].sort();
        const types = [...new Set(parsedResources.map((r) => r.type))].sort();

        setAvailableCategories(categories);
        setAvailableTypes(types);
      } catch (error) {
        console.error("Failed to load interview resources:", error);
      } finally {
        setLoading(false);
      }
    };

    parseInterviewResources();
  }, []);

  // Handle scroll for back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const parseMarkdownToResources = (content: string): InterviewResource[] => {
    const resources: InterviewResource[] = [];
    const lines = content.split("\n");
    let currentCategory = "";
    let currentSubcategory = "";
    let id = 1;

    // console.log("Total lines to parse:", lines.length);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // if (i < 20) console.log(`Line ${i}:`, line); // Debug first 20 lines

      // Main category (### heading)
      if (line.startsWith("### ")) {
        currentCategory = line.replace("### ", "").trim();
        currentSubcategory = "";
        // console.log("Found category:", currentCategory);
      }
      // Subcategory (#### heading) - not used in current structure but ready for future
      else if (line.startsWith("#### ")) {
        currentSubcategory = line.replace("#### ", "").trim();
      }
      // Resource link (- [title](url))
      else if (
        line.trim().startsWith("- [") &&
        line.includes("](") &&
        line.includes(")")
      ) {
        // console.log("Found potential resource line:", line);
        const match = line.trim().match(/^- \[(.*?)\]\((.*?)\)(.*)$/);
        if (match && currentCategory) {
          // console.log("Successfully matched resource:", match[1]);
          const [, title, url, description] = match;

          // Determine type based on title keywords
          let type: InterviewResource["type"] = "Questions";
          if (
            title.toLowerCase().includes("tutorial") ||
            title.toLowerCase().includes("guide")
          ) {
            type = "Tutorial";
          } else if (
            title.toLowerCase().includes("practice") ||
            title.toLowerCase().includes("exercise")
          ) {
            type = "Practice";
          } else if (
            title.toLowerCase().includes("collection") ||
            title.toLowerCase().includes("list")
          ) {
            type = "Collection";
          }

          // Determine difficulty based on title keywords
          let difficulty: InterviewResource["difficulty"] = "All Levels";
          if (
            title.toLowerCase().includes("beginner") ||
            title.toLowerCase().includes("basic")
          ) {
            difficulty = "Beginner";
          } else if (
            title.toLowerCase().includes("advanced") ||
            title.toLowerCase().includes("senior")
          ) {
            difficulty = "Advanced";
          } else if (
            title.toLowerCase().includes("essential") ||
            title.toLowerCase().includes("intermediate")
          ) {
            difficulty = "Intermediate";
          }

          resources.push({
            id: id.toString(),
            title: title.trim(),
            url: url.trim(),
            category: currentCategory,
            subcategory: currentSubcategory || undefined,
            description: description.trim() || undefined,
            difficulty,
            type,
          });
          // console.log(
          //   "Added resource:",
          //   title.trim(),
          //   "in category:",
          //   currentCategory
          // );
          id++;
        }
      }
    }

    // console.log("Final resources count:", resources.length);
    return resources;
  };

  // Filter and sort resources
  useEffect(() => {
    let filtered = [...resources];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (resource) =>
          resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resource.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (resource.description &&
            resource.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(
        (resource) => resource.category === selectedCategory
      );
    }

    // Apply type filter
    if (selectedType) {
      filtered = filtered.filter((resource) => resource.type === selectedType);
    }

    // Apply difficulty filter
    if (selectedDifficulty) {
      filtered = filtered.filter(
        (resource) => resource.difficulty === selectedDifficulty
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "category":
        default:
          comparison = a.category.localeCompare(b.category);
          if (comparison === 0) {
            comparison = a.title.localeCompare(b.title);
          }
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    setFilteredResources(filtered);
  }, [
    resources,
    searchTerm,
    selectedCategory,
    selectedType,
    selectedDifficulty,
    sortBy,
    sortOrder,
  ]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedType("");
    setSelectedDifficulty("");
    setSortBy("category");
    setSortOrder("asc");
  };

  const hasActiveFilters =
    searchTerm || selectedCategory || selectedType || selectedDifficulty;

  const getCategoryIcon = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes("javascript") || categoryLower.includes("js"))
      return <Code className="text-yellow-400" size={20} />;
    if (categoryLower.includes("python"))
      return <Code className="text-blue-400" size={20} />;
    if (categoryLower.includes("java"))
      return <Code className="text-red-400" size={20} />;
    if (
      categoryLower.includes("react") ||
      categoryLower.includes("angular") ||
      categoryLower.includes("vue")
    )
      return <Layers className="text-cyan-400" size={20} />;
    if (categoryLower.includes("node") || categoryLower.includes("backend"))
      return <Server className="text-green-400" size={20} />;
    if (
      categoryLower.includes("android") ||
      categoryLower.includes("ios") ||
      categoryLower.includes("mobile")
    )
      return <Smartphone className="text-purple-400" size={20} />;
    if (categoryLower.includes("database") || categoryLower.includes("sql"))
      return <Database className="text-orange-400" size={20} />;
    if (
      categoryLower.includes("web") ||
      categoryLower.includes("html") ||
      categoryLower.includes("css")
    )
      return <Globe className="text-pink-400" size={20} />;
    if (
      categoryLower.includes("algorithm") ||
      categoryLower.includes("data structure")
    )
      return <Brain className="text-indigo-400" size={20} />;
    return <Briefcase className="text-alien-green" size={20} />;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Questions":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "Tutorial":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "Practice":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "Guide":
        return "bg-orange-500/20 text-orange-300 border-orange-500/30";
      case "Collection":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-500/20 text-green-300";
      case "Intermediate":
        return "bg-yellow-500/20 text-yellow-300";
      case "Advanced":
        return "bg-red-500/20 text-red-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-alien-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-alien-green font-alien">
            Loading Interview Resources...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-alien font-semibold glow-text mb-2">
              Interview Resources
            </h1>
            <p className="text-gray-400">
              Comprehensive collection of technical interview preparation
              materials
            </p>
          </div>
        </div>

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
              placeholder="Search interview resources by title, category, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="alien-input w-full pl-10 pr-4"
            />
          </div>

          {/* Filter Toggle and Sort Controls */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-300 ${
                showFilters || hasActiveFilters
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
                      selectedCategory,
                      selectedType,
                      selectedDifficulty,
                    ].filter(Boolean).length
                  }
                </span>
              )}
            </button>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "title" | "category")
                }
                className="alien-input text-sm"
              >
                <option value="category">Category</option>
                <option value="title">Title</option>
              </select>
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="p-2 rounded-lg border border-smoke-light text-gray-400 hover:border-alien-green hover:text-alien-green transition-all duration-300"
              >
                {sortOrder === "asc" ? (
                  <SortAsc size={16} />
                ) : (
                  <SortDesc size={16} />
                )}
              </button>
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

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-smoke-light">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Technology/Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="alien-input w-full text-sm"
                >
                  <option value="">All Categories</option>
                  {availableCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Resource Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="alien-input w-full text-sm"
                >
                  <option value="">All Types</option>
                  {availableTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Difficulty Level
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="alien-input w-full text-sm"
                >
                  <option value="">All Levels</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="All Levels">All Levels</option>
                </select>
              </div>
            </div>
          )}

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-400">
            Showing {filteredResources.length} of {resources.length} resources
          </div>
        </div>

        {/* Category Navigation - Only show when not filtered by category */}
        {!selectedCategory && filteredResources.length > 0 && (
          <div className="smoke-card p-6 mb-8 relative smoke-effect">
            <h3 className="text-lg font-alien font-semibold text-white mb-4 flex items-center">
              <BookOpen className="mr-2 text-alien-green" size={20} />
              Quick Navigation
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {(() => {
                const categoryGroups = filteredResources.reduce(
                  (acc, resource) => {
                    if (!acc[resource.category]) {
                      acc[resource.category] = 0;
                    }
                    acc[resource.category]++;
                    return acc;
                  },
                  {} as Record<string, number>
                );

                return Object.entries(categoryGroups)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([category, count]) => (
                    <button
                      key={category}
                      onClick={() => {
                        const element = document.getElementById(
                          `category-${category.replace(/[^a-zA-Z0-9]/g, "-")}`
                        );
                        element?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }}
                      className="flex items-center space-x-2 p-3 rounded-lg border border-smoke-light hover:border-alien-green hover:bg-alien-green/5 transition-all duration-300 text-left group"
                    >
                      {getCategoryIcon(category)}
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-white group-hover:text-alien-green transition-colors truncate">
                          {category}
                        </span>
                        <span className="text-xs text-gray-400">
                          {count} resources
                        </span>
                      </div>
                    </button>
                  ));
              })()}
            </div>
          </div>
        )}

        {filteredResources.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="mx-auto mb-4 text-gray-500" size={64} />
            <h3 className="text-xl font-alien text-gray-400 mb-2">
              {hasActiveFilters
                ? "No resources match your filters"
                : "No resources available"}
            </h3>
            <p className="text-gray-500 mb-6">
              {hasActiveFilters
                ? "Try adjusting your search criteria or clearing filters"
                : "Interview resources are being loaded..."}
            </p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="alien-button">
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {(() => {
              // Group resources by category
              const groupedResources = filteredResources.reduce(
                (acc, resource) => {
                  if (!acc[resource.category]) {
                    acc[resource.category] = [];
                  }
                  acc[resource.category].push(resource);
                  return acc;
                },
                {} as Record<string, InterviewResource[]>
              );

              // Get sorted category names
              const sortedCategories = Object.keys(groupedResources).sort();

              return sortedCategories.map((category) => (
                <div
                  key={category}
                  id={`category-${category.replace(/[^a-zA-Z0-9]/g, "-")}`}
                  className="category-section scroll-mt-8"
                >
                  {/* Category Header */}
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="flex items-center space-x-3">
                      {getCategoryIcon(category)}
                      <h2 className="text-2xl font-alien font-semibold text-white glow-text">
                        {category}
                      </h2>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-alien-green/50 to-transparent"></div>
                    <span className="text-sm text-gray-400 bg-smoke-light px-3 py-1 rounded-full">
                      {groupedResources[category].length} resources
                    </span>
                  </div>

                  {/* Resources Grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupedResources[category].map((resource) => (
                      <div
                        key={resource.id}
                        className="smoke-card p-6 relative smoke-effect hover:shadow-alien-glow transition-all duration-300 flex flex-col h-full"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            {getCategoryIcon(resource.category)}
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-400">
                                {resource.category}
                              </span>
                              {resource.subcategory && (
                                <span className="text-xs text-gray-500">
                                  {resource.subcategory}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <span
                              className={`text-xs px-2 py-1 rounded-full border ${getTypeColor(
                                resource.type
                              )}`}
                            >
                              {resource.type}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(
                                resource.difficulty || "All Levels"
                              )}`}
                            >
                              {resource.difficulty || "All Levels"}
                            </span>
                          </div>
                        </div>

                        <h3 className="text-lg font-alien font-medium text-white mb-3 line-clamp-2 flex-grow">
                          {resource.title}
                        </h3>

                        {resource.description && (
                          <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                            {resource.description}
                          </p>
                        )}

                        <div className="mt-auto">
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="alien-button w-full text-center block group"
                          >
                            <ExternalLink
                              className="inline mr-2 group-hover:translate-x-1 transition-transform duration-200"
                              size={16}
                            />
                            Visit Resource
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        )}

        {/* Back to Top Button */}
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 bg-alien-green text-royal-black p-3 rounded-full shadow-alien-glow hover:bg-alien-green/90 transition-all duration-300 z-50 group"
            aria-label="Back to top"
          >
            <ChevronUp
              size={24}
              className="group-hover:-translate-y-1 transition-transform duration-200"
            />
          </button>
        )}
      </div>
    </div>
  );
};

export default InterviewResourcesPage;