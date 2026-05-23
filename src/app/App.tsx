import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./AppShell";
import { AchievementToast } from "@/components/AchievementToast";
import { OnboardingModal } from "@/components/OnboardingModal";
import { ComponentErrorBoundary } from "@/components/ComponentErrorBoundary";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { SubjectsPage } from "@/features/subjects/SubjectsPage";
import { SubjectDetailPage } from "@/features/subjects/SubjectDetailPage";
import { LessonPage } from "@/features/lesson/LessonPage";
import { QuizRoutePage } from "@/features/quiz/QuizRoutePage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { NotesPage } from "@/features/notes/NotesPage";
import { BookmarksPage } from "@/features/bookmarks/BookmarksPage";
import { ReviewPage } from "@/features/review/ReviewPage";
import { StatsPage } from "@/features/stats/StatsPage";
import { TimerPage } from "@/features/timer/TimerPage";
import { TracksPage } from "@/features/tracks/TracksPage";
import { CompoundInterestToolPage } from "@/features/tools/CompoundInterestCalculator";
import { ExpectedValueToolPage } from "@/features/tools/ExpectedValueCalculator";
import { ToolsPage } from "@/features/tools/ToolsPage";

export function App() {
  return (
    <BrowserRouter>
      <ComponentErrorBoundary>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="tracks" element={<TracksPage />} />
            <Route path="tracks/:trackId" element={<TracksPage />} />
            <Route path="subjects" element={<SubjectsPage />} />
            <Route path="subjects/:subjectId" element={<SubjectDetailPage />} />
            <Route path="subjects/:subjectId/:nodeId" element={<LessonPage />} />
            <Route path="subjects/:subjectId/:nodeId/quiz" element={<QuizRoutePage />} />
            <Route path="subjects/:subjectId/:nodeId/notes" element={<NotesPage />} />
            <Route path="bookmarks" element={<BookmarksPage />} />
            <Route path="review" element={<ReviewPage />} />
            <Route path="stats" element={<StatsPage />} />
            <Route path="timer" element={<TimerPage />} />
            <Route path="tools" element={<ToolsPage />} />
            <Route path="tools/ev" element={<ExpectedValueToolPage />} />
            <Route path="tools/compound" element={<CompoundInterestToolPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        <AchievementToast />
        <OnboardingModal />
      </ComponentErrorBoundary>
    </BrowserRouter>
  );
}
