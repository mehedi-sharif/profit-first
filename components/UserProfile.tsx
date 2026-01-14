"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User as UserIcon, Mail } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function UserProfile() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        };

        getUser();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/auth/login");
        router.refresh();
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Account</CardTitle>
                    <CardDescription>Loading user information...</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (!user) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Account</CardTitle>
                    <CardDescription>Not signed in</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => router.push("/auth/login")}>
                        Sign In
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const initials = user.user_metadata?.full_name
        ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
        : user.email?.substring(0, 2).toUpperCase();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                        <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        {user.user_metadata?.full_name && (
                            <div className="flex items-center space-x-2 mb-1">
                                <UserIcon className="h-4 w-4 text-muted-foreground" />
                                <p className="font-medium">{user.user_metadata.full_name}</p>
                            </div>
                        )}
                        <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                    </div>
                </div>

                <Alert>
                    <AlertDescription className="text-sm">
                        Your data is securely stored in Supabase and synced across all your devices.
                    </AlertDescription>
                </Alert>

                <div className="pt-4 border-t">
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleLogout}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
