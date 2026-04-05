import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

const queryClient = new QueryClient();

// Pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomeFeed from "./pages/HomeFeed";
import Home from "./pages/Home";
import ListingDetail from "./pages/ListingDetail";
import CreateListing from "./pages/CreateListing";
import ProfilePage from "./pages/ProfilePage";
import MapPage from "./pages/MapPage";
import ForumPage from "./pages/ForumPage";
import AdminDashboard from "./pages/AdminDashboard";
import ComponentsShowcase from "./pages/ComponentsShowcase";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/dashboard" component={Home} />
      <Route path="/feed" component={HomeFeed} />
      <Route path="/listing/:id" component={ListingDetail} />
      <Route path="/create" component={CreateListing} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/map" component={MapPage} />
      <Route path="/forum" component={ForumPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/components" component={ComponentsShowcase} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" switchable>
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
