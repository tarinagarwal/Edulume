import React from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  BookOpen,
  Users,
  MessageSquare,
  Map,
  Bug,
  Lightbulb,
  GraduationCap,
  Sparkles,
  BookMarked,
  Brain,
  Zap,
  Award,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import SEO from "../seo/SEO";

const LandingPage: React.FC = () => {
  return (
    <>
      <SEO
        title="Your Ultimate Learning Hub"
        description="Master tech skills with AI-powered courses, roadmaps, and community discussions. Free PDFs, ebooks, and interview resources for developers."
        keywords="online learning, programming courses, tech roadmaps, developer community, free coding resources, interview prep"
      />
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative py-12 sm:py-20 px-4 text-center overflow-hidden">
          <div className="max-w-6xl mx-auto">
            {/* Feedback Badges */}
            <div className="flex flex-wrap justify-center gap-2 mb-6 sm:mb-8">
              <Link to="/suggest-feature">
                <div className="inline-flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gray-900 border rounded-full border-gray-700 text-cyan-400 hover:bg-gray-800 hover:border-cyan-500 transition-all">
                  <Lightbulb className="w-3 sm:w-4 h-3 sm:h-4 mr-1.5" />
                  Suggest Feature
                </div>
              </Link>
              <Link to="/report-bug">
                <div className="inline-flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gray-900 border rounded-full border-gray-700 text-red-400 hover:bg-gray-800 hover:border-red-500 transition-all">
                  <Bug className="w-3 sm:w-4 h-3 sm:h-4 mr-1.5" />
                  Report Bug
                </div>
              </Link>
            </div>

            {/* Main Headline */}
            <div className="mb-8 sm:mb-12">
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-alien font-black mb-4 sm:mb-6 glow-text">
                Edulume
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-4 sm:mb-6 font-cyber">
                Master Tech Skills with AI-Powered Learning
              </p>
              <p className="text-sm sm:text-base md:text-lg text-gray-400 mb-8 sm:mb-12 max-w-3xl mx-auto px-4">
                Your complete learning platform with AI-powered courses,
                structured roadmaps, community discussions, free resources, and
                interview prep—all in one place.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center px-4 mb-12 sm:mb-16">
              <Link
                to="/courses"
                className="alien-button text-sm sm:text-base md:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto"
              >
                <GraduationCap className="inline mr-2" size={20} />
                Explore Courses
              </Link>
              <Link
                to="/roadmaps"
                className="alien-button text-sm sm:text-base md:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto"
              >
                <Map className="inline mr-2" size={20} />
                Learning Paths
              </Link>
              <Link
                to="/discussions"
                className="alien-button text-sm sm:text-base md:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto"
              >
                <MessageSquare className="inline mr-2" size={20} />
                Join Community
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto px-4">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-alien-green mb-1">
                  100+
                </div>
                <div className="text-xs sm:text-sm text-gray-400">
                  AI Courses
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-alien-green mb-1">
                  50+
                </div>
                <div className="text-xs sm:text-sm text-gray-400">Roadmaps</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-alien-green mb-1">
                  1000+
                </div>
                <div className="text-xs sm:text-sm text-gray-400">
                  Resources
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-alien-green mb-1">
                  Free
                </div>
                <div className="text-xs sm:text-sm text-gray-400">Forever</div>
              </div>
            </div>
          </div>

          {/* Floating Elements */}
          <div className="absolute top-20 left-4 sm:left-10 w-3 sm:w-4 h-3 sm:h-4 bg-alien-green rounded-full animate-pulse opacity-60"></div>
          <div className="absolute top-40 right-4 sm:right-20 w-2 h-2 bg-alien-green rounded-full animate-pulse opacity-40"></div>
          <div className="absolute bottom-20 left-4 sm:left-20 w-2 sm:w-3 h-2 sm:h-3 bg-alien-green rounded-full animate-pulse opacity-50"></div>
        </section>

        {/* Main Features Section */}
        <section className="py-12 sm:py-20 px-4 bg-gradient-to-b from-transparent to-gray-900/20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-alien font-bold mb-4 glow-text">
                Everything You Need to Learn
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-400 max-w-2xl mx-auto px-4">
                From AI-powered courses to community support, we've got your
                learning journey covered
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {/* AI Courses */}
              <Link to="/courses" className="group">
                <div className="smoke-card p-6 sm:p-8 relative smoke-effect hover:shadow-alien-glow transition-all h-full">
                  <div className="w-12 sm:w-16 h-12 sm:h-16 bg-alien-green rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-alien-glow group-hover:scale-110 transition-transform">
                    <GraduationCap className="text-royal-black" size={28} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-alien font-bold mb-3 sm:mb-4 text-alien-green flex items-center">
                    AI-Powered Courses
                    <ArrowRight
                      className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      size={20}
                    />
                  </h3>
                  <p className="text-sm sm:text-base text-gray-300 mb-4">
                    Learn with AI-generated courses, interactive chapters, and
                    earn certificates with automated tests.
                  </p>
                  <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-alien-green mr-2 flex-shrink-0 mt-0.5" />
                      <span>AI-generated content</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-alien-green mr-2 flex-shrink-0 mt-0.5" />
                      <span>Progress tracking</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-alien-green mr-2 flex-shrink-0 mt-0.5" />
                      <span>Certificate generation</span>
                    </li>
                  </ul>
                </div>
              </Link>

              {/* Learning Roadmaps */}
              <Link to="/roadmaps" className="group">
                <div className="smoke-card p-6 sm:p-8 relative smoke-effect hover:shadow-alien-glow transition-all h-full">
                  <div className="w-12 sm:w-16 h-12 sm:h-16 bg-alien-green rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-alien-glow group-hover:scale-110 transition-transform">
                    <Map className="text-royal-black" size={28} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-alien font-bold mb-3 sm:mb-4 text-alien-green flex items-center">
                    Learning Roadmaps
                    <ArrowRight
                      className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      size={20}
                    />
                  </h3>
                  <p className="text-sm sm:text-base text-gray-300 mb-4">
                    Follow structured learning paths with AI-generated roadmaps,
                    resources, and career guidance.
                  </p>
                  <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-alien-green mr-2 flex-shrink-0 mt-0.5" />
                      <span>Step-by-step guidance</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-alien-green mr-2 flex-shrink-0 mt-0.5" />
                      <span>Career insights</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-alien-green mr-2 flex-shrink-0 mt-0.5" />
                      <span>Resource recommendations</span>
                    </li>
                  </ul>
                </div>
              </Link>

              {/* Community Discussions */}
              <Link to="/discussions" className="group">
                <div className="smoke-card p-6 sm:p-8 relative smoke-effect hover:shadow-alien-glow transition-all h-full">
                  <div className="w-12 sm:w-16 h-12 sm:h-16 bg-alien-green rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-alien-glow group-hover:scale-110 transition-transform">
                    <MessageSquare className="text-royal-black" size={28} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-alien font-bold mb-3 sm:mb-4 text-alien-green flex items-center">
                    Community Q&A
                    <ArrowRight
                      className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      size={20}
                    />
                  </h3>
                  <p className="text-sm sm:text-base text-gray-300 mb-4">
                    Ask questions, share knowledge, and get help from the
                    community with voting and best answers.
                  </p>
                  <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-alien-green mr-2 flex-shrink-0 mt-0.5" />
                      <span>Real-time discussions</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-alien-green mr-2 flex-shrink-0 mt-0.5" />
                      <span>Voting system</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-alien-green mr-2 flex-shrink-0 mt-0.5" />
                      <span>Best answer marking</span>
                    </li>
                  </ul>
                </div>
              </Link>

              {/* Free Resources */}
              <Link to="/pdfs" className="group">
                <div className="smoke-card p-6 sm:p-8 relative smoke-effect hover:shadow-alien-glow transition-all h-full">
                  <div className="w-12 sm:w-16 h-12 sm:h-16 bg-alien-green rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-alien-glow group-hover:scale-110 transition-transform">
                    <FileText className="text-royal-black" size={28} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-alien font-bold mb-3 sm:mb-4 text-alien-green flex items-center">
                    Free PDFs & Ebooks
                    <ArrowRight
                      className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      size={20}
                    />
                  </h3>
                  <p className="text-sm sm:text-base text-gray-300 mb-4">
                    Access thousands of free programming PDFs, ebooks, and
                    technical documentation.
                  </p>
                  <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-alien-green mr-2 flex-shrink-0 mt-0.5" />
                      <span>100+ resources</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-alien-green mr-2 flex-shrink-0 mt-0.5" />
                      <span>All topics covered</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-alien-green mr-2 flex-shrink-0 mt-0.5" />
                      <span>Free downloads</span>
                    </li>
                  </ul>
                </div>
              </Link>

              {/* Interview Prep */}
              <Link to="/interview-resources" className="group">
                <div className="smoke-card p-6 sm:p-8 relative smoke-effect hover:shadow-alien-glow transition-all h-full">
                  <div className="w-12 sm:w-16 h-12 sm:h-16 bg-alien-green rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-alien-glow group-hover:scale-110 transition-transform">
                    <Award className="text-royal-black" size={28} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-alien font-bold mb-3 sm:mb-4 text-alien-green flex items-center">
                    Interview Prep
                    <ArrowRight
                      className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      size={20}
                    />
                  </h3>
                  <p className="text-sm sm:text-base text-gray-300 mb-4">
                    Prepare for technical interviews with curated questions,
                    tips, and resources.
                  </p>
                  <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-alien-green mr-2 flex-shrink-0 mt-0.5" />
                      <span>Common questions</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-alien-green mr-2 flex-shrink-0 mt-0.5" />
                      <span>Best practices</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-alien-green mr-2 flex-shrink-0 mt-0.5" />
                      <span>Company-specific tips</span>
                    </li>
                  </ul>
                </div>
              </Link>

              {/* AI Chatbot */}
              <Link to="/pdf-chatbot" className="group">
                <div className="smoke-card p-6 sm:p-8 relative smoke-effect hover:shadow-alien-glow transition-all h-full">
                  <div className="w-12 sm:w-16 h-12 sm:h-16 bg-alien-green rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-alien-glow group-hover:scale-110 transition-transform">
                    <Brain className="text-royal-black" size={28} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-alien font-bold mb-3 sm:mb-4 text-alien-green flex items-center">
                    AI PDF Chatbot
                    <ArrowRight
                      className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      size={20}
                    />
                  </h3>
                  <p className="text-sm sm:text-base text-gray-300 mb-4">
                    Upload PDFs and chat with AI to get instant answers and
                    summaries from your documents.
                  </p>
                  <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-alien-green mr-2 flex-shrink-0 mt-0.5" />
                      <span>Upload any PDF</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-alien-green mr-2 flex-shrink-0 mt-0.5" />
                      <span>Ask questions</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-alien-green mr-2 flex-shrink-0 mt-0.5" />
                      <span>Get instant answers</span>
                    </li>
                  </ul>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Why Choose Section */}
        <section className="py-12 sm:py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-alien font-bold mb-4 glow-text">
                Why Choose Edulume?
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-400 max-w-2xl mx-auto px-4">
                Built for learners, by learners. Everything you need in one
                platform.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-alien-green/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-alien-green">
                  <Sparkles className="text-alien-green" size={32} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 text-alien-green">
                  AI-Powered
                </h3>
                <p className="text-sm sm:text-base text-gray-400">
                  Leverage AI for personalized courses, roadmaps, and instant
                  answers
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-alien-green/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-alien-green">
                  <Zap className="text-alien-green" size={32} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 text-alien-green">
                  100% Free
                </h3>
                <p className="text-sm sm:text-base text-gray-400">
                  All features, resources, and courses are completely free
                  forever
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-alien-green/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-alien-green">
                  <Users className="text-alien-green" size={32} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 text-alien-green">
                  Community Driven
                </h3>
                <p className="text-sm sm:text-base text-gray-400">
                  Learn together, share knowledge, and grow with the community
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-alien-green/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-alien-green">
                  <BookMarked className="text-alien-green" size={32} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 text-alien-green">
                  Comprehensive
                </h3>
                <p className="text-sm sm:text-base text-gray-400">
                  Everything from basics to advanced topics, all in one place
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-alien-green/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-alien-green">
                  <Award className="text-alien-green" size={32} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 text-alien-green">
                  Certificates
                </h3>
                <p className="text-sm sm:text-base text-gray-400">
                  Earn certificates upon course completion with automated tests
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-alien-green/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-alien-green">
                  <BookOpen className="text-alien-green" size={32} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 text-alien-green">
                  Always Updated
                </h3>
                <p className="text-sm sm:text-base text-gray-400">
                  Fresh content added regularly to keep you ahead of the curve
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="smoke-card p-8 sm:p-12 relative smoke-effect">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-alien font-bold mb-4 glow-text">
                Ready to Start Learning?
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
                Join thousands of learners mastering tech skills with AI-powered
                courses and community support
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/courses"
                  className="alien-button text-base sm:text-lg px-8 py-4"
                >
                  <GraduationCap className="inline mr-2" size={24} />
                  Start Learning Now
                </Link>
                <Link
                  to="/auth"
                  className="alien-button text-base sm:text-lg px-8 py-4"
                >
                  Create Free Account
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default LandingPage;
