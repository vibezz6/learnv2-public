import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./AppShell";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { SubjectsPage } from "@/features/subjects/SubjectsPage";
import { SubjectDetailPage } from "@/features/subjects/SubjectDetailPage";
import { LessonPage } from "@/features/lesson/LessonPage";
import { QuizRoutePage } from "@/features/quiz/QuizRoutePage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { PlaceholderPage } from "@/features/PlaceholderPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="subjects/:subjectId" element={<SubjectDetailPage />} />
          <Route path="subjects/:subjectId/:nodeId" element={<LessonPage />} />
          <Route path="subjects/:subjectId/:nodeId/quiz" element={<QuizRoutePage />} />
          <Route
            path="review"
            element={
              <PlaceholderPage title="Review" note="SRS queue — Batch 3." />
            }
          />
          <Route
            path="stats"
            element={<PlaceholderPage title="Stats" note="Analytics — Batch 4." />}
          />
          <Route
            path="timer"
            element={<PlaceholderPage title="Timer" note="Study timer — Batch 4." />}
          />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
