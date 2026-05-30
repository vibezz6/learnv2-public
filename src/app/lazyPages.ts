import { lazy } from "react";

export const LessonPage = lazy(() =>
  import("@/features/lesson/LessonPage").then((m) => ({ default: m.LessonPage })),
);
export const QuizRoutePage = lazy(() =>
  import("@/features/quiz/QuizRoutePage").then((m) => ({ default: m.QuizRoutePage })),
);
export const SatPretestPage = lazy(() =>
  import("@/features/sat/SatPretestPage").then((m) => ({ default: m.SatPretestPage })),
);
export const DailySatQuizPage = lazy(() =>
  import("@/features/sat/DailySatQuizPage").then((m) => ({ default: m.DailySatQuizPage })),
);
export const SatDrillPage = lazy(() =>
  import("@/features/sat/SatDrillPage").then((m) => ({ default: m.SatDrillPage })),
);
export const NotesPage = lazy(() =>
  import("@/features/notes/NotesPage").then((m) => ({ default: m.NotesPage })),
);
export const SettingsPage = lazy(() =>
  import("@/features/settings/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
export const BookmarksPage = lazy(() =>
  import("@/features/bookmarks/BookmarksPage").then((m) => ({ default: m.BookmarksPage })),
);
export const ReviewPage = lazy(() =>
  import("@/features/review/ReviewPage").then((m) => ({ default: m.ReviewPage })),
);
export const StatsPage = lazy(() =>
  import("@/features/stats/StatsPage").then((m) => ({ default: m.StatsPage })),
);
export const TimerPage = lazy(() =>
  import("@/features/timer/TimerPage").then((m) => ({ default: m.TimerPage })),
);
export const TracksPage = lazy(() =>
  import("@/features/tracks/TracksPage").then((m) => ({ default: m.TracksPage })),
);
export const CampusServicesPage = lazy(() =>
  import("@/features/campus/CampusServicesPage").then((m) => ({ default: m.CampusServicesPage })),
);
export const CollegeChecklistPage = lazy(() =>
  import("@/features/college/CollegeChecklistPage").then((m) => ({
    default: m.CollegeChecklistPage,
  })),
);
export const EssayTrackerPage = lazy(() =>
  import("@/features/college/EssayTrackerPage").then((m) => ({ default: m.EssayTrackerPage })),
);
export const ToolsPage = lazy(() =>
  import("@/features/tools/ToolsPage").then((m) => ({ default: m.ToolsPage })),
);
export const CompoundInterestToolPage = lazy(() =>
  import("@/features/tools/CompoundInterestCalculator").then((m) => ({
    default: m.CompoundInterestToolPage,
  })),
);
export const ExpectedValueToolPage = lazy(() =>
  import("@/features/tools/ExpectedValueCalculator").then((m) => ({
    default: m.ExpectedValueToolPage,
  })),
);
export const TradingLabPage = lazy(() =>
  import("@/features/lab/TradingLabPage").then((m) => ({ default: m.TradingLabPage })),
);
