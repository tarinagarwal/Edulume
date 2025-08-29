import React from "react";
import { Link } from "react-router-dom";
import { Home, Search, AlertTriangle } from "lucide-react";

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="smoke-card p-8 relative smoke-effect">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-red-500">
            <AlertTriangle className="text-red-400" size={40} />
          </div>

          <h1 className="text-6xl font-alien font-bold text-alien-green mb-4">
            404
          </h1>
          <h2 className="text-2xl font-alien font-bold text-white mb-4">
            Page Not Found
          </h2>

          <p className="text-gray-400 mb-8">
            The page you're looking for has been abducted by aliens or doesn't
            exist in our vault.
          </p>

          <div className="space-y-4">
            <Link
              to="/"
              className="alien-button w-full py-3 text-lg flex items-center justify-center"
            >
              <Home className="mr-2" size={20} />
              Return to Base
            </Link>

            <Link
              to="/pdfs"
              className="bg-transparent border-2 border-alien-green text-alien-green hover:bg-alien-green hover:text-royal-black font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-alien-glow hover:shadow-alien-glow-strong w-full flex items-center justify-center"
            >
              <Search className="mr-2" size={20} />
              Explore Resources
            </Link>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-3 h-3 bg-red-400 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-40 right-20 w-2 h-2 bg-red-400 rounded-full animate-pulse opacity-40"></div>
        <div className="absolute bottom-20 left-20 w-4 h-4 bg-red-400 rounded-full animate-pulse opacity-50"></div>
      </div>
    </div>
  );
};

export default NotFoundPage;
