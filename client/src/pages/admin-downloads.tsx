import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-new-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Download, Search, Filter, Calendar, Eye, Copy, Check, ExternalLink, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { Download as DownloadType } from "@shared/schema";
import { AdminHeader } from "@/components/admin-header";

export default function AdminDownloads() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageFilter, setMessageFilter] = useState("all");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedDownload, setSelectedDownload] = useState<DownloadType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedUrls, setCopiedUrls] = useState<Set<string>>(new Set());

  const { data: downloadsData, isLoading } = useQuery({
    queryKey: ["/api/admin/downloads", page, limit],
    enabled: !!user,
  });

  const { data: messagesResponse } = useQuery({
    queryKey: ["/api/admin/messages"],
    enabled: !!user,
  });

  if (!user) {
    return <div>Not authenticated</div>;
  }

  const downloads = downloadsData?.data || [];
  const pagination = downloadsData?.pagination;
  const messages = messagesResponse?.data || [];

  // Filter downloads based on search and message filter
  const filteredDownloads = downloads.filter((download: DownloadType) => {
    const matchesSearch = searchTerm === "" || 
      download.ipAddress.includes(searchTerm) ||
      (download.eyvMessage && download.eyvMessage.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesMessageFilter = messageFilter === "all" || download.eyvMessage === messageFilter;
    
    return matchesSearch && matchesMessageFilter;
  });

  const handleViewImage = (download: DownloadType) => {
    setSelectedImage(download.profileImage);
    setSelectedDownload(download);
    setIsModalOpen(true);
  };

  const handleCopyUrl = async (uniqueId: string, shareUrl: string) => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedUrls(prev => new Set([...prev, uniqueId]));
      setTimeout(() => {
        setCopiedUrls(prev => {
          const newSet = new Set(prev);
          newSet.delete(uniqueId);
          return newSet;
        });
      }, 2000);
    } catch (error) {
    }
  };

  const handleDeleteDownload = async (downloadId: number) => {
    try {
      const response = await fetch(`/api/admin/downloads/${downloadId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Refetch the data
        queryClient.invalidateQueries({ queryKey: ["/api/admin/downloads"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      } else {
        throw new Error('Failed to delete download');
      }
    } catch (error) {
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminHeader />
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-2">Download Analytics</h1>
        <p className="text-sm sm:text-base text-gray-600">View and analyze profile picture downloads</p>
      </div>

      {/* Filters */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by IP or message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Message Filter</label>
              <Select value={messageFilter} onValueChange={setMessageFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by message" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Messages</SelectItem>
                  <SelectItem value="none">No Text</SelectItem>
                  {messages.map((message: any) => (
                    <SelectItem key={message.key} value={message.key}>
                      {message.displayText}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Downloads List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Download className="w-5 h-5 mr-2" />
              Downloads ({filteredDownloads.length})
            </span>
            {pagination && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= pagination.pages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading downloads...</div>
          ) : filteredDownloads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No downloads found matching your criteria
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDownloads.map((download: DownloadType) => (
                <div key={download.id} className="p-2 sm:p-4 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 relative">
                        <img
                          src={download.profileImage}
                          alt="Profile"
                          className="w-full h-full object-cover rounded-full cursor-pointer"
                          onClick={() => handleViewImage(download)}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium">IP: {download.ipAddress}</span>
                          {download.eyvMessage && (
                            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                              {messages.find((m: any) => m.key === download.eyvMessage)?.displayText || download.eyvMessage}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <Calendar className="w-4 h-4 mr-1" />
                          {format(new Date(download.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                        </div>
                        {download.uniqueId && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                            <ExternalLink className="w-4 h-4" />
                            <span className="font-mono text-xs flex-1 truncate">
                              {`${window.location.origin}/image/${download.uniqueId}`}
                            </span>
                            <button
                              onClick={() => handleCopyUrl(download.uniqueId!, `${window.location.origin}/image/${download.uniqueId}`)}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                              title="Copy URL"
                            >
                              {copiedUrls.has(download.uniqueId!) ? (
                                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewImage(download)}
                        title="View full size image"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDownload(download.id)}
                        title="Delete download record"
                        className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
        </div>

      {/* Image Preview Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Profile Picture Preview</DialogTitle>
            <DialogDescription>
              Full size view of the downloaded profile picture
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-4">
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Profile picture preview"
                className="w-80 h-80 object-cover rounded-full border-4 border-purple-200"
                style={{ width: '320px', height: '320px' }}
              />
            )}
          </div>
          {selectedDownload?.uniqueId && (
            <div className="flex justify-center pb-4 px-4">
              <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 w-full max-w-2xl">
                <ExternalLink className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <input
                  type="text"
                  value={`${window.location.origin}/image/${selectedDownload.uniqueId}`}
                  readOnly
                  className="flex-1 text-sm text-gray-700 dark:text-gray-300 bg-transparent border-none outline-none font-mono"
                />
                <button
                  onClick={() => handleCopyUrl(selectedDownload.uniqueId!, `${window.location.origin}/image/${selectedDownload.uniqueId}`)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  title="Copy URL"
                >
                  {copiedUrls.has(selectedDownload.uniqueId!) ? (
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}