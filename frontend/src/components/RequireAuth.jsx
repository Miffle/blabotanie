import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated, refreshTokenIfNeeded } from "../api/auth";

export default function RequireAuth({ children }) {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated()) {
        setIsAuth(true);
        setAuthChecked(true);
        return;
      }

      // Если токена нет, но есть refreshToken — пробуем обновить
      const refreshed = await refreshTokenIfNeeded();
      setIsAuth(refreshed);
      setAuthChecked(true);
    };
    checkAuth();
  }, []);

  if (!authChecked) {
    return <div>Загрузка...</div>; // Можно заменить на компонент-лоадер
  }

  if (!isAuth) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
}
