import { useState } from "react";
import { Bell, LogOut, Palette } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

function getUserInitials(email: string | undefined): string {
  if (!email) {
    return "no";
  }

  const username = email.split("@")[0]?.replace(/[^a-zA-Z0-9]/g, "") ?? "";

  return username.slice(0, 2).toLowerCase() || "no";
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const email = user?.email ?? "utilisateur@noteo.app";
  const initials = getUserInitials(user?.email);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    setIsSigningOut(false);
  };

  return (
    <div className="min-h-full bg-gray-50 p-6 dark:bg-zinc-950 transition-colors duration-200">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <Card className="border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 transition-colors duration-200">
          <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-violet-600 text-2xl font-semibold lowercase text-white shadow-lg shadow-violet-500/20">
              {initials}
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
                Mon profil
              </h1>
              <p className="text-sm text-gray-500 dark:text-zinc-400">{email}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 transition-colors duration-200">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              Préférences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/60 transition-colors duration-200">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300 transition-colors duration-200">
                  <Palette className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Thème
                  </p>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">
                    Basculer entre mode clair et sombre
                  </p>
                </div>
              </div>
              <ThemeToggle />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/60 transition-colors duration-200">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300 transition-colors duration-200">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Notifications
                  </p>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">
                    Interface prête, logique à brancher plus tard
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={notificationsEnabled}
                onClick={() =>
                  setNotificationsEnabled((currentValue) => !currentValue)
                }
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200",
                  notificationsEnabled
                    ? "bg-violet-600"
                    : "bg-gray-300 dark:bg-zinc-700",
                )}
              >
                <span
                  className={cn(
                    "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
                    notificationsEnabled
                      ? "translate-x-5"
                      : "translate-x-1",
                  )}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 transition-colors duration-200">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              Compte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="outline"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors duration-200"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isSigningOut ? "Déconnexion..." : "Se déconnecter"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
