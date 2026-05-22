"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, User, Bell, Palette, Lock, Sliders, Smartphone, Mail, Link as LinkIcon, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function SettingsModal({ children }: { children: React.ReactNode }) {
  const { setTheme, theme } = useTheme();
  const { user } = useAuthStore();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if ((window as any).deferredPrompt) {
        setDeferredPrompt((window as any).deferredPrompt);
      }

      const handleInstallable = () => {
        setDeferredPrompt((window as any).deferredPrompt);
      };

      window.addEventListener("pwa-installable", handleInstallable);
      return () => window.removeEventListener("pwa-installable", handleInstallable);
    }
  }, []);

  const handlePwaInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          setDeferredPrompt(null);
          (window as any).deferredPrompt = null;
          toast.success("Thank you for installing Chatify!");
        }
      } catch (err) {
        console.error("Installation failed", err);
      }
    } else {
      toast.info(
        "To install Chatify on mobile: Tap the Share button and select 'Add to Home Screen'. On desktop: Click the Install icon in the browser address bar."
      );
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl">
        <div className="flex h-[550px] md:h-[600px]">
          <Tabs defaultValue="general" className="flex w-full">
            {/* Sidebar Tabs */}
            <div className="w-52 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
                    <Settings className="h-5 w-5" />
                  </div>
                  <h2 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">Settings</h2>
                </div>
                <TabsList className="flex flex-col h-auto bg-transparent items-stretch space-y-1 p-0">
                  <TabsTrigger 
                    value="general" 
                    className="justify-start data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-zinc-600 dark:text-zinc-400"
                  >
                    <Sliders className="h-4 w-4 mr-2.5" />
                    General
                  </TabsTrigger>
                  <TabsTrigger 
                    value="appearance" 
                    className="justify-start data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-zinc-600 dark:text-zinc-400"
                  >
                    <Palette className="h-4 w-4 mr-2.5" />
                    Appearance
                  </TabsTrigger>
                  <TabsTrigger 
                    value="account" 
                    className="justify-start data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-zinc-600 dark:text-zinc-400"
                  >
                    <User className="h-4 w-4 mr-2.5" />
                    Account
                  </TabsTrigger>
                  <TabsTrigger 
                    value="notifications" 
                    className="justify-start data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-zinc-600 dark:text-zinc-400"
                  >
                    <Bell className="h-4 w-4 mr-2.5" />
                    Notifications
                  </TabsTrigger>
                  <TabsTrigger 
                    value="privacy" 
                    className="justify-start data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-zinc-600 dark:text-zinc-400"
                  >
                    <Lock className="h-4 w-4 mr-2.5" />
                    Privacy
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Minimal App Branding in Sidebar Footer */}
              <div className="text-center text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                Chatify v1.2.0 • Premium
              </div>
            </div>
            
            {/* Tab Contents Panel */}
            <div className="flex-1 p-6 overflow-y-auto bg-zinc-50 dark:bg-zinc-950/40">
              
              {/* General Tab */}
              <TabsContent value="general" className="m-0 h-full flex flex-col justify-between">
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">General Settings</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Configure application preferences and download apps.</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-sm transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Show Online Status</Label>
                        <p className="text-xs text-zinc-500">Allow other users to see when you are active.</p>
                      </div>
                      <Switch checked={onlineStatus} onCheckedChange={setOnlineStatus} />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-sm transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Sound Effects</Label>
                        <p className="text-xs text-zinc-500">Play sounds for incoming messages and alerts.</p>
                      </div>
                      <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
                    </div>
                  </div>

                  {/* Get App Card */}
                  <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-2xl p-4 space-y-3 shadow-inner">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 text-primary p-2.5 rounded-xl shadow-sm">
                        <Smartphone className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Get Chatify App</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mt-1">
                          Install Chatify directly on your mobile device or desktop. Enjoy a standalone premium native app experience.
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={handlePwaInstall}
                      className="w-full bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-semibold py-2.5 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all"
                    >
                      Get App
                    </Button>
                  </div>
                </div>

                {/* Developer Info Footer */}
                <div className="mt-8 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col items-center text-center space-y-1 bg-white/40 dark:bg-zinc-900/10 p-3 rounded-2xl border border-zinc-200/40 dark:border-zinc-800/30">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                    <Info className="h-3.5 w-3.5 text-primary" />
                    <span>Developed by <span className="font-semibold text-zinc-700 dark:text-zinc-300">Developer Ajit</span></span>
                  </div>
                  <div className="flex items-center gap-4 text-xs mt-1">
                    <a href="mailto:emailajit@gmail.com" className="flex items-center gap-1 text-zinc-500 hover:text-primary dark:text-zinc-400 dark:hover:text-primary transition-colors">
                      <Mail className="h-3 w-3" />
                      emailajit@gmail.com
                    </a>
                    <a href="https://developer-ajit.web.app/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-zinc-500 hover:text-primary dark:text-zinc-400 dark:hover:text-primary transition-colors">
                      <LinkIcon className="h-3 w-3" />
                      Portfolio
                    </a>
                  </div>
                </div>
              </TabsContent>

              {/* Appearance Tab */}
              <TabsContent value="appearance" className="m-0 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Appearance Settings</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Customize the visual theme and look of your application.</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div 
                    className={`border-2 rounded-2xl p-1.5 cursor-pointer transition-all hover:scale-[1.02] ${theme === 'light' ? 'border-primary shadow-md bg-white' : 'border-transparent bg-white/60 dark:bg-zinc-900/60'}`}
                    onClick={() => setTheme('light')}
                  >
                    <div className="bg-zinc-100 h-24 rounded-xl border border-zinc-200 p-2 flex flex-col gap-2">
                      <div className="h-2 w-12 bg-zinc-300 rounded-full"></div>
                      <div className="h-4 w-full bg-white rounded-md shadow-sm"></div>
                      <div className="h-4 w-3/4 bg-primary rounded-md"></div>
                    </div>
                    <p className="text-center text-xs mt-2 font-semibold text-zinc-800 dark:text-zinc-300">Light</p>
                  </div>
                  <div 
                    className={`border-2 rounded-2xl p-1.5 cursor-pointer transition-all hover:scale-[1.02] ${theme === 'dark' ? 'border-primary shadow-md bg-zinc-900' : 'border-transparent bg-white/60 dark:bg-zinc-900/60'}`}
                    onClick={() => setTheme('dark')}
                  >
                    <div className="bg-zinc-950 h-24 rounded-xl border border-zinc-800 p-2 flex flex-col gap-2">
                      <div className="h-2 w-12 bg-zinc-700 rounded-full"></div>
                      <div className="h-4 w-full bg-zinc-800 rounded-md shadow-sm"></div>
                      <div className="h-4 w-3/4 bg-primary rounded-md"></div>
                    </div>
                    <p className="text-center text-xs mt-2 font-semibold text-zinc-100">Dark</p>
                  </div>
                  <div 
                    className={`border-2 rounded-2xl p-1.5 cursor-pointer transition-all hover:scale-[1.02] ${theme === 'system' ? 'border-primary shadow-md bg-white dark:bg-zinc-900' : 'border-transparent bg-white/60 dark:bg-zinc-900/60'}`}
                    onClick={() => setTheme('system')}
                  >
                    <div className="bg-gradient-to-br from-zinc-100 to-zinc-900 h-24 rounded-xl border border-zinc-300 dark:border-zinc-700 p-2 flex flex-col justify-center items-center">
                      <Settings className="text-zinc-500 h-6 w-6 animate-spin-slow" />
                    </div>
                    <p className="text-center text-xs mt-2 font-semibold text-zinc-800 dark:text-zinc-200">System</p>
                  </div>
                </div>
              </TabsContent>

              {/* Account Tab */}
              <TabsContent value="account" className="m-0 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Account Details</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">View details about your authenticated account.</p>
                </div>
                {user ? (
                  <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center gap-4 shadow-sm">
                    <Avatar className="h-14 w-14 border-2 border-primary/20">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {user.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100">{user.name}</h4>
                      <p className="text-xs text-zinc-500">{user.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">Not logged in.</p>
                )}
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications" className="m-0 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Notifications</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Configure your desktop and sound alerts.</p>
                </div>
                <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Browser Push Notifications</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Message Preview in Toast</Label>
                    <Switch defaultChecked />
                  </div>
                </div>
              </TabsContent>

              {/* Privacy Tab */}
              <TabsContent value="privacy" className="m-0 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Privacy & Security</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Manage encryption and read receipt preferences.</p>
                </div>
                <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Read Receipts (Blue ticks)</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Block Caller Screenshots</Label>
                    <Switch />
                  </div>
                </div>
              </TabsContent>
              
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
