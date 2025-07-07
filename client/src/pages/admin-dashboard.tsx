import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Download, MessageSquare, TrendingUp, Calendar, Clock } from "lucide-react";
import { Link } from "wouter";
import { AdminHeader } from "@/components/admin-header";
import { format } from "date-fns";

export default function AdminDashboard() {
  const { user } = useAdminAuth();

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ["/api/admin/dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/admin/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return res.json();
    },
    enabled: !!user, // Only run query if user is authenticated
  });

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-red-600">Error loading dashboard data</p>
          </div>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.data || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.messagesCount || 0}</div>
              <p className="text-xs text-muted-foreground">Curved text options</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDownloads || 0}</div>
              <p className="text-xs text-muted-foreground">Profile pictures created</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Downloads</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayDownloads || 0}</div>
              <p className="text-xs text-muted-foreground">New today</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.weekDownloads || 0}</div>
              <p className="text-xs text-muted-foreground">Downloads this week</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Downloads</CardTitle>
              <CardDescription>Latest profile pictures created</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentDownloads?.slice(0, 5).map((download: any) => (
                  <div key={download.id} className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Download className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{download.eyv_message || 'No text'}</p>
                        <p className="text-xs text-gray-500">{download.ip_address}</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(download.created_at), 'MMM dd, HH:mm')}
                    </div>
                  </div>
                )) || (
                  <p className="text-sm text-gray-500">No recent downloads</p>
                )}
              </div>
              <div className="mt-4">
                <Link href="/admin/downloads">
                  <button className="text-sm text-purple-600 hover:text-purple-700">
                    View all downloads →
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link href="/admin/messages">
                  <button className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <MessageSquare className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium">Manage Messages</span>
                    </div>
                    <Badge variant="secondary">{stats.messagesCount || 0}</Badge>
                  </button>
                </Link>
                
                <Link href="/admin/downloads">
                  <button className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Download className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium">View Downloads</span>
                    </div>
                    <Badge variant="secondary">{stats.totalDownloads || 0}</Badge>
                  </button>
                </Link>
                
                <Link href="/admin/analytics">
                  <button className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium">Analytics</span>
                    </div>
                    <Badge variant="secondary">View</Badge>
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}