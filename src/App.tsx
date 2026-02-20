import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthPage from "@/components/mbolo/AuthPage";
import Index from "./pages/Index";
import PostDetail from "./pages/PostDetail";
import CommentDetail from "./pages/CommentDetail";
import ProfilePage from "@/components/mbolo/ProfilePage";
import NotFound from "./pages/NotFound";
import { useState } from "react";

const queryClient = new QueryClient();

const App = () => {
  const [isAuth, setIsAuth] = useState(() => !!localStorage.getItem('token'));

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
