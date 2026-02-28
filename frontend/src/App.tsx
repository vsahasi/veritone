import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { AppShell } from "./components/app-shell/AppShell";
import { Skeleton } from "./components/ui/Skeleton";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const VideoAnalysis = lazy(() => import("./pages/VideoAnalysis"));
const Compare = lazy(() => import("./pages/Compare"));
const Upload = lazy(() => import("./pages/Upload"));

function PageLoader() {
  return (
    <div className="p-8 space-y-4 max-w-4xl mx-auto">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-72" />
      <div className="grid grid-cols-3 gap-4 mt-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route
          path="/"
          element={
            <Suspense fallback={<PageLoader />}>
              <Dashboard />
            </Suspense>
          }
        />
        <Route
          path="/video/:id"
          element={
            <Suspense fallback={<PageLoader />}>
              <VideoAnalysis />
            </Suspense>
          }
        />
        <Route
          path="/compare"
          element={
            <Suspense fallback={<PageLoader />}>
              <Compare />
            </Suspense>
          }
        />
        <Route
          path="/upload"
          element={
            <Suspense fallback={<PageLoader />}>
              <Upload />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}
