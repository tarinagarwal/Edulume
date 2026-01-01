import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Download,
  Calendar,
  User,
  BookOpen,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import SEO from "../seo/SEO";
import { getPDFs } from "../../utils/api";
import { PDFItem } from "../../types";
import { isAuthenticated } from "../../utils/auth";
import { useDebounce } from "../../hooks/useDebounce";
import { CardsGridSkeleton } from "../skeletons/CardsGridSkeleton";

// Memoized PDF Card Component
const PDFCard = React.memo(({ pdf }: { pdf: PDFItem }) => (
  <div className="smoke-card p-6 relative smoke-effect hover:shadow-alien-glow transition-all duration-300 flex flex-col h-full">
    <div className="flex items-start justify-between mb-4">
      <div className="w-12 h-12 bg-alien-green rounded-lg flex items-center justify-center shadow-alien-glow">
        <FileText className="text-royal-black" size={24} />
      </div>
      <span className="text-xs bg-smoke-light px-2 py-1 rounded-full text-alien-green">
        Sem {pdf.semester}
      </span>
    </div>

    <h3 className="text-lg font-alien font-bold text-white mb-2 line-clamp-2">
      {pdf.title}
    </h3>

    <p className="text-gray-400 text-sm mb-4 line-clamp-3 flex-grow">
      {pdf.description}
    </p>

    <div className="space-y-2 mb-4 text-xs text-gray-500 min-h-[60px]">
      {pdf.course && (
        <div className="flex items-center">
          <BookOpen size={14} className="mr-2" />
          <span>{pdf.course}</span>
        </div>
      )}
      {pdf.department && (
        <div className="flex items-center">
          <User size={14} className="mr-2" />
          <span>{pdf.department}</span>
        </div>
      )}
      <div className="flex items-center">
        <Calendar size={14} className="mr-2" />
        <span>{new Date(pdf.upload_date).toLocaleDateString()}</span>
      </div>
    </div>

    <div className="mt-auto">
      <a
        href={pdf.blob_url}
        target="_blank"
        rel="noopener noreferrer"
        className="alien-button w-full text-center block"
      >
        <Download className="inline mr-2" size={16} />
        Download PDF
      </a>
    </div>
  </div>
));

PDFCard.displayName = "PDFCard";

