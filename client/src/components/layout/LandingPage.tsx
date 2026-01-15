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
  /* ---------------- CONFIG ---------------- */

  const feedbackBadges = [
    {
      to: "/suggest-feature",
      label: "Suggest Feature",
      Icon: Lightbulb,
      className:
        "text-cyan-400 hover:border-cyan-500",
    },
    {
      to: "/report-bug",
      label: "Report Bug",
      Icon: Bug,
      className:
        "text-red-400 hover:border-red-500",
    },
  ];

  const quickStats = [
    { value: "100+", label: "AI Courses" },
    { value: "50+", label: "Roadmaps" },
    { value: "1000+", label: "Resources" },
    { value: "Free", label: "Forever" },
  ];

  const mainFeatures = [
    {
      to: "/courses",
      title: "AI-Powered Courses",
      description:
        "Learn with AI-generated courses, interactive chapters, and earn certificates with automated tests.",
      Icon: GraduationCap,
      points: [
        "AI-generated content",
        "Progress tracking",
        "Certificate generation",
      ],
    },
    {
      to: "/roadmaps",
      title: "Learning Roadmaps",
      description:
        "Follow structured learning paths with AI-generated roadmaps, resources, and career guidance.",
      Icon: Map,
      points: [
        "Step-by-step guidance",
        "Career insights",
        "Resource recommendations",
      ],
    },
    {
      to: "/discussions",
      title: "Community Q&A",
      description:
        "Ask questions, share knowledge, and get help from the community with voting and best answers.",
      Icon: MessageSquare,
      points: [
        "Real-time discussions",
        "Voting system",
        "Best answer marking",
      ],
    },
    {
      to: "/pdfs",
      title: "Free PDFs & Ebooks",
      description:
        "Access thousands of free programming PDFs, ebooks, and technical documentation.",
      Icon: FileText,
      points: ["100+ resources", "All topics covered", "Free downloads"],
    },
    {
      to: "/interview-resources",
      title: "Interview Prep",
      description:
        "Prepare for technical interviews with curated questions, tips, and resources.",
      Icon: Award,
      points: [
        "Common questions",
        "Best practices",
        "Company-specific tips",
      ],
    },
    {
      to: "/pdf-chatbot",
      title: "AI PDF Chatbot",
      description:
        "Upload PDFs and chat with AI to get instant answers and summaries from your documents.",
      Icon: Brain,
      points: ["Upload any PDF", "Ask questions", "Get instant answers"],
    },
  ];

  const whyChoose = [
    {
      title: "AI-Powered",
      description:
        "Leverage AI for personalized courses, roadmaps, and instant answers",
      Icon: Sparkles,
    },
    {
      title: "100% Free",
      description:
        "All features, resources, and courses are completely free forever",
      Icon: Zap,
    },
    {
      title: "Community Driven",
      description:
        "Learn together, share knowledge, and grow with the community",
      Icon: Users,
    },
    {
      title: "Comprehensive",
      description:
        "Everything from basics to advanced topics, all in one place",
      Icon: BookMarked,
    },
    {
      title: "Certificates",
      description:
        "Earn certificates upon course completion with automated tests",
      Icon: Award,
    },
    {
      title: "Always Updated",
      description:
        "Fresh content added regularly to keep you ahead of the curve",
      Icon: BookOpen,
    },
  ];

  /* ---------------- JSX ---------------- */

  return (
    <>
      <SEO
        title="Your Ultimate Learning Hub"
        description="Master tech skills with AI-powered courses, roadmaps, and community discussions. Free PDFs, ebooks, and interview resources for developers."
        keywords="online learning, programming courses, tech roadmaps, developer community, free coding resources, interview prep"
      />

      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative py-12 sm:py-20 px-4 text-center overflow-hidden">
          <div className="max-w-6xl mx-auto">
            {/* Feedback */}
            <div data-aos="fade-down" className="flex flex-wrap justify-center gap-2 mb-8">
              {feedbackBadges.map(({ to, label, Icon, className }) => (
                <Link key={to} to={to}>
                  <div
                    className={`inline-flex items-center px-4 py-2 text-sm bg-gray-900 border rounded-full border-gray-700 hover:bg-gray-800 transition-all ${className}`}
                  >
                    <Icon className="w-4 h-4 mr-1.5" />
                    {label}
                  </div>
                </Link>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-alien font-black mb-6 glow-text">
              Edulume
            </h1>
            <p className="text-xl md:text-2xl text-sage-green mb-6 font-cyber">
              Master Tech Skills with AI-Powered Learning
            </p>
            <p className="paragraph mb-12 max-w-3xl mx-auto">
              Your complete learning platform with AI-powered courses,
              structured roadmaps, community discussions, free resources, and
              interview prep—all in one place.
            </p>

            {/* CTAs */}
            <div data-aos="zoom-in" className="flex flex-wrap gap-4 justify-center mb-16">
              <Link to="/courses" className="alien-button px-8 py-4">
                <GraduationCap className="inline mr-2" size={20} />
                Explore Courses
              </Link>
              <Link to="/roadmaps" className="alien-button px-8 py-4">
                <Map className="inline mr-2" size={20} />
                Learning Paths
              </Link>
              <Link to="/discussions" className="alien-button px-8 py-4">
                <MessageSquare className="inline mr-2" size={20} />
                Join Community
              </Link>
            </div>

            {/* Stats */}
            <div data-aos="fade-up" className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {quickStats.map(({ value, label }) => (
                <div key={label} className="text-center">
                  <div className="text-3xl font-bold text-sage-green mb-1">
                    {value}
                  </div>
                  <div className="text-sm text-gray-500">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {mainFeatures.map(
              ({ to, title, description, Icon, points }) => (
                <Link
                  key={title}
                  to={to}
                  data-aos="fade-up"
                  className="group rounded-lg shadow-lg hover:shadow-olive-forest transition-all"
                >
                  <div className="bg-beige-warm p-8 rounded-lg h-full smoke-effect">
                    <div className="w-16 h-16 bg-olive-forest rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Icon className="text-gray-50" size={28} />
                    </div>

                    <h3 className="text-xl font-alien font-bold mb-4 flex items-center text-sage-green">
                      {title}
                      <ArrowRight className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>

                    <p className="paragraph font-semibold mb-4">
                      {description}
                    </p>

                    <ul className="space-y-2 text-sm text-olive-forest">
                      {points.map((point) => (
                        <li key={point} className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-sage-green mr-2 mt-0.5" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Link>
              )
            )}
          </div>
        </section>

        {/* Why Choose */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {whyChoose.map(({ title, description, Icon }) => (
              <div key={title} data-aos="fade-up" className="text-center">
                <div className="w-16 h-16 bg-olive-forest/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-olive-forest">
                  <Icon className="text-sage-green" size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2 text-sage-green">
                  {title}
                </h3>
                <p className="paragraph">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 text-center">
          <div className="bg-beige-warm p-12 rounded-sm shadow-lg smoke-effect max-w-4xl mx-auto">
            <h2 className="text-4xl font-alien font-bold mb-4 glow-text">
              Ready to Start Learning?
            </h2>
            <p className="paragraph mb-8">
              Join thousands of learners mastering tech skills with AI-powered
              courses and community support
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/courses" className="alien-button px-8 py-4">
                <GraduationCap className="inline mr-2" size={24} />
                Start Learning Now
              </Link>
              <Link to="/auth" className="alien-button px-8 py-4">
                Create Free Account
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default LandingPage;
