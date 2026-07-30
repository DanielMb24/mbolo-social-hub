import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Code splitting: lazy load des pages
const AuthPage = lazy(() => import("@/components/mbolo/AuthPage"));
const Index = lazy(() => import("./pages/Index"));
const PostDetail = lazy(() => import("./pages/PostDetail"));
const CommentDetail = lazy(() => import("./pages/CommentDetail"));
const ProfilePage = lazy(() => import("@/components/mbolo/ProfilePage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 minute
      cacheTime: 300_000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

const PageLoader = () => (
  <div className="flex h-screen items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const App = () => {
  const [isAuth, setIsAuth] = useState(() => !!localStorage.getItem('token'));

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={
                isAuth ? <Index /> : <AuthPage onLogin={() => setIsAuth(true)} />
              } />
              <Route path="/post/:postId" element={
                isAuth ? <PostDetail /> : <AuthPage onLogin={() => setIsAuth(true)} />
              } />
              <Route path="/comment/:commentId" element={
                isAuth ? <CommentDetail /> : <AuthPage onLogin={() => setIsAuth(true)} />
              } />
              <Route path="/profile/:userId" element={
                isAuth ? <ProfilePage /> : <AuthPage onLogin={() => setIsAuth(true)} />
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

