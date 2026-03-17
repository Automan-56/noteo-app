import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import { initSupabaseFetch } from "@/lib/supabase";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Grades from "@/pages/Grades";
import Profile from "@/pages/Profile";
import Subjects from "@/pages/Subjects";

function App() {
  useEffect(() => {
    void initSupabaseFetch();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="subjects" element={<Subjects />} />
            <Route path="grades" element={<Grades />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
