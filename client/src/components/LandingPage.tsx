import React from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  BookOpen,
  Users,
  Shield,
  Zap,
  Database,
  MessageSquare,
} from "lucide-react";

const LandingPage: React.FC = () => {
  return (
    <>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative py-20 px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-8xl font-alien font-black mb-6 glow-text ">
              AlienVault
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 font-cyber">
              Your College's Ultimate Resource Hub
            </p>
            <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
              Access thousands of PDFs and E-books for free. Share knowledge
              with your fellow students in our secure, alien-themed digital
              vault.
            </p>

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
              Why Choose AlienVault?
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

        {/* CTA Section */}
        <section className="py-20 px-4 text-center">
          <div className="max-w-4xl mx-auto smoke-card p-12 relative smoke-effect">
            <h2 className="text-3xl font-alien font-bold mb-6 glow-text">
              Ready to Join the Vault?
            </h2>
            <p className="text-lg text-gray-300 mb-8">
              Start exploring our collection or contribute your own resources to
              help the community grow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth" className="alien-button text-lg px-8 py-4">
                <Zap className="inline mr-2" size={20} />
                Sign Up Now
              </Link>
              <Link
                to="/discussions"
                className="bg-transparent border-2 border-alien-green text-alien-green hover:bg-alien-green hover:text-royal-black font-bold py-4 px-8 rounded-lg transition-all duration-300 shadow-alien-glow hover:shadow-alien-glow-strong"
              >
                Join Discussions
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default LandingPage;
