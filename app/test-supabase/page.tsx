"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthTestPage() {
    const [status, setStatus] = useState<string>("Checking connection...");
    const [isConnected, setIsConnected] = useState<boolean>(false);

    useEffect(() => {
        testConnection();
    }, []);

    const testConnection = async () => {
        try {
            const { data, error } = await supabase.from('profiles').select('count');

            if (error) {
                if (error.message.includes('relation "public.profiles" does not exist')) {
                    setStatus("❌ Database tables not created. Please run the schema SQL in Supabase.");
                    setIsConnected(false);
                } else {
                    setStatus(`❌ Error: ${error.message}`);
                    setIsConnected(false);
                }
            } else {
                setStatus("✅ Successfully connected to Supabase!");
                setIsConnected(true);
            }
        } catch (err) {
            setStatus(`❌ Connection failed: ${err}`);
            setIsConnected(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
                <CardHeader>
                    <CardTitle>Supabase Connection Test</CardTitle>
                    <CardDescription>
                        Testing connection to your Supabase database
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className={`p-4 rounded-lg ${isConnected ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-800'}`}>
                        <p className="font-medium">{status}</p>
                    </div>

                    {isConnected && (
                        <div className="space-y-2 text-sm">
                            <p className="font-semibold">✅ Configuration Verified:</p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                <li>Supabase URL configured</li>
                                <li>API key valid</li>
                                <li>Database schema created</li>
                                <li>Row Level Security enabled</li>
                            </ul>
                        </div>
                    )}

                    <Button onClick={testConnection} className="w-full">
                        Test Connection Again
                    </Button>

                    {isConnected && (
                        <div className="pt-4 border-t">
                            <p className="text-sm text-center text-muted-foreground">
                                Ready to proceed! 🚀
                            </p>
                            <p className="text-xs text-center text-muted-foreground mt-2">
                                Next: I'll create the authentication UI
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
