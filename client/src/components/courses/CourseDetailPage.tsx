import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  BookOpen,
  User,
  Clock,
  Eye,
  Bookmark,
  BookmarkCheck,
  Play,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Loader2,
  Edit,
  Trash2,
} from "lucide-react";
import {
  getCourse,
  toggleCourseBookmark,
  generateChapterContent,
  deleteCourse,
  getUserProfile,
} from "../../utils/api";
import { Course } from "../../types";
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
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Course not found</h2>
          <p className="text-gray-400 mb-4">
            The course you're looking for doesn't exist.
          </p>
          <Link
            to="/courses"
            className="bg-alien-green text-royal-black px-6 py-3 rounded-lg font-semibold hover:bg-alien-green/90 transition-colors duration-300"
          >
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-royal-black text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate("/courses")}
            className="mr-4 p-2 rounded-lg hover:bg-smoke-gray transition-colors duration-200"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-2">
              {course.title}
            </h1>
            <div className="flex items-center space-x-4 text-gray-400">
              <div className="flex items-center space-x-1">
                <Clock size={16} />
                <span>{formatDate(course.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isAuth && (
              <button
                onClick={handleBookmark}
                className="p-3 rounded-lg hover:bg-smoke-gray transition-colors duration-200"
              >
                {course.is_bookmarked ? (
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

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Course Description */}
            <div className="bg-smoke-gray rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">About This Course</h2>
              <p className="text-gray-300 leading-relaxed">
                {course.description}
              </p>
            </div>

            {/* Chapters */}
            <div className="bg-smoke-gray rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  Course Content ({course.chapters?.length || 0} chapters)
                </h2>

                {isOwner &&
                  course.chapters &&
                  course.chapters.length > 0 &&
                  course.chapters.some((ch) => !ch.content) && (
                    <button
                      onClick={handleGenerateAllContent}
                      disabled={generatingAllContent}
                      className="bg-alien-green text-royal-black px-6 py-3 rounded-lg font-semibold hover:bg-alien-green/90 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-alien-glow"
                    >
                      {generatingAllContent ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <span>
                            Generate Content
                            {course.chapters && (
                              <span className="ml-1">
                                (
                                {
                                  course.chapters.filter((ch) => !ch.content)
                                    .length
                                }{" "}
                                chapters)
                              </span>
                            )}
                          </span>
                        </>
                      )}
                    </button>
                  )}
              </div>

              {/* Show completion message if all chapters have content */}
              {isOwner &&
                course.chapters &&
                course.chapters.length > 0 &&
                course.chapters.every((ch) => ch.content) && (
                  <div className="mb-6 bg-alien-green/10 border border-alien-green/30 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-alien-green rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-royal-black"
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
                      <span className="text-alien-green font-medium">
                        All course content has been generated successfully!
                      </span>
                    </div>
                  </div>
                )}

              {course.chapters && course.chapters.length > 0 ? (
                <div className="space-y-4">
                  {course.chapters.map((chapter, index) => (
                    <div
                      key={chapter.id}
                      className="border border-smoke-light rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() =>
                          setExpandedChapter(
                            expandedChapter === chapter.id ? null : chapter.id
                          )
                        }
                        className="w-full flex items-center justify-between p-4 hover:bg-royal-black/50 transition-colors duration-200"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-alien-green text-royal-black rounded-full font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div className="text-left">
                            <h3 className="font-medium text-white">
                              {chapter.title}
                            </h3>
                            <p className="text-sm text-gray-400">
                              {chapter.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {generatingAllContent &&
                            currentGeneratingIndex !== null &&
                            //@ts-ignore
                            course.chapters.filter((ch) => !ch.content)[
                              currentGeneratingIndex
                            ]?.id === chapter.id && (
                              <div className="flex items-center space-x-2">
                                <Loader2
                                  className="animate-spin text-alien-green"
                                  size={16}
                                />
                                {/* <span className="text-xs text-alien-green">
                                  Generating...
                                </span> */}
                              </div>
                            )}
                          {chapter.content && !generatingAllContent && (
                            <Play className="text-alien-green" size={16} />
                          )}
                          {expandedChapter === chapter.id ? (
                            <ChevronDown size={20} />
                          ) : (
                            <ChevronRight size={20} />
                          )}
                        </div>
                      </button>

                      {expandedChapter === chapter.id && (
                        <div className="border-t border-smoke-light p-4 bg-royal-black/30">
                          {chapter.content ? (
                            <div className="prose prose-invert max-w-none">
                              <ReactMarkdown>{chapter.content}</ReactMarkdown>
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <BookOpen
                                className="mx-auto text-gray-400 mb-4"
                                size={48}
                              />
                              <p className="text-gray-400 mb-4">
                                Content for this chapter hasn't been generated
                                yet.
                              </p>
                              {isOwner && (
                                <p className="text-sm text-gray-500">
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
                <div className="text-center py-8">
                  <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-400">
                    No chapters available for this course.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
