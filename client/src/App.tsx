import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminAuthProvider } from "@/hooks/use-admin-auth";
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
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/messages" component={AdminMessages} />
      <Route path="/admin/downloads" component={AdminDownloads} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  console.log('App component rendering');
  return (
    <QueryClientProvider client={queryClient}>
      <AdminAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AdminAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
