"use client";

import { useTheme } from "next-themes";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, User, Bell, Palette, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SettingsModal({ children }: { children: React.ReactNode }) {
  const { setTheme, theme } = useTheme();

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
        <div className="flex h-[500px]">
          <Tabs defaultValue="appearance" className="flex w-full">
            <div className="w-48 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
              <h2 className="font-semibold mb-4 text-zinc-900 dark:text-zinc-100">Settings</h2>
              <TabsList className="flex flex-col h-auto bg-transparent items-stretch space-y-1 p-0">
                <TabsTrigger value="appearance" className="justify-start data-[state=active]:bg-zinc-100 dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-none px-3 py-2 rounded-xl">
                  <Palette className="h-4 w-4 mr-2" />
                  Appearance
                </TabsTrigger>
                <TabsTrigger value="account" className="justify-start data-[state=active]:bg-zinc-100 dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-none px-3 py-2 rounded-xl">
                  <User className="h-4 w-4 mr-2" />
                  Account
                </TabsTrigger>
                <TabsTrigger value="notifications" className="justify-start data-[state=active]:bg-zinc-100 dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-none px-3 py-2 rounded-xl">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="privacy" className="justify-start data-[state=active]:bg-zinc-100 dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-none px-3 py-2 rounded-xl">
                  <Lock className="h-4 w-4 mr-2" />
                  Privacy
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto">
              <TabsContent value="appearance" className="m-0 space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4">Theme</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div 
                      className={`border-2 rounded-xl p-1 cursor-pointer transition-colors ${theme === 'light' ? 'border-primary' : 'border-transparent'}`}
                      onClick={() => setTheme('light')}
                    >
                      <div className="bg-zinc-100 h-24 rounded-lg border border-zinc-200 p-2 flex flex-col gap-2">
                        <div className="h-2 w-12 bg-zinc-300 rounded-full"></div>
                        <div className="h-4 w-full bg-white rounded-md shadow-sm"></div>
                        <div className="h-4 w-3/4 bg-primary rounded-md"></div>
                      </div>
                      <p className="text-center text-sm mt-2 font-medium">Light</p>
                    </div>
                    <div 
                      className={`border-2 rounded-xl p-1 cursor-pointer transition-colors ${theme === 'dark' ? 'border-primary' : 'border-transparent'}`}
                      onClick={() => setTheme('dark')}
                    >
                      <div className="bg-zinc-950 h-24 rounded-lg border border-zinc-800 p-2 flex flex-col gap-2">
                        <div className="h-2 w-12 bg-zinc-700 rounded-full"></div>
                        <div className="h-4 w-full bg-zinc-800 rounded-md shadow-sm"></div>
                        <div className="h-4 w-3/4 bg-primary rounded-md"></div>
                      </div>
                      <p className="text-center text-sm mt-2 font-medium text-zinc-100">Dark</p>
                    </div>
                    <div 
                      className={`border-2 rounded-xl p-1 cursor-pointer transition-colors ${theme === 'system' ? 'border-primary' : 'border-transparent'}`}
                      onClick={() => setTheme('system')}
                    >
                      <div className="bg-gradient-to-br from-zinc-100 to-zinc-900 h-24 rounded-lg border border-zinc-500 p-2 flex flex-col justify-center items-center">
                        <Settings className="text-zinc-500 h-6 w-6" />
                      </div>
                      <p className="text-center text-sm mt-2 font-medium">System</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="account" className="m-0 space-y-4">
                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Account details</h3>
                <p className="text-sm text-zinc-500">Update your profile picture and personal information.</p>
                {/* Account form fields would go here */}
                <div className="pt-4 flex justify-end">
                  <Button className="rounded-xl bg-primary hover:bg-primary/90 text-white">Save Changes</Button>
                </div>
              </TabsContent>
              
              {/* Other tabs... */}
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
