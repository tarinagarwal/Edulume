import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setAuthToken } from "../../utils/auth";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error) {
      navigate(`/auth?error=${error}`);
      return;
    }

    if (token) {
      setAuthToken(token);
      navigate("/");
    } else {
      navigate("/auth");
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-royal-black">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-alien-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Completing sign in...</p>
      </div>
    </div>
  );
}
