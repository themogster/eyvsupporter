import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Message, InsertMessage } from "@shared/schema";
import { AdminHeader } from "@/components/admin-header";

interface EditingMessage extends Partial<InsertMessage> {
  id?: number;
}

export default function AdminMessages() {
  const { user } = useAdminAuth();
  const { toast } = useToast();
  const [editingMessage, setEditingMessage] = useState<EditingMessage | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: messagesResponse, isLoading } = useQuery({
    queryKey: ["/api/admin/messages"],
    enabled: !!user,
  });

  const messages = messagesResponse?.data || [];

  const createMutation = useMutation({
    mutationFn: async (messageData: InsertMessage) => {
      const res = await apiRequest("POST", "/api/admin/messages", messageData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      setIsCreating(false);
      setEditingMessage(null);
      toast({ title: "Message created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create message", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...messageData }: EditingMessage & { id: number }) => {
      const res = await apiRequest("PUT", `/api/admin/messages/${id}`, messageData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      setEditingMessage(null);
      toast({ title: "Message updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update message", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/messages/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({ title: "Message deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete message", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (!editingMessage) return;

    if (isCreating) {
      createMutation.mutate(editingMessage as InsertMessage);
    } else if (editingMessage.id) {
      updateMutation.mutate(editingMessage as EditingMessage & { id: number });
    }
  };

  const handleEdit = (message: Message) => {
    setEditingMessage(message);
    setIsCreating(false);
  };

  const handleCreate = () => {
    setEditingMessage({
      key: "",
      displayText: "",
      messageText: "",
      isActive: true,
      sortOrder: messages.length,
    });
    setIsCreating(true);
  };

  const handleCancel = () => {
    setEditingMessage(null);
    setIsCreating(false);
  };

  if (!user) {
    return <div>Not authenticated</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminHeader />
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Message Management</h1>
          <p className="text-gray-600">Manage curved text options for profile pictures</p>
        </div>
        <Button onClick={handleCreate} disabled={isCreating}>
          <Plus className="w-4 h-4 mr-2" />
          Add Message
        </Button>
      </div>

      {isLoading ? (
        <div>Loading messages...</div>
      ) : (
        <div className="space-y-4">
          {isCreating && (
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle>Create New Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="key">Key</Label>
                    <Input
                      id="key"
                      value={editingMessage?.key || ""}
                      onChange={(e) => setEditingMessage(prev => ({ ...prev, key: e.target.value }))}
                      placeholder="e.g., supporting"
                    />
                  </div>
                  <div>
                    <Label htmlFor="displayText">Display Text</Label>
                    <Input
                      id="displayText"
                      value={editingMessage?.displayText || ""}
                      onChange={(e) => setEditingMessage(prev => ({ ...prev, displayText: e.target.value }))}
                      placeholder="Text shown in dropdown"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="messageText">Message Text</Label>
                  <Input
                    id="messageText"
                    value={editingMessage?.messageText || ""}
                    onChange={(e) => setEditingMessage(prev => ({ ...prev, messageText: e.target.value }))}
                    placeholder="Text displayed on profile picture"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={editingMessage?.isActive || false}
                      onCheckedChange={(checked) => setEditingMessage(prev => ({ ...prev, isActive: checked }))}
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={handleCancel}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={createMutation.isPending}>
                      <Save className="w-4 h-4 mr-2" />
                      {createMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {messages.map((message: Message) => (
            <Card key={message.id} className={editingMessage?.id === message.id ? "border-blue-200" : ""}>
              <CardContent className="p-4">
                {editingMessage?.id === message.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="key">Key</Label>
                        <Input
                          id="key"
                          value={editingMessage?.key || ""}
                          onChange={(e) => setEditingMessage(prev => ({ ...prev, key: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="displayText">Display Text</Label>
                        <Input
                          id="displayText"
                          value={editingMessage?.displayText || ""}
                          onChange={(e) => setEditingMessage(prev => ({ ...prev, displayText: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="messageText">Message Text</Label>
                      <Input
                        id="messageText"
                        value={editingMessage?.messageText || ""}
                        onChange={(e) => setEditingMessage(prev => ({ ...prev, messageText: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isActive"
                          checked={editingMessage?.isActive || false}
                          onCheckedChange={(checked) => setEditingMessage(prev => ({ ...prev, isActive: checked }))}
                        />
                        <Label htmlFor="isActive">Active</Label>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" onClick={handleCancel}>
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={updateMutation.isPending}>
                          <Save className="w-4 h-4 mr-2" />
                          {updateMutation.isPending ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <span className="font-medium">{message.displayText}</span>
                        <span className="text-sm text-gray-500">({message.key})</span>
                        <span className={`text-xs px-2 py-1 rounded ${message.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {message.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{message.messageText}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(message)}
                        disabled={!!editingMessage}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(message.id)}
                        disabled={deleteMutation.isPending}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
        </div>
    </div>
  );
}