import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./AppShell";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { SubjectsPage } from "@/features/subjects/SubjectsPage";
import { SubjectDetailPage } from "@/features/subjects/SubjectDetailPage";
import { PlaceholderPage } from "@/features/PlaceholderPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="subjects/:subjectId" element={<SubjectDetailPage />} />
          <Route
            path="review"
            element={
              <PlaceholderPage
                title="Review"
                note="SRS + library port in Batch 3 from v1 ReviewNeeded."
              />
            }
          />
          <Route
            path="stats"
            element={<PlaceholderPage title="Stats" note="Port Stats.tsx aggregations in Batch 4." />}
          />
          <Route
            path="timer"
            element={<PlaceholderPage title="Timer" note="Port StudyTimer in Batch 4." />}
          />
          <Route
            path="settings"
            element={
              <PlaceholderPage
                title="Settings"
                note="Theme, export/import, OpenRouter key — Batch 4."
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
