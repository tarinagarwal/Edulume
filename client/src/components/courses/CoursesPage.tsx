import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Plus,
  BookOpen,
  Users,
  Clock,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  UserPlus,
  UserCheck,
  Loader2,
} from "lucide-react";
import SEO from "../seo/SEO";
import {
  getCourses,
  toggleCourseBookmark,
  enrollInCourse,
  unenrollFromCourse,
} from "../../utils/api";
import { Course, CoursesResponse } from "../../types";
import { isAuthenticated } from "../../utils/auth";
import { CardsGridSkeleton } from "../skeletons/CardsGridSkeleton";

const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [enrollingCourse, setEnrollingCourse] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [searchTerm, filter, sort, pagination.page, isAuth]); // Added isAuth dependency

  const checkAuth = async () => {
    const authenticated = await isAuthenticated();
    console.log("🔐 Auth check result:", authenticated);
    setIsAuth(authenticated);
  };

  const fetchCourses = async () => {
    // Don't fetch if auth state is still loading
    if (isAuth === null) {
      console.log("⏳ Auth state still loading, skipping course fetch");
      return;
    }

    try {
      setLoading(true);
      console.log("📚 Fetching courses with params:", {
        search: searchTerm || undefined,
        filter,
        sort,
        page: pagination.page,
        limit: pagination.limit,
        isAuth,
      });

      const response: CoursesResponse = await getCourses({
        search: searchTerm || undefined,
        filter,
        sort,
        page: pagination.page,
        limit: pagination.limit,
      });

      console.log("✅ Courses fetched:", response.courses.length, "courses");
      if (response.courses.length > 0) {
        console.log("📖 Sample course enrollment info:", {
          id: response.courses[0].id,
          title: response.courses[0].title,
          isBookmarked: response.courses[0].is_bookmarked,
          isEnrolled: response.courses[0].is_enrolled,
          bookmarkCount: response.courses[0].bookmark_count,
          enrollmentCount: response.courses[0].enrollment_count,
        });
      }

      setCourses(response.courses);
      setPagination(response.pagination);
    } catch (error) {
      console.error("❌ Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async (courseId: string) => {
    if (!isAuth) {
      console.log("❌ User not authenticated, cannot bookmark");
      return;
    }

    console.log("🔖 Toggling bookmark for course:", courseId);

    try {
      const response = await toggleCourseBookmark(courseId);
      console.log("✅ Bookmark response:", response);

      // Update the course in the local state
      setCourses((prevCourses) =>
        prevCourses.map((course) =>
          course.id === courseId
            ? {
                ...course,
                is_bookmarked: response.bookmarked,
                bookmark_count: response.bookmarked
                  ? course.bookmark_count + 1
                  : course.bookmark_count - 1,
              }
            : course
        )
      );
    } catch (error) {
      console.error("❌ Error toggling bookmark:", error);
      // You could add a toast notification here to inform the user
    }
  };

  const handleEnrollment = async (courseId: string, isEnrolled: boolean) => {
    if (!isAuth) {
      console.log("❌ User not authenticated, cannot enroll");
      return;
    }

    setEnrollingCourse(courseId);
    try {
      if (isEnrolled) {
        await unenrollFromCourse(courseId);
      } else {
        await enrollInCourse(courseId);
      }

      // Update the course in the local state
      setCourses((prevCourses) =>
        prevCourses.map((course) =>
          course.id === courseId
            ? {
                ...course,
                is_enrolled: !isEnrolled,
              }
            : course
        )
      );
    } catch (error) {
      console.error("❌ Error with enrollment:", error);
    } finally {
      setEnrollingCourse(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchCourses();
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
        title="Explore Courses"
        description="Browse AI-powered courses on programming, web development, data science, and more. Learn at your own pace with interactive content."
        keywords="online courses, programming tutorials, web development, data science, coding bootcamp"
      />
      <div className="min-h-screen bg-royal-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Courses</h1>
              <p className="text-gray-400">
                Discover and create comprehensive learning courses
              </p>
            </div>
            {isAuth && (
              <Link
                to="/courses/create"
                className="mt-4 sm:mt-0 bg-alien-green text-royal-black px-6 py-3 rounded-lg font-semibold hover:bg-alien-green/90 transition-colors duration-300 flex items-center space-x-2 shadow-alien-glow"
              >
                <Plus size={20} />
                <span>Create Course</span>
              </Link>
            )}
          </div>

          {/* Search and Filters */}
          <div className="bg-smoke-gray rounded-lg p-6 mb-8">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search courses by title, description, or topic..."
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
                  <option value="all">All Courses</option>
                  {isAuth && (
                    <>
                      <option value="my-courses">My Courses</option>
                      <option value="bookmarked">Bookmarked</option>
                      <option value="enrolled">Enrolled Courses</option>
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
              <CardsGridSkeleton count={9} />
            </div>
          )}

          {/* Courses Grid */}
          {!loading && (
            <>
              {courses.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">
                    No courses found
                  </h3>
                  <p className="text-gray-400 mb-6">
                    {filter === "my-courses"
                      ? "You haven't created any courses yet."
                      : filter === "bookmarked"
                      ? "You haven't bookmarked any courses yet."
                      : filter === "enrolled"
                      ? "You haven't enrolled in any courses yet."
                      : searchTerm
                      ? "Try adjusting your search terms."
                      : "Be the first to create a course!"}
                  </p>
                  {isAuth && (
                    <Link
                      to="/courses/create"
                      className="inline-flex items-center space-x-2 bg-alien-green text-royal-black px-6 py-3 rounded-lg font-semibold hover:bg-alien-green/90 transition-colors duration-300 shadow-alien-glow"
                    >
                      <Plus size={20} />
                      <span>Create Course</span>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="bg-smoke-gray rounded-lg overflow-hidden hover:shadow-lg hover:shadow-alien-green/20 transition-all duration-300 border border-smoke-light"
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-white mb-2 line-clamp-2">
                              {course.title}
                            </h3>

                            <p className="text-gray-300 text-sm line-clamp-3 mb-4">
                              {course.description}
                            </p>
                          </div>
                          {isAuth && (
                            <button
                              onClick={() => handleBookmark(course.id)}
                              className="ml-2 p-2 rounded-lg hover:bg-smoke-light transition-colors duration-200"
                            >
                              {course.is_bookmarked ? (
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
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <BookOpen size={16} />
                              <span>{course.chapter_count} chapters</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock size={16} />
                            <span>{formatDate(course.created_at)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <Link
                            to={`/courses/${course.id}`}
                            className="bg-smoke-light text-white px-4 py-2 rounded-lg font-medium hover:bg-royal-black transition-colors duration-300 text-sm border border-smoke-light"
                          >
                            View Course
                          </Link>

                          {/* Enrollment Button */}
                          {isAuth && (
                            <button
                              onClick={() =>
                                handleEnrollment(
                                  course.id,
                                  course.is_enrolled || false
                                )
                              }
                              disabled={enrollingCourse === course.id}
                              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-300 text-sm flex items-center space-x-1 ${
                                course.is_enrolled
                                  ? "bg-red-600 hover:bg-red-700 text-white"
                                  : "bg-alien-green text-royal-black hover:bg-alien-green/90 shadow-alien-glow"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {enrollingCourse === course.id ? (
                                <>
                                  <Loader2 className="animate-spin" size={16} />
                                  <span>
                                    {course.is_enrolled
                                      ? "Leaving..."
                                      : "Joining..."}
                                  </span>
                                </>
                              ) : course.is_enrolled ? (
                                <>
                                  <UserCheck size={16} />
                                  <span>Enrolled</span>
                                </>
                              ) : (
                                <>
                                  <UserPlus size={16} />
                                  <span>Enroll</span>
                                </>
                              )}
                            </button>
                          )}
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

export default CoursesPage;
