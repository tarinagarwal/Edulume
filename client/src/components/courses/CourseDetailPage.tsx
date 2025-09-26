"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Bookmark,
  BookmarkCheck,
  Play,
  ChevronRight,
  ChevronDown,
  Loader2,
  UserPlus,
  UserCheck,
  CheckCircle,
  Circle,
  Award,
  TrendingUp,
} from "lucide-react";
import {
  getCourse,
  toggleCourseBookmark,
  generateChapterContent,
  deleteCourse,
  getUserProfile,
  enrollInCourse,
  unenrollFromCourse,
  updateChapterProgress,
} from "../../utils/api";
import type { Course } from "../../types";
import { isAuthenticated } from "../../utils/auth";

const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [generatingContent, setGeneratingContent] = useState<string | null>(
    null
  );
  const [generatingAllContent, setGeneratingAllContent] = useState(false);
  const [currentGeneratingIndex, setCurrentGeneratingIndex] = useState<
    number | null
  >(null);
  const [enrolling, setEnrolling] = useState(false);
  const [updatingProgress, setUpdatingProgress] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    if (id) {
      fetchCourse();
    }
  }, [id]);

  const checkAuth = async () => {
    const authenticated = await isAuthenticated();
    setIsAuth(authenticated);
  };

  const fetchCourse = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await getCourse(id);
      setCourse(response.course);
    } catch (error) {
      console.error("Error fetching course:", error);
      navigate("/courses");
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!course || !isAuth) return;

    try {
      const response = await toggleCourseBookmark(course.id);
      setCourse((prev) =>
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

  const handleGenerateContent = async (chapterId: string) => {
    if (!course) return;

    console.log("🎯 Starting content generation:", {
      courseId: course.id,
      chapterId,
      isOwner,
      currentUser: currentUser?.id,
      courseAuthor: course.authorId,
    });

    setGeneratingContent(chapterId);
    try {
      const response = await generateChapterContent(course.id, chapterId);

      // Update the chapter content in the course
      setCourse((prev) =>
        prev
          ? {
              ...prev,
              chapters: prev.chapters?.map((chapter) =>
                chapter.id === chapterId
                  ? { ...chapter, content: response.content }
                  : chapter
              ),
            }
          : null
      );

      // Expand the chapter to show the generated content
      setExpandedChapter(chapterId);
      console.log("✅ Content generation completed successfully");
    } catch (error) {
      console.error("❌ Error generating content:", error);
      alert(
        `Failed to generate chapter content: ${
          //@ts-ignore
          error.message || "Please try again."
        }`
      );
    } finally {
      setGeneratingContent(null);
    }
  };

  const handleGenerateAllContent = async () => {
    if (!course || !course.chapters) return;

    setGeneratingAllContent(true);
    setCurrentGeneratingIndex(0);

    try {
      const chaptersToGenerate = course.chapters.filter(
        (chapter) => !chapter.content
      );

      if (chaptersToGenerate.length === 0) {
        alert("All chapters already have content generated!");
        return;
      }

      console.log(
        `🚀 Starting pipeline generation for ${chaptersToGenerate.length} chapters`
      );

      for (let i = 0; i < chaptersToGenerate.length; i++) {
        const chapter = chaptersToGenerate[i];
        setCurrentGeneratingIndex(i);

        console.log(
          `📝 Generating content for chapter ${i + 1}/${
            chaptersToGenerate.length
          }: ${chapter.title}`
        );

        try {
          const response = await generateChapterContent(course.id, chapter.id);

          // Update the chapter content in the course
          setCourse((prev) =>
            prev
              ? {
                  ...prev,
                  chapters: prev.chapters?.map((ch) =>
                    ch.id === chapter.id
                      ? { ...ch, content: response.content }
                      : ch
                  ),
                }
              : null
          );

          console.log(`✅ Chapter ${i + 1} completed: ${chapter.title}`);

          // Small delay between generations to prevent rate limiting
          if (i < chaptersToGenerate.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(
            `❌ Failed to generate content for chapter: ${chapter.title}`,
            error
          );
          // Continue with next chapter even if one fails
          continue;
        }
      }

      console.log("🎉 All content generation completed!");
      // alert("All chapter content has been generated successfully!");
    } catch (error) {
      console.error("❌ Error in pipeline generation:", error);
      alert(
        //@ts-ignore
        `Pipeline generation failed: ${error.message || "Please try again."}`
      );
    } finally {
      setGeneratingAllContent(false);
      setCurrentGeneratingIndex(null);
    }
  };

  const handleDeleteCourse = async () => {
    if (!course) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this course? This action cannot be undone."
    );

    if (confirmed) {
      try {
        await deleteCourse(course.id);
        navigate("/courses");
      } catch (error) {
        console.error("Error deleting course:", error);
        alert("Failed to delete course. Please try again.");
      }
    }
  };

  const handleEnrollment = async () => {
    if (!course || !isAuth) return;

    setEnrolling(true);
    try {
      if (course.is_enrolled) {
        // Unenroll
        const confirmed = window.confirm(
          "Are you sure you want to unenroll from this course? All your progress will be lost."
        );
        if (confirmed) {
          await unenrollFromCourse(course.id);
          setCourse((prev) =>
            prev
              ? {
                  ...prev,
                  is_enrolled: false,
                  enrollment_data: null,
                  chapters: prev.chapters?.map((ch) => ({
                    ...ch,
                    isCompleted: false,
                    completedAt: null,
                  })),
                }
              : null
          );
        }
      } else {
        // Enroll
        const response = await enrollInCourse(course.id);
        setCourse((prev) =>
          prev
            ? {
                ...prev,
                is_enrolled: true,
                enrollment_data: response.enrollment,
              }
            : null
        );
      }
    } catch (error) {
      console.error("Error with enrollment:", error);
      alert(
        `Failed to ${
          course.is_enrolled ? "unenroll from" : "enroll in"
        } course. Please try again.`
      );
    } finally {
      setEnrolling(false);
    }
  };

  const handleChapterProgress = async (
    chapterId: string,
    isCompleted: boolean
  ) => {
    if (!course || !isAuth || !course.is_enrolled) return;

    setUpdatingProgress(chapterId);
    try {
      const response = await updateChapterProgress(
        course.id,
        chapterId,
        isCompleted
      );

      setCourse((prev) => {
        if (!prev) return null;

        const updatedChapters = prev.chapters?.map((ch) =>
          ch.id === chapterId
            ? {
                ...ch,
                isCompleted: isCompleted,
                completedAt: isCompleted ? new Date().toISOString() : null,
              }
            : ch
        );

        return {
          ...prev,
          chapters: updatedChapters,
          enrollment_data: prev.enrollment_data
            ? {
                ...prev.enrollment_data,
                progressPercentage: response.progress.progressPercentage,
                isCompleted: response.progress.isCourseCompleted,
                completedAt: response.progress.isCourseCompleted
                  ? new Date().toISOString()
                  : prev.enrollment_data.completedAt,
              }
            : null,
        };
      });
    } catch (error) {
      console.error("Error updating chapter progress:", error);
      alert("Failed to update progress. Please try again.");
    } finally {
      setUpdatingProgress(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Fix the ownership check - isAuth is boolean, not user object
  const [currentUser, setCurrentUser] = useState<any>(null);

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

  const isOwner =
    isAuth && course && currentUser && course.authorId === currentUser.id;

  if (loading) {
    return (
      <div className="min-h-screen bg-royal-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-alien-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-royal-black text-white flex items-center justify-center">
        <div className="text-center px-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">
            Course not found
          </h2>
          <p className="text-gray-400 mb-4 text-sm sm:text-base">
            The course you're looking for doesn't exist.
          </p>
          <Link
            to="/courses"
            className="bg-alien-green text-royal-black px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-alien-green/90 transition-colors duration-300 text-sm sm:text-base"
          >
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-royal-black text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 sm:mb-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/courses")}
              className="mr-3 sm:mr-4 p-2 rounded-lg hover:bg-smoke-gray transition-colors duration-200"
            >
              <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1 sm:mb-2 break-words">
                {course.title}
              </h1>
              <div className="flex items-center space-x-2 sm:space-x-4 text-gray-400 text-xs sm:text-sm">
                <div className="flex items-center space-x-1">
                  <Clock size={14} className="sm:w-4 sm:h-4" />
                  <span className="truncate">
                    {formatDate(course.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 sm:gap-3 flex-shrink-0">
            {/* Enrollment Button - Available for all authenticated users */}
            {isAuth && (
              <button
                onClick={handleEnrollment}
                disabled={enrolling}
                className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg font-semibold transition-colors duration-300 flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm lg:text-base ${
                  course.is_enrolled
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-alien-green text-royal-black hover:bg-alien-green/90 shadow-alien-glow"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {enrolling ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">
                      {course.is_enrolled ? "Unenrolling..." : "Enrolling..."}
                    </span>
                  </>
                ) : course.is_enrolled ? (
                  <>
                    <UserCheck size={16} className="sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Unenroll</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={16} className="sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Enroll</span>
                  </>
                )}
              </button>
            )}

            {/* Bookmark Button */}
            {isAuth && (
              <button
                onClick={handleBookmark}
                className="p-2 sm:p-3 rounded-lg hover:bg-smoke-gray transition-colors duration-200"
              >
                {course.is_bookmarked ? (
                  <BookmarkCheck className="text-alien-green w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <Bookmark className="text-gray-400 hover:text-alien-green w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {/* Course Description */}
          <div className="bg-smoke-gray rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
              About This Course
            </h2>
            <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
              {course.description}
            </p>
          </div>

          {/* Enrollment Status and Progress */}
          {isAuth && course.is_enrolled && course.enrollment_data && (
            <div className="bg-smoke-gray rounded-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
                <h2 className="text-lg sm:text-xl font-semibold flex items-center space-x-2">
                  <TrendingUp className="text-alien-green w-5 h-5 sm:w-6 sm:h-6" />
                  <span>Your Progress</span>
                </h2>
                {course.enrollment_data.isCompleted && (
                  <div className="flex items-center space-x-2 text-alien-green">
                    <Award size={18} className="sm:w-5 sm:h-5" />
                    <span className="font-semibold text-sm sm:text-base">
                      Completed!
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-3 sm:space-y-4">
                {/* Progress Bar */}
                <div className="w-full bg-royal-black rounded-full h-2 sm:h-3">
                  <div
                    className="bg-alien-green h-2 sm:h-3 rounded-full transition-all duration-300 shadow-alien-glow"
                    style={{
                      width: `${course.enrollment_data.progressPercentage}%`,
                    }}
                  ></div>
                </div>

                <div className="flex justify-between text-xs sm:text-sm text-gray-300">
                  <span>
                    {course.chapters?.filter((ch) => ch.isCompleted).length ||
                      0}{" "}
                    of {course.chapters?.length || 0} chapters completed
                  </span>
                  <span>{course.enrollment_data.progressPercentage}%</span>
                </div>

                {/* Course Completion Certificate */}
                {course.enrollment_data.isCompleted && (
                  <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-alien-green/10 border border-alien-green/30 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <Award className="text-alien-green w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                        <div>
                          <h3 className="text-alien-green font-semibold text-sm sm:text-base">
                            Congratulations!
                          </h3>
                          <p className="text-gray-300 text-xs sm:text-sm">
                            You've completed this course
                          </p>
                        </div>
                      </div>
                      <button className="bg-alien-green text-royal-black px-3 sm:px-4 py-2 rounded-lg font-semibold hover:bg-alien-green/90 transition-colors duration-300 shadow-alien-glow text-xs sm:text-sm">
                        Get Certificate
                      </button>
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-400">
                  Enrolled on{" "}
                  {new Date(
                    course.enrollment_data.enrolledAt
                  ).toLocaleDateString()}
                  {course.enrollment_data.completedAt && (
                    <span>
                      {" "}
                      • Completed on{" "}
                      {new Date(
                        course.enrollment_data.completedAt
                      ).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Chapters */}
          <div className="bg-smoke-gray rounded-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold">
                Course Content ({course.chapters?.length || 0} chapters)
              </h2>

              {isOwner &&
                course.chapters &&
                course.chapters.length > 0 &&
                course.chapters.some((ch) => !ch.content) && (
                  <button
                    onClick={handleGenerateAllContent}
                    disabled={generatingAllContent}
                    className="bg-alien-green text-royal-black px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg font-semibold hover:bg-alien-green/90 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 sm:space-x-2 shadow-alien-glow text-xs sm:text-sm lg:text-base"
                  >
                    {generatingAllContent ? (
                      <>
                        <Loader2 className="animate-spin w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline">Generating...</span>
                      </>
                    ) : (
                      <>
                        <span>
                          <span className="hidden sm:inline">
                            Generate Content
                          </span>
                          <span className="sm:hidden">Generate</span>
                          {course.chapters && (
                            <span className="ml-1">
                              (
                              {
                                course.chapters.filter((ch) => !ch.content)
                                  .length
                              }
                              )
                            </span>
                          )}
                        </span>
                      </>
                    )}
                  </button>
                )}
            </div>

            {/* Enrollment Required Message */}
            {isAuth && !course.is_enrolled && (
              <div className="mb-4 sm:mb-6 bg-alien-green/10 border border-alien-green/30 rounded-lg p-3 sm:p-4">
                <div className="flex items-start space-x-2">
                  <UserPlus className="text-alien-green w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-alien-green font-medium text-xs sm:text-sm">
                    Enroll in this course to track your progress and mark
                    chapters as completed. After completion, you'll be able to
                    generate a certificate after passing a test.
                  </span>
                </div>
              </div>
            )}

            {/* Show completion message if all chapters have content. Add logic to show it for one time*/}
            
            
            {isOwner && 
              course.chapters &&
              course.chapters.length > 0 &&
              course.chapters.every((ch) => ch.content) && (
                <div className="mb-4 sm:mb-6 bg-alien-green/10 border border-alien-green/30 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-alien-green rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 text-royal-black"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-alien-green font-medium text-xs sm:text-sm">
                      All course content has been generated successfully!
                    </span>

                  </div>
                </div>
              )}

            {course.chapters && course.chapters.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {course.chapters.map((chapter, index) => (
                  <div
                    key={chapter.id}
                    className="border border-smoke-light rounded-lg overflow-hidden"
                  >
                    <div className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-royal-black/50 transition-colors duration-200">
                      <button
                        onClick={() =>
                          setExpandedChapter(
                            expandedChapter === chapter.id ? null : chapter.id
                          )
                        }
                        className="flex-1 flex items-center justify-between text-left min-w-0"
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                          <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-alien-green text-royal-black rounded-full font-semibold text-xs sm:text-sm flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <h3 className="font-medium text-white flex items-center space-x-2 text-sm sm:text-base">
                              <span className="truncate">{chapter.title}</span>
                              {chapter.isCompleted && (
                                <CheckCircle
                                  className="text-alien-green flex-shrink-0"
                                  size={14}
                                />
                              )}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-400 line-clamp-2">
                              {chapter.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 ml-2">
                          {generatingAllContent &&
                            currentGeneratingIndex !== null &&
                            //@ts-ignore
                            course.chapters.filter((ch) => !ch.content)[
                              currentGeneratingIndex
                            ]?.id === chapter.id && (
                              <div className="flex items-center space-x-2">
                                <Loader2
                                  className="animate-spin text-alien-green"
                                  size={14}
                                />
                              </div>
                            )}
                          {chapter.content && !generatingAllContent && (
                            <Play className="text-alien-green" size={14} />
                          )}
                          {expandedChapter === chapter.id ? (
                            <ChevronDown size={18} className="sm:w-5 sm:h-5" />
                          ) : (
                            <ChevronRight size={18} className="sm:w-5 sm:h-5" />
                          )}
                        </div>
                      </button>

                      {/* Progress Checkbox - Separate from expansion button */}
                      {isAuth && course.is_enrolled && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChapterProgress(
                              chapter.id,
                              !chapter.isCompleted
                            );
                          }}
                          disabled={updatingProgress === chapter.id}
                          className="ml-2 p-1.5 sm:p-2 rounded hover:bg-royal-black/50 transition-colors duration-200 disabled:opacity-50 flex-shrink-0"
                        >
                          {updatingProgress === chapter.id ? (
                            <Loader2
                              className="animate-spin text-alien-green"
                              size={14}
                            />
                          ) : chapter.isCompleted ? (
                            <CheckCircle
                              className="text-alien-green"
                              size={14}
                            />
                          ) : (
                            <Circle
                              className="text-gray-400 hover:text-alien-green"
                              size={14}
                            />
                          )}
                        </button>
                      )}
                    </div>

                    {expandedChapter === chapter.id && (
                      <div className="border-t border-smoke-light p-3 sm:p-4 bg-royal-black/30">
                        {chapter.content ? (
                          <div className="space-y-3 sm:space-y-4">
                            {/* Progress Button for Enrolled Users */}
                            {isAuth && course.is_enrolled && (
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4 p-3 bg-smoke-gray rounded-lg">
                                <div className="flex items-center space-x-2">
                                  {chapter.isCompleted ? (
                                    <CheckCircle
                                      className="text-alien-green flex-shrink-0"
                                      size={18}
                                    />
                                  ) : (
                                    <Circle
                                      className="text-gray-400 flex-shrink-0"
                                      size={18}
                                    />
                                  )}
                                  <span className="text-xs sm:text-sm font-medium">
                                    {chapter.isCompleted
                                      ? "Chapter Completed"
                                      : "Mark as Completed"}
                                  </span>
                                </div>
                                <button
                                  onClick={() =>
                                    handleChapterProgress(
                                      chapter.id,
                                      !chapter.isCompleted
                                    )
                                  }
                                  disabled={updatingProgress === chapter.id}
                                  className={`px-3 sm:px-4 py-2 rounded-lg font-semibold transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm ${
                                    chapter.isCompleted
                                      ? "bg-gray-600 hover:bg-gray-700 text-white"
                                      : "bg-alien-green text-royal-black hover:bg-alien-green/90 shadow-alien-glow"
                                  }`}
                                >
                                  {updatingProgress === chapter.id ? (
                                    <>
                                      <Loader2
                                        className="animate-spin"
                                        size={14}
                                      />
                                      <span className="hidden sm:inline">
                                        Updating...
                                      </span>
                                    </>
                                  ) : chapter.isCompleted ? (
                                    <>
                                      <CheckCircle size={14} />
                                      <span className="hidden sm:inline">
                                        Mark Incomplete
                                      </span>
                                      <span className="sm:hidden">
                                        Incomplete
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <Circle size={14} />
                                      <span className="hidden sm:inline">
                                        Mark Completed
                                      </span>
                                      <span className="sm:hidden">
                                        Complete
                                      </span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}

                            <div className="prose prose-invert prose-sm sm:prose-base max-w-none">
                              <ReactMarkdown>{chapter.content}</ReactMarkdown>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-6 sm:py-8">
                            <BookOpen
                              className="mx-auto text-gray-400 mb-3 sm:mb-4"
                              size={40}
                            />
                            <p className="text-gray-400 mb-3 sm:mb-4 text-sm sm:text-base">
                              Content for this chapter hasn't been generated
                              yet.
                            </p>
                            {isOwner && (
                              <p className="text-xs sm:text-sm text-gray-500">
                                Use the "Generate All Content" button above to
                                create content for all chapters.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <BookOpen
                  className="mx-auto text-gray-400 mb-3 sm:mb-4"
                  size={40}
                />
                <p className="text-gray-400 text-sm sm:text-base">
                  No chapters available for this course.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
