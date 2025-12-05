import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import ClassRoom from "./pages/ClassRoom";
import Classes from "./pages/Classes";
import Students from "./pages/Students";
import Messages from "./pages/Messages";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import FirstLogin from "./pages/FirstLogin";
import { AcceptClassInvitation } from "./pages/AcceptClassInvitation";
import Users from "./pages/Users";
import UserDetail from "./pages/UserDetail";
import UserForm from "./pages/UserForm";
import { Forum } from "./pages/Forum";
import { Labs } from "./pages/Labs";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { RoleProtectedRoute } from "./components/auth/RoleProtectedRoute";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <div className="p-4">
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/classes" element={<ProtectedRoute><Classes /></ProtectedRoute>} />
              <Route path="/classes/:id" element={<ProtectedRoute><ClassRoom /></ProtectedRoute>} />
              {/* Students : TEACHER, INSTRUCTOR, ADMIN, COORDINATOR, INSPECTOR */}
              <Route path="/students" element={<RoleProtectedRoute allowedRoles={['TEACHER', 'ADMIN', 'INSTRUCTOR', 'COORDINATOR', 'INSPECTOR']}><Students /></RoleProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="/forum" element={<ProtectedRoute><Forum /></ProtectedRoute>} />
              {/* Labs : INSTRUCTOR, ADMIN seulement */}
              <Route path="/labs" element={<RoleProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}><Labs /></RoleProtectedRoute>} />
              {/* Analytics : TEACHER, INSTRUCTOR, ADMIN, COORDINATOR, INSPECTOR */}
              <Route path="/analytics" element={<RoleProtectedRoute allowedRoles={['TEACHER', 'ADMIN', 'INSTRUCTOR', 'COORDINATOR', 'INSPECTOR']}><Analytics /></RoleProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/first-login" element={<ProtectedRoute><FirstLogin /></ProtectedRoute>} />
              <Route path="/accept-class-invitation/:token" element={<ProtectedRoute><AcceptClassInvitation /></ProtectedRoute>} />
              {/* Users : ADMIN seulement */}
              <Route path="/users" element={<RoleProtectedRoute allowedRoles={['ADMIN']}><Users /></RoleProtectedRoute>} />
              <Route path="/users/:id" element={<RoleProtectedRoute allowedRoles={['ADMIN']}><UserDetail /></RoleProtectedRoute>} />
              <Route path="/users/create" element={<RoleProtectedRoute allowedRoles={['ADMIN']}><UserForm /></RoleProtectedRoute>} />
              <Route path="/users/:id/edit" element={<RoleProtectedRoute allowedRoles={['ADMIN']}><UserForm /></RoleProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;