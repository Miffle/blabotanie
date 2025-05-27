import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { refreshTokenIfNeeded } from "../api/auth";

export default function RequireAuth({ children }) {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        setIsAuth(true);
        setAuthChecked(true);
        return;
      }
      // Если токена нет, но есть refreshToken — пробуем обновить
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        const refreshed = await refreshTokenIfNeeded();
        setIsAuth(refreshed);
        setAuthChecked(true);
        return;
      }
      setIsAuth(false);
      setAuthChecked(true);
    };
    checkAuth();
  }, []);

  if (!authChecked) return null; // Можно показать лоадер

  if (!isAuth) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  return children;
}
