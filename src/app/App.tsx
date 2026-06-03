import { Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { AppShell } from "./AppShell";
import {
  ApplicationPackagePage,
  BookmarksPage,
  CampusPrintSummaryPage,
  CampusServicesPage,
  CollegeChecklistPage,
  CompoundInterestToolPage,
  DailySatQuizPage,
  EssayTrackerPage,
  ExpectedValueToolPage,
  LessonPage,
  SatDrillPage,
  NotesPage,
  QuizRoutePage,
  ReviewPage,
  SatPretestPage,
  SettingsPage,
  StatsPage,
  TimerPage,
  ToolsPage,
  TracksPage,
} from "./lazyPages";
import { AchievementToast } from "@/components/AchievementToast";
import { LevelUpModal } from "@/components/LevelUpModal";
import { OnboardingModal } from "@/components/OnboardingModal";
import { ServiceWorkerUpdateBanner } from "@/components/ServiceWorkerUpdateBanner";
import { ComponentErrorBoundary } from "@/components/ComponentErrorBoundary";
import { SessionBar } from "@/features/session/SessionBar";
import { SessionCompleteModal } from "@/features/session/SessionCompleteModal";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { SubjectsPage } from "@/features/subjects/SubjectsPage";
import { SubjectDetailPage } from "@/features/subjects/SubjectDetailPage";
import { PageLoading } from "@/components/ui";

function RouteFallback() {
  return <PageLoading />;
}

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ComponentErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
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
              <Route path="sat/pretest" element={<SatPretestPage />} />
              <Route path="sat/daily-quiz" element={<DailySatQuizPage />} />
              <Route path="sat/drill" element={<SatDrillPage />} />
              <Route path="bookmarks" element={<BookmarksPage />} />
              <Route path="review" element={<ReviewPage />} />
              <Route path="stats" element={<StatsPage />} />
              <Route path="timer" element={<TimerPage />} />
              <Route path="campus" element={<CampusServicesPage />} />
              <Route path="campus/college-checklist" element={<CollegeChecklistPage />} />
              <Route path="campus/application" element={<ApplicationPackagePage />} />
              <Route path="campus/print-summary" element={<CampusPrintSummaryPage />} />
              <Route path="campus/essay-tracker" element={<EssayTrackerPage />} />
              <Route path="campus/calculators" element={<ToolsPage />} />
              <Route path="tools" element={<Navigate to="/campus" replace />} />
              <Route path="tools/ev" element={<ExpectedValueToolPage />} />
              <Route path="tools/compound" element={<CompoundInterestToolPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
        <AchievementToast />
        <LevelUpModal />
        <OnboardingModal />
        <ServiceWorkerUpdateBanner />
        <SessionBar />
        <SessionCompleteModal />
        <Analytics />
      </ComponentErrorBoundary>
    </BrowserRouter>
  );
}
