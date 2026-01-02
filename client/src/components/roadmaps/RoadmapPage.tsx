import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Plus,
  Map,
  Clock,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  Eye,
  User,
} from "lucide-react";
import { getRoadmaps, toggleRoadmapBookmark } from "../../utils/api";
import { Roadmap, RoadmapsResponse } from "../../types";
import SEO from "../seo/SEO";
import { isAuthenticated } from "../../utils/auth";
import { RoadmapSkeleton } from "../skeletons/RoadmapSkeleton";

const RoadmapsPage: React.FC = () => {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    fetchRoadmaps();
  }, [searchTerm, filter, sort, pagination.page]);

  const checkAuth = async () => {
    const authenticated = await isAuthenticated();
    setIsAuth(authenticated);
  };

  const fetchRoadmaps = async () => {
    try {
      setLoading(true);
      const response: RoadmapsResponse = await getRoadmaps({
        search: searchTerm || undefined,
        filter,
        sort,
        page: pagination.page,
        limit: pagination.limit,
      });

      setRoadmaps(response.roadmaps);
      setPagination(response.pagination);
    } catch (error) {
      console.error("❌ Error fetching roadmaps:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async (roadmapId: string) => {
    if (!isAuth) {
      return;
    }

    try {
      const response = await toggleRoadmapBookmark(roadmapId);

      setRoadmaps((prevRoadmaps) =>
        prevRoadmaps.map((roadmap) =>
          roadmap.id === roadmapId
            ? {
                ...roadmap,
                is_bookmarked: response.bookmarked,
                bookmark_count: response.bookmarked
                  ? roadmap.bookmark_count + 1
                  : roadmap.bookmark_count - 1,
              }
            : roadmap
        )
      );
    } catch (error) {
      console.error("❌ Error toggling bookmark:", error);
    }
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <SEO
        title="Learning Roadmaps"
        description="Follow structured learning paths for web development, data science, DevOps, and more. Step-by-step guides to master tech skills."
        keywords="learning roadmap, developer path, programming guide, career roadmap, tech skills"
      />
      <div className="min-h-screen bg-royal-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
              <h1 className="text-4xl font-alien font-bold glow-text mb-2">
                Learning Roadmaps
              </h1>
              <p className="text-gray-400">
                Discover comprehensive learning paths and create your own
              </p>
            </div>
            {isAuth && (
              <Link
                to="/roadmaps/create"
                className="mt-4 sm:mt-0 bg-alien-green text-royal-black px-6 py-3 rounded-lg font-semibold hover:bg-alien-green/90 transition-colors duration-300 flex items-center space-x-2 shadow-alien-glow"
              >
                <Plus size={20} />
                <span>Create Roadmap</span>
              </Link>
            )}
          </div>

          {/* Search and Filters */}
          <div className="bg-smoke-gray rounded-lg p-6 mb-8">
            <form className="mb-4">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search roadmaps by title, description, or topic..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-royal-black border border-smoke-light rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-alien-green focus:ring-1 focus:ring-alien-green"
                />
              </div>
            </form>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Filter Dropdown */}
              <div className="relative">
                <select
                  value={filter}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="appearance-none bg-royal-black border border-smoke-light rounded-lg px-4 py-2 pr-8 text-white focus:outline-none focus:border-alien-green focus:ring-1 focus:ring-alien-green"
                >
                  <option value="all">All Roadmaps</option>
                  {isAuth && (
                    <>
                      <option value="bookmarked">Bookmarked</option>
                    </>
                  )}
                </select>
                <ChevronDown
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={16}
                />
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="appearance-none bg-royal-black border border-smoke-light rounded-lg px-4 py-2 pr-8 text-white focus:outline-none focus:border-alien-green focus:ring-1 focus:ring-alien-green"
                >
                  <option value="recent">Most Recent</option>
                  <option value="popular">Most Popular</option>
                  <option value="oldest">Oldest First</option>
                </select>
                <ChevronDown
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={16}
                />
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="py-6">
              <RoadmapSkeleton count={6} />
            </div>
          )}
          
          {/* Roadmaps Grid */}
          {!loading && (
            <>
              {roadmaps.length === 0 ? (
                <div className="text-center py-12">
                  <Map className="mx-auto text-gray-400 mb-4" size={48} />
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">
                    No roadmaps found
                  </h3>
                  <p className="text-gray-400 mb-6">
                    {filter === "my-roadmaps"
                      ? "You haven't created any roadmaps yet."
                      : filter === "bookmarked"
                      ? "You haven't bookmarked any roadmaps yet."
                      : searchTerm
                      ? "Try adjusting your search terms."
                      : "Be the first to create a roadmap!"}
                  </p>
                  {isAuth && (
                    <Link
                      to="/roadmaps/create"
                      className="inline-flex items-center space-x-2 bg-alien-green text-royal-black px-6 py-3 rounded-lg font-semibold hover:bg-alien-green/90 transition-colors duration-300 shadow-alien-glow"
                    >
                      <Plus size={20} />
                      <span>Create Roadmap</span>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {roadmaps.map((roadmap) => (
                    <div
                      key={roadmap.id}
                      className="bg-smoke-gray rounded-lg overflow-hidden hover:shadow-lg hover:shadow-alien-green/20 transition-all duration-300 border border-smoke-light"
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="w-12 h-12 bg-alien-green rounded-lg flex items-center justify-center mb-4 shadow-alien-glow">
                              <Map className="text-royal-black" size={24} />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2 line-clamp-2">
                              {roadmap.title}
                            </h3>
                            <p className="text-gray-300 text-sm line-clamp-3 mb-4">
                              {roadmap.description}
                            </p>
                          </div>
                          {isAuth && (
                            <button
                              onClick={() => handleBookmark(roadmap.id)}
                              className="ml-2 p-2 rounded-lg hover:bg-smoke-light transition-colors duration-200"
                            >
                              {roadmap.is_bookmarked ? (
                                <BookmarkCheck
                                  className="text-alien-green"
                                  size={20}
                                />
                              ) : (
                                <Bookmark
                                  className="text-gray-400 hover:text-alien-green"
                                  size={20}
                                />
                              )}
                            </button>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                          <div className="flex items-center space-x-1">
                            <Clock size={16} />
                            <span>{formatDate(roadmap.created_at)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <Link
                            to={`/roadmaps/${roadmap.id}`}
                            className="bg-alien-green text-royal-black px-4 py-2 rounded-lg font-medium hover:bg-alien-green/90 transition-colors duration-300 text-sm"
                          >
                            View Roadmap
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center items-center space-x-2">
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: Math.max(1, prev.page - 1),
                      }))
                    }
                    disabled={pagination.page === 1}
                    className="px-4 py-2 bg-smoke-gray border border-smoke-light rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-smoke-light transition-colors duration-200"
                  >
                    Previous
                  </button>

                  <div className="flex space-x-1">
                    {Array.from(
                      { length: Math.min(5, pagination.pages) },
                      (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() =>
                              setPagination((prev) => ({ ...prev, page }))
                            }
                            className={`px-3 py-2 rounded-lg transition-colors duration-200 ${
                              pagination.page === page
                                ? "bg-alien-green text-royal-black"
                                : "bg-smoke-gray border border-smoke-light text-white hover:bg-smoke-light"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      }
                    )}
                  </div>

                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: Math.min(prev.pages, prev.page + 1),
                      }))
                    }
                    disabled={pagination.page === pagination.pages}
                    className="px-4 py-2 bg-smoke-gray border border-smoke-light rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-smoke-light transition-colors duration-200"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default RoadmapsPage;
