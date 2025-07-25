import { useAuth } from "@/hooks/use-new-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Download, MessageSquare, TrendingUp, Calendar, Clock, RotateCcw } from "lucide-react";
import { Link } from "wouter";
import { AdminHeader } from "@/components/admin-header";
import { format } from "date-fns";
import { queryClient } from "@/lib/queryClient";


export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: dashboardData, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/admin/dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/admin/dashboard", {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return res.json();
    },
    enabled: !!user, // Only run query if user is authenticated
  });

  const handleRefresh = async () => {
    try {
      // Invalidate and refetch dashboard data
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      await refetch();
      
    } catch (error) {
      console.error('Failed to update dashboard data');
    }
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">Overview of your EYV admin panel</p>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              <RotateCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDownloads || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Downloads</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayDownloads || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.weekDownloads || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.messagesCount || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registered Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.usersCount || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Downloads */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Downloads</CardTitle>
              <CardDescription>Latest profile pictures created</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(stats.recentDownloads) && stats.recentDownloads.length > 0 ? (
                  stats.recentDownloads.slice(0, 10).map((download: any) => (
                    <div key={download.id} className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-purple-200">
                          <img 
                            src={download.profileImage} 
                            alt="Profile preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{download.eyvMessage || 'No text'}</p>
                          <p className="text-xs text-gray-500">{download.ipAddress}</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {download.createdAt ? format(new Date(download.createdAt), 'MMM dd, HH:mm') : 'Unknown'}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No recent downloads</p>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <Link href="/admin/downloads">
                  <div className="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center">
                    View all downloads →
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Top Text Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Text Messages</CardTitle>
              <CardDescription>Most popular curved text selections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.isArray(stats.topMessages) && stats.topMessages.length > 0 ? (
                  stats.topMessages.slice(0, 5).map((message: any, index: number) => (
                    <div key={message.text || index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-medium text-purple-600">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{message.text || 'No text'}</p>
                          <p className="text-xs text-gray-500">{message.count || 0} uses</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{message.count || 0}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No message data available</p>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <Link href="/admin/messages">
                  <div className="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center">
                    Manage messages →
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}