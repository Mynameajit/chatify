"use client";

import { useState, useRef } from "react";
import { ArrowLeft, Camera, Loader2, LogOut, Check, MapPin, Link as LinkIcon, Phone, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuthStore();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    username: user?.username || user?.email?.split("@")[0] || "",
    bio: user?.bio || "",
    location: "Delhi, India",
    website: "https://chatify.dev",
    phone: "+91 98765 43210",
  });

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const { default: api } = await import("@/lib/api");
      const res = await api.patch("/users/profile", {
        name: formData.name,
        bio: formData.bio,
      });
      if (res.data.success) {
        updateUser({
          name: formData.name,
          bio: formData.bio,
        });
        setIsEditing(false);
        toast.success("Profile updated successfully!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const { default: api } = await import("@/lib/api");
      const uploadRes = await api.post("/uploads/image", formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (uploadRes.data.success) {
        const photoUrl = uploadRes.data.data.url;
        const profileRes = await api.patch("/users/profile", {
          profilePhoto: photoUrl,
        });

        if (profileRes.data.success) {
          updateUser({ avatar: photoUrl });
          toast.success("Profile photo updated!");
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upload photo");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePhotoDelete = async () => {
    try {
      setIsUploading(true);
      const { default: api } = await import("@/lib/api");
      const profileRes = await api.patch("/users/profile", {
        profilePhoto: null,
      });

      if (profileRes.data.success) {
        updateUser({ avatar: "" });
        toast.success("Profile photo removed!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete photo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 overflow-y-auto">
      {/* Hidden upload file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-10">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="mr-2">
          <ArrowLeft className="h-5 w-5 text-zinc-500" />
        </Button>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">My Profile</h2>
      </div>

      <div className="p-0 md:p-8 max-w-3xl mx-auto w-full space-y-0 md:space-y-8 animate-in fade-in duration-300">
        
        {/* Profile Card */}
        <div className="bg-white dark:bg-zinc-900 border-y md:border border-zinc-200 dark:border-zinc-800 rounded-none md:rounded-3xl overflow-hidden shadow-none md:shadow-sm">
          {/* Cover Photo */}
          <div className="h-32 md:h-48 bg-gradient-to-r from-primary via-purple-500 to-pink-500 w-full relative">
            <button className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 backdrop-blur-md text-white p-2 rounded-full transition-colors">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          
          <div className="px-5 md:px-10 pb-8 relative">
            {/* Avatar */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-end -mt-12 md:-mt-16 mb-6 gap-4">
              <div className="relative group self-start">
                <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-white dark:border-zinc-900 shadow-xl bg-white dark:bg-zinc-900">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="text-4xl font-bold bg-primary/10 text-primary">
                    {user?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                {isUploading ? (
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center border-4 border-white dark:border-zinc-900">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                ) : (
                  <div className="absolute bottom-1 right-1 flex gap-1">
                    {user?.avatar && (
                      <button
                        onClick={handlePhotoDelete}
                        title="Remove Avatar"
                        className="h-8 w-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors border-2 border-white dark:border-zinc-900"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      title="Upload Avatar"
                      className="h-8 w-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors border-2 border-white dark:border-zinc-900"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="mb-2">
                {!isEditing ? (
                  <Button variant="outline" className="rounded-xl font-medium" onClick={() => setIsEditing(true)}>Edit Profile</Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" className="rounded-xl" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</Button>
                    <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl" onClick={handleSave} disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                      Save
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{user?.name}</h1>
                <p className="text-zinc-500 dark:text-zinc-400 font-medium">@{formData.username}</p>
              </div>

              {/* Information Form */}
              <div className="grid md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-500 font-medium">Full Name</Label>
                    <Input 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      disabled={!isEditing}
                      className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 disabled:opacity-100 disabled:border-transparent focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-500 font-medium">Username (Read-Only)</Label>
                    <Input 
                      value={formData.username} 
                      disabled
                      className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 disabled:opacity-70 disabled:border-transparent cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-500 font-medium">Bio</Label>
                    <Textarea 
                      value={formData.bio} 
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      disabled={!isEditing}
                      className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 min-h-[100px] resize-none disabled:opacity-100 disabled:border-transparent focus-visible:ring-1 focus-visible:ring-primary"
                      placeholder="Tell us a little bit about yourself"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-500 font-medium">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <Input 
                        value={formData.location} 
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        disabled={!isEditing}
                        className="rounded-xl pl-9 bg-zinc-50 dark:bg-zinc-800/50 disabled:opacity-100 disabled:border-transparent focus-visible:ring-1 focus-visible:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-500 font-medium">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <Input 
                        value={formData.phone} 
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        disabled={!isEditing}
                        className="rounded-xl pl-9 bg-zinc-50 dark:bg-zinc-800/50 disabled:opacity-100 disabled:border-transparent focus-visible:ring-1 focus-visible:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-500 font-medium">Website</Label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <Input 
                        value={formData.website} 
                        onChange={(e) => setFormData({...formData, website: e.target.value})}
                        disabled
                        className="rounded-xl pl-9 bg-zinc-50 dark:bg-zinc-800/50 disabled:opacity-70 disabled:border-transparent cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="bg-zinc-200 dark:bg-zinc-800 my-6" />

              {/* Danger Zone */}
              <div className="pt-2">
                <Button 
                  variant="destructive" 
                  className="w-full sm:w-auto rounded-xl shadow-lg shadow-red-500/10 font-semibold"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
