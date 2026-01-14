"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import { migrateLocalDataToSupabase, loadDataFromSupabase, hasLocalDataBeenMigrated } from "@/lib/data-sync";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DataMigrationHandler({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [migrationStatus, setMigrationStatus] = useState<"idle" | "checking" | "migrating" | "loading" | "complete" | "error">("idle");
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);

    const {
        accounts,
        transactions,
        bankAccounts,
        profitDistributions,
        setAccounts,
        setTransactions,
        setBankAccounts,
        setProfitDistributions,
        setCurrency
    } = useStore();

    useEffect(() => {
        checkAuthAndMigrate();
    }, []);

    const checkAuthAndMigrate = async () => {
        try {
            setMigrationStatus("checking");
            setProgress(10);

            // Check if user is authenticated
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError || !user) {
                // No user, skip migration
                setMigrationStatus("complete");
                return;
            }

            setUser(user);
            setProgress(20);

            // Check if migration has already been done
            const alreadyMigrated = hasLocalDataBeenMigrated();

            // Check if there's local data to migrate
            const hasLocalData = accounts.length > 0 || transactions.length > 0;

            if (hasLocalData && !alreadyMigrated) {
                // Migrate local data to Supabase
                setMigrationStatus("migrating");
                setProgress(30);

                await migrateLocalDataToSupabase(user.id);
                setProgress(70);
            }

            // Load data from Supabase
            setMigrationStatus("loading");
            setProgress(80);

            const supabaseData = await loadDataFromSupabase(user.id);

            if (supabaseData) {
                // Update Zustand store with Supabase data
                setAccounts(supabaseData.accounts);
                setTransactions(supabaseData.transactions);
                setBankAccounts(supabaseData.bankAccounts);
                setProfitDistributions(supabaseData.profitDistributions);
                setCurrency(supabaseData.currencySymbol);
            }

            setProgress(100);
            setMigrationStatus("complete");
        } catch (err: any) {
            console.error("Migration error:", err);
            setError(err.message || "Failed to sync data");
            setMigrationStatus("error");
        }
    };

    if (migrationStatus === "idle" || migrationStatus === "checking") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <CardTitle>Loading...</CardTitle>
                        <CardDescription>Checking your account</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (migrationStatus === "migrating" || migrationStatus === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <CardTitle>
                            {migrationStatus === "migrating" ? "Migrating Your Data" : "Loading Your Data"}
                        </CardTitle>
                        <CardDescription>
                            {migrationStatus === "migrating"
                                ? "Securely transferring your data to Supabase..."
                                : "Syncing your data from the cloud..."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Progress value={progress} className="w-full" />
                        <div className="flex items-center justify-center text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            {progress}% complete
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (migrationStatus === "error") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <div className="flex items-center space-x-2">
                            <AlertCircle className="h-5 w-5 text-destructive" />
                            <CardTitle>Sync Error</CardTitle>
                        </div>
                        <CardDescription>
                            There was a problem syncing your data
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">{error}</p>
                        <Button onClick={checkAuthAndMigrate} className="w-full">
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Migration complete, render children
    return <>{children}</>;
}
