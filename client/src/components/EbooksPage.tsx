import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Download,
  Calendar,
  User,
  FileText,
  Upload,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  X,
} from "lucide-react";
import { getEbooks } from "../utils/api";
import { EbookItem } from "../types";

const EbooksPage: React.FC = () => {
  const [ebooks, setEbooks] = useState<EbookItem[]>([]);
  const [filteredEbooks, setFilteredEbooks] = useState<EbookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "title" | "semester">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);

  // Get unique values for filter dropdowns
  const [availableCourses, setAvailableCourses] = useState<string[]>([]);
  const [availableDepartments, setAvailableDepartments] = useState<string[]>(
    []
  );

  useEffect(() => {
    const fetchEbooks = async () => {
      try {
        const data = await getEbooks();
        setEbooks(data);

        // Extract unique values for filters
        const courses = [
          ...new Set(
            data.filter((ebook) => ebook.course).map((ebook) => ebook.course!)
          ),
        ].sort();
        const departments = [
          ...new Set(
            data
              .filter((ebook) => ebook.department)
              .map((ebook) => ebook.department!)
          ),
        ].sort();

        setAvailableCourses(courses);
        setAvailableDepartments(departments);
      } catch (err: any) {
        setError("Failed to load E-books");
      } finally {
        setLoading(false);
      }
    };

    fetchEbooks();
  }, []);

  // Filter and sort E-books
  useEffect(() => {
    let filtered = [...ebooks];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (ebook) =>
          ebook.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ebook.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (ebook.course &&
            ebook.course.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (ebook.department &&
            ebook.department.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply semester filter
    if (selectedSemester) {
      filtered = filtered.filter(
        (ebook) => ebook.semester === selectedSemester
      );
    }

    // Apply course filter
    if (selectedCourse) {
      filtered = filtered.filter((ebook) => ebook.course === selectedCourse);
    }

    // Apply department filter
    if (selectedDepartment) {
      filtered = filtered.filter(
        (ebook) => ebook.department === selectedDepartment
      );
    }

    // Apply year filter
    if (selectedYear) {
      filtered = filtered.filter(
        (ebook) => ebook.year_of_study === selectedYear
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "semester":
          comparison = parseInt(a.semester) - parseInt(b.semester);
          break;
        case "date":
        default:
          comparison =
            new Date(a.upload_date).getTime() -
            new Date(b.upload_date).getTime();
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    setFilteredEbooks(filtered);
  }, [
    ebooks,
    searchTerm,
    selectedSemester,
    selectedCourse,
    selectedDepartment,
    selectedYear,
    sortBy,
    sortOrder,
  ]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSemester("");
    setSelectedCourse("");
    setSelectedDepartment("");
    setSelectedYear("");
    setSortBy("date");
    setSortOrder("desc");
  };

  const hasActiveFilters =
    searchTerm ||
    selectedSemester ||
    selectedCourse ||
    selectedDepartment ||
    selectedYear;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-alien-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-alien-green font-alien">Loading E-books...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-alien font-bold glow-text mb-2">
              E-book Library
            </h1>
            <p className="text-gray-400">
              Explore digital books and references
            </p>
          </div>
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
              placeholder="Search E-books by title, description, course, or department..."
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
            Showing {filteredEbooks.length} of {ebooks.length} E-books
          </div>
        </div>

        {filteredEbooks.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="mx-auto mb-4 text-gray-500" size={64} />
            <h3 className="text-xl font-alien text-gray-400 mb-2">
              {hasActiveFilters
                ? "No E-books match your filters"
                : "No E-books Available"}
            </h3>
            <p className="text-gray-500 mb-6">
              {hasActiveFilters
                ? "Try adjusting your search criteria or clearing filters"
                : "Be the first to upload an E-book to the vault!"}
            </p>
            {hasActiveFilters ? (
              <button onClick={clearFilters} className="alien-button">
                Clear All Filters
              </button>
            ) : (
              <Link to="/upload" className="alien-button">
                Upload First E-book
              </Link>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEbooks.map((ebook) => (
              <div
                key={ebook.id}
                className="smoke-card p-6 relative smoke-effect hover:shadow-alien-glow transition-all duration-300 flex flex-col h-full"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-alien-green rounded-lg flex items-center justify-center shadow-alien-glow">
                    <BookOpen className="text-royal-black" size={24} />
                  </div>
                  <span className="text-xs bg-smoke-light px-2 py-1 rounded-full text-alien-green">
                    Sem {ebook.semester}
                  </span>
                </div>

                <h3 className="text-lg font-alien font-bold text-white mb-2 line-clamp-2">
                  {ebook.title}
                </h3>

                <p className="text-gray-400 text-sm mb-4 line-clamp-3 flex-grow">
                  {ebook.description}
                </p>

                <div className="space-y-2 mb-4 text-xs text-gray-500 min-h-[60px]">
                  {ebook.course && (
                    <div className="flex items-center">
                      <FileText size={14} className="mr-2" />
                      <span>{ebook.course}</span>
                    </div>
                  )}
                  {ebook.department && (
                    <div className="flex items-center">
                      <User size={14} className="mr-2" />
                      <span>{ebook.department}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Calendar size={14} className="mr-2" />
                    <span>
                      {new Date(ebook.upload_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="mt-auto">
                  <a
                    href={ebook.blob_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="alien-button w-full text-center block"
                  >
                    <Download className="inline mr-2" size={16} />
                    Download E-book
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EbooksPage;
