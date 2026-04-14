import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuthStore } from "./store/authStore";
import LoadingScreen from "./components/LoadingScreen";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <LoadingScreen fullPage />;
  if (!isAuthenticated) return <Redirect to="/login" />;
  return <Component />;
}

// Pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomeFeed from "./pages/HomeFeed";
import Home from "./pages/Home";
import ListingDetail from "./pages/ListingDetail";
import CreateListing from "./pages/CreateListing";
import ProfilePage from "./pages/ProfilePage";
import NotificationsPage from "./pages/NotificationsPage";
import MapPage from "./pages/MapPage";
import SearchPage from "./pages/SearchPage";
import ForumPage from "./pages/ForumPage";
import ForumThreadPage from "./pages/ForumThreadPage";
import AdminDashboard from "./pages/AdminDashboard";
import ComponentsShowcase from "./pages/ComponentsShowcase";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import LostAndFoundPage from "./pages/LostAndFoundPage";
import SavedPage from "./pages/SavedPage";
import LikedPage from "./pages/LikedPage";
import VerifyIdPage from "./pages/VerifyIdPage";
import EditListing from "./pages/EditListing";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/verify-id" component={VerifyIdPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/dashboard">{() => <ProtectedRoute component={Home} />}</Route>
      <Route path="/marketplace">{() => <ProtectedRoute component={HomeFeed} />}</Route>
      <Route path="/listing/:id/edit">{() => <ProtectedRoute component={EditListing} />}</Route>
      <Route path="/listing/:id">{() => <ProtectedRoute component={ListingDetail} />}</Route>
      <Route path="/create">{() => <ProtectedRoute component={CreateListing} />}</Route>
      <Route path="/profile">{() => <ProtectedRoute component={ProfilePage} />}</Route>
      <Route path="/settings">{() => <Redirect to="/profile" />}</Route>
      <Route path="/notifications">{() => <ProtectedRoute component={NotificationsPage} />}</Route>
      <Route path="/map">{() => <ProtectedRoute component={MapPage} />}</Route>
      <Route path="/search">{() => <ProtectedRoute component={SearchPage} />}</Route>
      <Route path="/lost-and-found">{() => <ProtectedRoute component={LostAndFoundPage} />}</Route>
      <Route path="/saved">{() => <ProtectedRoute component={SavedPage} />}</Route>
      <Route path="/liked">{() => <ProtectedRoute component={LikedPage} />}</Route>
      <Route path="/forum">{() => <ProtectedRoute component={ForumPage} />}</Route>
      <Route path="/forum/:id">{() => <ProtectedRoute component={ForumThreadPage} />}</Route>
      <Route path="/admin">{() => <ProtectedRoute component={AdminDashboard} />}</Route>
      <Route path="/components">{() => <ProtectedRoute component={ComponentsShowcase} />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark" switchable>
          <TooltipProvider>
            <Toaster richColors position="top-center" />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
