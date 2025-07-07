import { useQuery } from "@tanstack/react-query";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, Download, MessageSquare, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { AdminHeader } from "@/components/admin-header";

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

  // Prepare chart data - ensure we have all 30 days
  const getDailyChartData = () => {
    const last30Days = [];
    const today = new Date();
    
    // Generate array of last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      last30Days.push({
        date: date.toISOString().split('T')[0],
        displayDate: format(date, 'MMM dd'),
        downloads: 0
      });
    }
    
    // Merge with actual data
    analytics?.dailyStats?.forEach((stat: any) => {
      const dayIndex = last30Days.findIndex(day => day.date === stat.date);
      if (dayIndex >= 0) {
        last30Days[dayIndex].downloads = Number(stat.count);
      }
    });
    
    return last30Days;
  };

  const dailyChartData = getDailyChartData();

  const messageChartData = analytics?.messageStats?.map((stat: any) => ({
    name: stat.message || 'No Text',
    value: Number(stat.count)
  })) || [];

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00c49f'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminHeader />
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600">Comprehensive insights into EYV Support usage</p>
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
                    ? Math.round(dailyChartData.reduce((sum: number, day: any) => sum + day.downloads, 0) / dailyChartData.length)
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
                    <LineChart data={dailyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="displayDate" 
                        tick={{ fontSize: 12 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis allowDecimals={false} />
                      <Tooltip 
                        labelFormatter={(label) => `Date: ${label}`}
                        formatter={(value) => [`${value} downloads`, 'Downloads']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="downloads" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#8884d8', strokeWidth: 2 }}
                      />
                    </LineChart>
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
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie
                          data={messageChartData}
                          cx="50%"
                          cy="45%"
                          outerRadius={90}
                          fill="#8884d8"
                          dataKey="value"
                          label={false}
                        >
                          {messageChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value} downloads`, name]} />
                        <Legend 
                          verticalAlign="bottom" 
                          height={60}
                          wrapperStyle={{
                            fontSize: '12px',
                            lineHeight: '1.2'
                          }}
                          formatter={(value, entry) => {
                            const total = messageChartData.reduce((sum, item) => sum + item.value, 0);
                            const percent = ((entry.payload.value / total) * 100).toFixed(0);
                            return `${value} (${percent}%)`;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[350px] flex items-center justify-center text-gray-500">
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
    </div>
  );
}