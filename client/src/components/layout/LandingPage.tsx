import React from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  BookOpen,
  Users,
  Shield,
  Database,
  MessageSquare,
  Map,
  Bug,
  Lightbulb,
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
        <section className="relative py-20 px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8 sm:mb-12">
              <div className="grid grid-cols-1 gap-2">
                <Link to="/suggest-feature">
                  <div className="inline-flex items-center theme-badge-primary mb-2 sm:mb-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-900 border rounded-3xl border-gray-700 text-cyan-400 hover:bg-gray-800 transition-colors">
                    <Lightbulb className="w-3 sm:w-4 h-3 sm:h-4 mr-2" />
                    Suggest a Feature!
                  </div>
                </Link>
                <Link to="/report-bug">
                  <div className="inline-flex items-center theme-badge-primary mb-6 sm:mb-5 px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-900 border rounded-3xl border-gray-700 text-red-400 hover:bg-gray-800 transition-colors">
                    <Bug className="w-3 sm:w-4 h-3 sm:h-4 mr-2" />
                    Report Bugs!
                  </div>
                </Link>
              </div>
              <h1 className="text-5xl md:text-8xl font-alien font-black mb-6 glow-text ">
                Edulume
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8 font-cyber">
                Your College's Ultimate Resource Hub
              </p>
              <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
                Access thousands of PDFs and E-books for free. Share knowledge
                with your fellow students in our secure, alien-themed digital
                vault.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/pdfs" className="alien-button text-lg px-8 py-4">
                <FileText className="inline mr-2" size={24} />
                Browse PDFs
              </Link>
              <Link to="/ebooks" className="alien-button text-lg px-8 py-4">
                <BookOpen className="inline mr-2" size={24} />
                Browse E-books
              </Link>
              <Link
                to="/discussions"
                className="alien-button text-lg px-8 py-4"
              >
                <MessageSquare className="inline mr-2" size={24} />
                Join Discussions
              </Link>
              <Link to="/roadmaps" className="alien-button text-lg px-8 py-4">
                <Map className="inline mr-2" size={24} />
                Browse Roadmaps
              </Link>
            </div>
          </div>

          {/* Floating Elements */}
          <div className="absolute top-20 left-10 w-4 h-4 bg-alien-green rounded-full animate-pulse opacity-60"></div>
          <div className="absolute top-40 right-20 w-2 h-2 bg-alien-green rounded-full animate-pulse opacity-40"></div>
          <div className="absolute bottom-20 left-20 w-3 h-3 bg-alien-green rounded-full animate-pulse opacity-50"></div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-alien font-bold text-center mb-16 glow-text">
              Why Choose Edulume?
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="smoke-card p-8 text-center relative smoke-effect">
                <div className="w-16 h-16 bg-alien-green rounded-full flex items-center justify-center mx-auto mb-6 shadow-alien-glow">
                  <Database className="text-royal-black" size={32} />
                </div>
                <h3 className="text-xl font-alien font-bold mb-4 text-alien-green">
                  Vast Collection
                </h3>
                <p className="text-gray-300">
                  Access thousands of PDFs and E-books across all semesters and
                  departments. Everything you need for your academic journey.
                </p>
              </div>

              <div className="smoke-card p-8 text-center relative smoke-effect">
                <div className="w-16 h-16 bg-alien-green rounded-full flex items-center justify-center mx-auto mb-6 shadow-alien-glow">
                  <Shield className="text-royal-black" size={32} />
                </div>
                <h3 className="text-xl font-alien font-bold mb-4 text-alien-green">
                  Secure & Free
                </h3>
                <p className="text-gray-300">
                  Download any resource for free. Upload requires simple
                  registration to maintain quality and prevent spam.
                </p>
              </div>

              <div className="smoke-card p-8 text-center relative smoke-effect">
                <div className="w-16 h-16 bg-alien-green rounded-full flex items-center justify-center mx-auto mb-6 shadow-alien-glow">
                  <MessageSquare className="text-royal-black" size={32} />
                </div>
                <h3 className="text-xl font-alien font-bold mb-4 text-alien-green">
                  Q&A Forum
                </h3>
                <p className="text-gray-300">
                  Ask questions, get help from peers and faculty. Share
                  knowledge through our interactive discussion forum with voting
                  and best answers.
                </p>
              </div>

              <div className="smoke-card p-8 text-center relative smoke-effect">
                <div className="w-16 h-16 bg-alien-green rounded-full flex items-center justify-center mx-auto mb-6 shadow-alien-glow">
                  <Map className="text-royal-black" size={32} />
                </div>
                <h3 className="text-xl font-alien font-bold mb-4 text-alien-green">
                  Learning Roadmaps
                </h3>
                <p className="text-gray-300">
                  Generate comprehensive learning paths with AI assistance. Get
                  structured roadmaps with resources, projects, and career
                  guidance.
                </p>
              </div>
              <div className="smoke-card p-8 text-center relative smoke-effect">
                <div className="w-16 h-16 bg-alien-green rounded-full flex items-center justify-center mx-auto mb-6 shadow-alien-glow">
                  <Users className="text-royal-black" size={32} />
                </div>
                <h3 className="text-xl font-alien font-bold mb-4 text-alien-green">
                  Community Driven
                </h3>
                <p className="text-gray-300">
                  Built by students, for students. Share your notes, ask
                  questions, and help your fellow classmates succeed together.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default LandingPage;
