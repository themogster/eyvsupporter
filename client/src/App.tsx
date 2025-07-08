import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-new-auth";
import { ThemeProvider } from "@/components/theme-provider";
import { AdminRoute } from "@/components/admin-route";
import Home from "@/pages/home";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminMessages from "@/pages/admin-messages";
import AdminDownloads from "@/pages/admin-downloads";
import AdminAnalytics from "@/pages/admin-analytics";
import NotFound from "@/pages/not-found";

console.log('App.tsx loading');

function Router() {
  console.log('Router rendering');
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin">
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      </Route>
      <Route path="/admin/messages">
        <AdminRoute>
          <AdminMessages />
        </AdminRoute>
      </Route>
      <Route path="/admin/downloads">
        <AdminRoute>
          <AdminDownloads />
        </AdminRoute>
      </Route>
      <Route path="/admin/analytics">
        <AdminRoute>
          <AdminAnalytics />
        </AdminRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  console.log('App component rendering');
  return (
    <ThemeProvider defaultTheme="light" storageKey="eyv-admin-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
