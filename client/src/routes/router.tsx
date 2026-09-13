import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import DashboardPage from '../pages/DashboardPage';
import CoursesPage from '../pages/CoursesPage';
import CourseDetailsPage from '../pages/CourseDetailsPage';
import LabPlanningPage from '../pages/LabPlanningPage';
import RoadmapPage from '../pages/RoadmapPage';
import LabDetailsPage from '../pages/LabDetailsPage';
import LoginPage from '../pages/LoginPage';
import SettingsPage from '../pages/SettingsPage';
import MyLabsPage from '../pages/MyLabsPage';
import PublicReadmePage from '../pages/PublicReadmePage';
import PublicRoadmapPage from '../pages/PublicRoadmapPage';
import RequireAuth from '../components/auth/RequireAuth';

export function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/share/readme/:token" element={<PublicReadmePage />} />
      <Route path="/share/roadmap/:token" element={<PublicRoadmapPage />} />

      {/* Protected — uses the full app shell */}
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:courseId" element={<CourseDetailsPage />} />
        <Route path="/courses/:courseId/lab-planning" element={<LabPlanningPage />} />
        <Route path="/courses/:courseId/roadmap" element={<RoadmapPage />} />
        <Route path="/labs/:labId" element={<LabDetailsPage />} />
        <Route path="/my-labs" element={<MyLabsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
