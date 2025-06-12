import { HashRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MainLayout from "./layouts/MainLayout";
import FriendsPage from "./pages/FriendsPage";
import CallsPage from "./pages/CallsPage";
import CallPage from "./pages/CallPage";
import HomePage from "./pages/HomePage";
import { WebSocketProvider } from "./context/WebSocketContext";
import RequireAuth from "./components/RequireAuth";



export default function App() {

  return (
    <WebSocketProvider>
      <HashRouter>
        <Routes>
          <Route path="/auth" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/" element={
            <RequireAuth>
            <MainLayout />
            </RequireAuth>
          }>
            <Route index element={<RequireAuth><HomePage /></RequireAuth>} />
            <Route path="/friends" element={
              <RequireAuth>
                <FriendsPage />
              </RequireAuth>}
            />
            <Route path="/calls" element={
              <RequireAuth> 
                <CallsPage />
                </RequireAuth>
            } />
            <Route path="/call" element={<RequireAuth>
              <CallPage />
              </RequireAuth>} />
          </Route>
        </Routes>
      </HashRouter>
    </WebSocketProvider >
  );
}
