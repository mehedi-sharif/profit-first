"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DebugDBPage() {
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

    const testTable = async (tableName: string, selectQuery: string = "*") => {
        addLog(`Checking table: ${tableName}...`);
        try {
            const { data, error } = await supabase.from(tableName).select(selectQuery).limit(1);
            if (error) {
                addLog(`❌ Error in ${tableName}: ${error.message} (Code: ${error.code})`);
                console.error(`Error in ${tableName}:`, error);
            } else {
                addLog(`✅ ${tableName} is OK! Found ${data.length} rows.`);
            }
        } catch (err: any) {
            addLog(`❌ Exception in ${tableName}: ${err.message}`);
        }
    };

    const runAllTests = async () => {
        setLogs([]);
        addLog("Starting database tests...");

        await testTable("profiles");
        await testTable("accounts");
        await testTable("bank_accounts");
        await testTable("transactions");
        await testTable("transactions", "*, transaction_allocations(*)"); // Test join
        await testTable("profit_distributions");

        addLog("Tests completed.");
    };

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Database Diagnostics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={runAllTests} className="w-full">Run Database Checks</Button>

                    <div className="bg-slate-950 text-slate-50 p-4 rounded-lg font-mono text-sm min-h-[300px] overflow-auto">
                        {logs.length === 0 ? "Ready to test..." : logs.map((log, i) => (
                            <div key={i} className={log.includes("❌") ? "text-red-400" : "text-green-400"}>
                                {log}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
