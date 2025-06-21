# Project Map

## Routes
- `/dashboard` -> `features/dashboard/DashBoardPage.tsx`
- `/search` -> `features/search/SearchPage.tsx`
- `/files` -> `features/files/FilesPage.tsx`
- `/notes` -> `features/notes/NotesPage.tsx`
- `/ai` -> `features/ai/AIPage.tsx`
- `/tasks` -> `features/kanban/KanbanPage.tsx`
- `/logger` -> `features/logger/LoggerPage.tsx`
- `/settings` -> `features/settings/SettingsPage.tsx`
- `/admin` -> `features/admin/AdminPanelPage.tsx` (Refine)
- `/login` -> `features/auth/LoginPage.tsx`

## Zustand slices
- `appSlice.ts` -> global UI state
- `filesSlice.ts` -> file manager state
- `notesSlice.ts` -> notes feature state
- `kanbanSlice.ts` -> kanban tasks state
- `loggerSlice.ts` -> logger state
- `uiSlice.ts` -> minor UI controls

## API hooks
- `useFilesApi.ts` -> wrappers for file endpoints
- `useAuthApi.ts` -> auth endpoints
- `useNotesApi.ts` -> notes endpoints
- `useLoggerApi.ts` -> log endpoints
- `useAdminApi.ts` -> admin endpoints
- `useSearchApi.ts` -> search endpoints
- `useAiApi.ts` -> AI endpoints

## Refactor notes
Areas marked with `@claude-refactor` inside the code should be simplified or moved into dedicated hooks. Only `/admin` uses Refine.