const PDFsPage: React.FC = () => {
  const [pdfs, setPdfs] = useState<PDFItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState("");
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "title" | "semester">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);

  // Available filter options from server
  const [availableCourses, setAvailableCourses] = useState<string[]>([]);
  const [availableDepartments, setAvailableDepartments] = useState<string[]>(
    []
  );

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      setIsAuth(authenticated);

      if (authenticated) {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || "/api";
          const token = localStorage.getItem("auth_token");
          const response = await fetch(`${apiUrl}/auth/profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          if (response.ok) {
            const data = await response.json();
            setIsAdmin(data.user?.is_admin || false);
          }
        } catch (error) {
          console.error("Failed to check admin status:", error);
        }
      }
    };
    checkAuth();
  }, []);

  // Fetch PDFs with server-side filtering and pagination
  const fetchPDFs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPDFs({
        page: currentPage,
        limit: 50,
        search: debouncedSearchTerm,
        semester: selectedSemester,
        course: selectedCourse,
        department: selectedDepartment,
        year_of_study: selectedYear,
        sortBy,
        sortOrder,
      });

      setPdfs(data.pdfs);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.total);
      setHasMore(data.pagination.hasMore);
      setAvailableCourses(data.filters.availableCourses);
      setAvailableDepartments(data.filters.availableDepartments);
      setIsInitialLoad(false);
    } catch (err: any) {
      setError("Failed to load PDFs");
      console.error("Error fetching PDFs:", err);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    debouncedSearchTerm,
    selectedSemester,
    selectedCourse,
    selectedDepartment,
    selectedYear,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    fetchPDFs();
  }, [fetchPDFs]);

  // Reset to page 1 when filters change (but not on initial mount)
  useEffect(() => {
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedSearchTerm,
    selectedSemester,
    selectedCourse,
    selectedDepartment,
    selectedYear,
    sortBy,
    sortOrder,
  ]);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedSemester("");
    setSelectedCourse("");
    setSelectedDepartment("");
    setSelectedYear("");
    setSortBy("date");
    setSortOrder("desc");
    setCurrentPage(1);
  }, []);

  const hasActiveFilters = useMemo(
    () =>
      searchTerm ||
      selectedSemester ||
      selectedCourse ||
      selectedDepartment ||
      selectedYear,
    [
      searchTerm,
      selectedSemester,
      selectedCourse,
      selectedDepartment,
      selectedYear,
    ]
  );

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (isInitialLoad && loading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-alien font-bold glow-text mb-2">
                PDF Collection
              </h1>
              <p className="text-gray-400">
                Discover and download academic resources
              </p>
            </div>
            {isAuth && isAdmin && (
              <Link
                to="/upload?type=pdf"
                className="bg-alien-green text-royal-black px-6 py-3 rounded-lg font-semibold hover:bg-alien-green/90 transition-colors duration-300 flex items-center space-x-2 shadow-alien-glow whitespace-nowrap"
              >
                <Plus size={20} />
                <span className="hidden sm:inline">Upload PDF</span>
                <span className="sm:hidden">Upload</span>
              </Link>
            )}
          </div>
          <CardsGridSkeleton count={9} />
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Free Programming PDFs"
        description="Download free programming PDFs, tutorials, and technical documentation. Resources for developers, students, and tech enthusiasts."
        keywords="free programming pdfs, coding tutorials, tech documentation, developer resources"
      />
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-alien font-bold glow-text mb-2">
                PDF Collection
              </h1>
              <p className="text-gray-400">
                Discover and download academic resources
              </p>
            </div>
            {isAuth && isAdmin && (
              <Link
                to="/upload?type=pdf"
                className="bg-alien-green text-royal-black px-6 py-3 rounded-lg font-semibold hover:bg-alien-green/90 transition-colors duration-300 flex items-center space-x-2 shadow-alien-glow whitespace-nowrap"
              >
                <Plus size={20} />
                <span className="hidden sm:inline">Upload PDF</span>
                <span className="sm:hidden">Upload</span>
              </Link>
            )}
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

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
                placeholder="Search PDFs by title, description, course, or department..."
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
                        selectedSemester,
                        selectedCourse,
                        selectedDepartment,
                        selectedYear,
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
                    setSortBy(e.target.value as "date" | "title" | "semester")
                  }
                  className="alien-input text-sm"
                >
                  <option value="date">Upload Date</option>
                  <option value="title">Title</option>
                  <option value="semester">Semester</option>
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
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-smoke-light">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Semester
                  </label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="alien-input w-full text-sm"
                  >
                    <option value="">All Semesters</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem.toString()}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Course
                  </label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="alien-input w-full text-sm"
                  >
                    <option value="">All Courses</option>
                    {availableCourses.map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Department
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="alien-input w-full text-sm"
                  >
                    <option value="">All Departments</option>
                    {availableDepartments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Year of Study
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="alien-input w-full text-sm"
                  >
                    <option value="">All Years</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                    <option value="5">5th Year</option>
                  </select>
                </div>
              </div>
            )}

            {/* Results Count */}
            <div className="mt-4 text-sm text-gray-400">
              Showing {pdfs.length} of {totalCount} PDFs
              {/* {loading && <span className="ml-2 animate-pulse">Loading...</span>} */}
            </div>
          </div>

          {pdfs.length === 0 && !loading ? (
            <div className="text-center py-16">
              <FileText className="mx-auto mb-4 text-gray-500" size={64} />
              <h3 className="text-xl font-alien text-gray-400 mb-2">
                {hasActiveFilters
                  ? "No PDFs match your filters"
                  : "No PDFs Available"}
              </h3>
              <p className="text-gray-500 mb-6">
                {hasActiveFilters
                  ? "Try adjusting your search criteria or clearing filters"
                  : "Be the first to upload a PDF to the vault!"}
              </p>
              {hasActiveFilters ? (
                <button onClick={clearFilters} className="alien-button">
                  Clear All Filters
                </button>
              ) : isAuth && isAdmin ? (
                <Link to="/upload?type=pdf" className="alien-button">
                  Upload First PDF
                </Link>
              ) : isAuth ? (
                <p className="text-gray-400 text-sm">
                  Only admins can upload PDFs
                </p>
              ) : (
                <Link to="/auth" className="alien-button">
                  Login to View PDFs
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pdfs.map((pdf) => (
                  <PDFCard key={pdf.id} pdf={pdf} />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="px-4 py-2 rounded-lg border border-smoke-light text-gray-400 hover:border-alien-green hover:text-alien-green transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          disabled={loading}
                          className={`px-4 py-2 rounded-lg border transition-all duration-300 ${
                            currentPage === pageNum
                              ? "border-alien-green bg-alien-green/10 text-alien-green"
                              : "border-smoke-light text-gray-400 hover:border-alien-green hover:text-alien-green"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!hasMore || loading}
                    className="px-4 py-2 rounded-lg border border-smoke-light text-gray-400 hover:border-alien-green hover:text-alien-green transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Next
                    <ChevronRight size={16} />
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

export default PDFsPage;
