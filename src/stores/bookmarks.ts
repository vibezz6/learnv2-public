import { create } from "zustand";
import { persist } from "zustand/middleware";

export const V2_BOOKMARKS_KEY = "learnv2_bookmarks";

export interface ResourceBookmark {
  nodeId: string;
  resourceIndex: number;
  addedAt: string;
  note: string;
}

export interface LessonBookmark {
  subjectId: string;
  nodeId: string;
}

interface BookmarksState {
  resourceBookmarks: ResourceBookmark[];
  lessonBookmarks: LessonBookmark[];
  getResourceBookmarks: () => ResourceBookmark[];
  getResourceBookmark: (nodeId: string, resourceIndex: number) => ResourceBookmark | undefined;
  isResourceBookmarked: (nodeId: string, resourceIndex: number) => boolean;
  toggleResourceBookmark: (nodeId: string, resourceIndex: number, note?: string) => void;
  updateResourceBookmarkNote: (nodeId: string, resourceIndex: number, note: string) => void;
  getLessonBookmarks: () => LessonBookmark[];
  isLessonBookmarked: (subjectId: string, nodeId: string) => boolean;
  toggleLessonBookmark: (subjectId: string, nodeId: string) => void;
}

export const useBookmarks = create<BookmarksState>()(
  persist(
    (set, get) => ({
      resourceBookmarks: [],
      lessonBookmarks: [],

      getResourceBookmarks: () => get().resourceBookmarks,

      getResourceBookmark: (nodeId, resourceIndex) =>
        get().resourceBookmarks.find((b) => b.nodeId === nodeId && b.resourceIndex === resourceIndex),

      isResourceBookmarked: (nodeId, resourceIndex) =>
        get().resourceBookmarks.some((b) => b.nodeId === nodeId && b.resourceIndex === resourceIndex),

      toggleResourceBookmark: (nodeId, resourceIndex, note) =>
        set((state) => {
          const idx = state.resourceBookmarks.findIndex(
            (b) => b.nodeId === nodeId && b.resourceIndex === resourceIndex,
          );
          if (idx >= 0) {
            return { resourceBookmarks: state.resourceBookmarks.filter((_, i) => i !== idx) };
          }
          return {
            resourceBookmarks: [
              ...state.resourceBookmarks,
              {
                nodeId,
                resourceIndex,
                addedAt: new Date().toISOString(),
                note: note ?? "",
              },
            ],
          };
        }),

      updateResourceBookmarkNote: (nodeId, resourceIndex, note) =>
        set((state) => ({
          resourceBookmarks: state.resourceBookmarks.map((b) =>
            b.nodeId === nodeId && b.resourceIndex === resourceIndex ? { ...b, note } : b,
          ),
        })),

      getLessonBookmarks: () => get().lessonBookmarks,

      isLessonBookmarked: (subjectId, nodeId) =>
        get().lessonBookmarks.some((b) => b.subjectId === subjectId && b.nodeId === nodeId),

      toggleLessonBookmark: (subjectId, nodeId) =>
        set((state) => {
          const idx = state.lessonBookmarks.findIndex(
            (b) => b.subjectId === subjectId && b.nodeId === nodeId,
          );
          if (idx >= 0) {
            return { lessonBookmarks: state.lessonBookmarks.filter((_, i) => i !== idx) };
          }
          return { lessonBookmarks: [...state.lessonBookmarks, { subjectId, nodeId }] };
        }),
    }),
    {
      name: V2_BOOKMARKS_KEY,
      partialize: (s) => ({
        resourceBookmarks: s.resourceBookmarks,
        lessonBookmarks: s.lessonBookmarks,
      }),
    },
  ),
);
