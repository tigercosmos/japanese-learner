import { useNavigate, useLocation } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
          {!isHome && (
            <button
              onClick={() => navigate(-1)}
              className="mr-3 p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="返回"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}
          <h1
            className="text-lg font-bold text-gray-900 cursor-pointer"
            onClick={() => navigate("/")}
          >
            日語學習卡
          </h1>
        </div>
      </header>

      {/* Main content — centered container */}
      <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
