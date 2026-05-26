"use client";

import { useState } from "react";
import { ArrowLeft, Palette, Type, Maximize, Settings, Shield, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useUIStore } from "@/store/useUIStore";
import { toast } from "sonner";
import api from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { themeColor, setThemeColor, themeRadius, setThemeRadius, themeFont, setThemeFont } = useUIStore();
  const [activeTab, setActiveTab] = useState("general");

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Please fill in both password fields.");
      return;
    }
    setIsChangingPassword(true);
    try {
      const res = await api.post("/users/change-password", { currentPassword, newPassword });
      if (res.data.success) {
        toast.success("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to change password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const colors = [
    { name: "Zinc", value: "zinc", class: "bg-zinc-900 dark:bg-zinc-100" },
    { name: "Red", value: "red", class: "bg-red-500" },
    { name: "Rose", value: "rose", class: "bg-rose-500" },
    { name: "Orange", value: "orange", class: "bg-orange-500" },
    { name: "Green", value: "green", class: "bg-green-500" },
    { name: "Blue", value: "blue", class: "bg-blue-500" },
    { name: "Yellow", value: "yellow", class: "bg-yellow-500" },
    { name: "Violet", value: "violet", class: "bg-violet-500" },
  ];

  const fonts = ["Inter", "Manrope", "Outfit", "System"];
  const radiuses = ["0", "0.3", "0.5", "0.75", "1"];

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-10">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="mr-2">
          <ArrowLeft className="h-5 w-5 text-zinc-500" />
        </Button>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Settings</h2>
      </div>

      <div className="p-4 md:p-6 max-w-4xl mx-auto w-full">
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start h-12 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl mb-6 overflow-x-auto flex-nowrap hide-scrollbar">
            <TabsTrigger value="general" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-primary data-[state=active]:shadow-sm px-4 py-2 text-sm font-medium transition-all">
              <Settings className="h-4 w-4 mr-2" /> General
            </TabsTrigger>
            <TabsTrigger value="appearance" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-primary data-[state=active]:shadow-sm px-4 py-2 text-sm font-medium transition-all">
              <Palette className="h-4 w-4 mr-2" /> Appearance
            </TabsTrigger>
            <TabsTrigger value="privacy" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-primary data-[state=active]:shadow-sm px-4 py-2 text-sm font-medium transition-all">
              <Shield className="h-4 w-4 mr-2" /> Privacy
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-primary data-[state=active]:shadow-sm px-4 py-2 text-sm font-medium transition-all">
              <Bell className="h-4 w-4 mr-2" /> Notifications
            </TabsTrigger>
          </TabsList>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm min-h-[500px]">
            <TabsContent value="general" className="mt-0 outline-none">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">General Settings</h1>
              <p className="text-zinc-500">Manage your basic account settings, language, and connected devices here.</p>
              {/* Mock fields */}
              <div className="mt-8 space-y-4">
                <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Language</h3>
                  <p className="text-sm text-zinc-500 mt-1">Select your preferred language for the interface.</p>
                  <Button variant="outline" className="mt-3">English (US)</Button>
                </div>
              </div>

              {/* Developer Footer */}
              <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col items-center">
                <Button className="w-full max-w-sm rounded-xl font-semibold mb-6">
                  Get App
                </Button>
                <div className="text-center text-sm text-zinc-500 space-y-1">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">Developer: Ajit</p>
                  <p>Email: emailajit@gmail.com</p>
                  <p>Portfolio: <a href="https://developer-ajit.web.app/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://developer-ajit.web.app/</a></p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="appearance" className="mt-0 outline-none">
              <div className="flex items-start gap-4 mb-8">
                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                  <Palette className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">Interface Appearance</h1>
                  <p className="text-zinc-500 dark:text-zinc-400">Customize the dashboard theme, colors, and visual preferences for your experience.</p>
                </div>
              </div>

              <div className="space-y-8">
                {/* Theme Mode */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Theme Mode</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      variant={theme === 'light' ? 'default' : 'outline'} 
                      onClick={() => setTheme('light')}
                      className={`rounded-xl ${theme === 'light' ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' : ''}`}
                    >
                      ☀️ Light
                    </Button>
                    <Button 
                      variant={theme === 'dark' ? 'default' : 'outline'} 
                      onClick={() => setTheme('dark')}
                      className={`rounded-xl ${theme === 'dark' ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' : ''}`}
                    >
                      🌙 Dark
                    </Button>
                    <Button 
                      variant={theme === 'system' ? 'default' : 'outline'} 
                      onClick={() => setTheme('system')}
                      className={`rounded-xl ${theme === 'system' ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' : ''}`}
                    >
                      💻 System
                    </Button>
                  </div>
                </div>

                {/* Color Theme */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Color Theme</h3>
                  <div className="flex flex-wrap gap-3">
                    {colors.map((c) => (
                      <Button
                        key={c.value}
                        variant="outline"
                        onClick={() => setThemeColor(c.value)}
                        className={`rounded-xl px-4 flex items-center gap-2 ${themeColor === c.value ? 'border-primary ring-1 ring-primary text-primary bg-primary/10' : ''}`}
                      >
                        <span className={`h-4 w-4 rounded-full ${c.class}`} />
                        {c.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Font Family */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Font Family</h3>
                  <div className="flex flex-wrap gap-3">
                    {fonts.map((f) => (
                      <Button
                        key={f}
                        variant="outline"
                        onClick={() => setThemeFont(f)}
                        className={`rounded-xl flex-1 justify-start min-w-[120px] ${themeFont === f ? 'border-primary ring-1 ring-primary text-primary bg-primary/10' : ''}`}
                      >
                        <Type className="h-4 w-4 mr-2 text-zinc-400" />
                        {f}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Radius */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Radius</h3>
                  <div className="flex flex-wrap gap-3">
                    {radiuses.map((r) => (
                      <Button
                        key={r}
                        variant="outline"
                        onClick={() => setThemeRadius(r)}
                        className={`rounded-xl flex-1 min-w-[80px] ${themeRadius === r ? 'border-primary ring-1 ring-primary text-primary bg-primary/10' : ''}`}
                      >
                        {r}
                      </Button>
                    ))}
                  </div>
                </div>

              </div>
            </TabsContent>

            <TabsContent value="privacy" className="mt-0 outline-none">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Privacy & Security</h1>
              <p className="text-zinc-500">Manage who can see your profile and contact you.</p>
              <div className="mt-8 space-y-4">
                <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Private Profile</h3>
                    <p className="text-sm text-zinc-500 mt-1">Only friends can see your full details.</p>
                  </div>
                  <Button variant="outline">Toggle</Button>
                </div>
                
                <div className="p-6 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-6">
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Change Password</h3>
                    <p className="text-sm text-zinc-500 mt-1">Update your account password securely. You must know your current password.</p>
                  </div>
                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Current Password</Label>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="rounded-xl h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">New Password</Label>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="rounded-xl h-11"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isChangingPassword || !currentPassword || !newPassword}
                      className="rounded-xl h-11 font-semibold px-6"
                    >
                      {isChangingPassword ? "Updating..." : "Update Password"}
                    </Button>
                  </form>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="mt-0 outline-none">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Notification Preferences</h1>
              <p className="text-zinc-500">Choose what you get notified about.</p>
              <div className="mt-8 space-y-4">
                <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Push Notifications</h3>
                    <p className="text-sm text-zinc-500 mt-1">Receive messages while away.</p>
                  </div>
                  <Button variant="outline">Enable</Button>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
