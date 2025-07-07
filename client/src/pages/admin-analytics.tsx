import { useQuery } from "@tanstack/react-query";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Download, MessageSquare, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { AdminNav } from "@/components/admin-nav";

export default function AdminAnalytics() {
  const { user } = useAdminAuth();

  const { data: analyticsResponse, isLoading } = useQuery({
    queryKey: ["/api/admin/analytics"],
    enabled: !!user,
  });

  if (!user) {
    return <div>Not authenticated</div>;
  }

  const analytics = analyticsResponse?.data;

  // Prepare chart data
  const dailyChartData = analytics?.dailyStats?.map((stat: any) => ({
    date: format(parseISO(stat.date), 'MMM dd'),
    downloads: Number(stat.count)
  })) || [];

  const messageChartData = analytics?.messageStats?.map((stat: any) => ({
    name: stat.message || 'No Text',
    value: Number(stat.count)
  })) || [];

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00c49f'];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <AdminNav />
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Comprehensive insights into EYV Support usage</p>
      </div>

      {isLoading ? (
        <div>Loading analytics...</div>
      ) : (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
                <Download className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalDownloads || 0}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.recentDownloads || 0}</div>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.todayDownloads || 0}</div>
                <p className="text-xs text-muted-foreground">Downloads today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Daily</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dailyChartData.length > 0 
                    ? Math.round(dailyChartData.reduce((sum, day) => sum + day.downloads, 0) / dailyChartData.length)
                    : 0
                  }
                </div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Downloads Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Downloads Over Time</CardTitle>
                <CardDescription>Daily download activity for the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                {dailyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="downloads" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No download data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Message Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Message Usage</CardTitle>
                <CardDescription>Distribution of selected curved text messages</CardDescription>
              </CardHeader>
              <CardContent>
                {messageChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={messageChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {messageChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No message data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Stats Table */}
          <Card>
            <CardHeader>
              <CardTitle>Message Statistics</CardTitle>
              <CardDescription>Detailed breakdown of message usage</CardDescription>
            </CardHeader>
            <CardContent>
              {messageChartData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Message</th>
                        <th className="text-right p-2">Downloads</th>
                        <th className="text-right p-2">Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {messageChartData
                        .sort((a, b) => b.value - a.value)
                        .map((message, index) => {
                          const total = messageChartData.reduce((sum, m) => sum + m.value, 0);
                          const percentage = ((message.value / total) * 100).toFixed(1);
                          return (
                            <tr key={index} className="border-b">
                              <td className="p-2 font-medium">{message.name}</td>
                              <td className="p-2 text-right">{message.value}</td>
                              <td className="p-2 text-right">{percentage}%</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No message statistics available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}