"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Save } from "lucide-react";
import { BankAccountManager } from "@/components/BankAccountManager";
import { DataImportExport } from "@/components/DataImportExport";
import { UserProfile } from "@/components/UserProfile";

export default function SettingsPage() {
    const { accounts, updateAccount } = useStore();
    const [localTargets, setLocalTargets] = useState<Record<string, number>>({});
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        const targets: Record<string, number> = {};
        accounts.forEach((img) => {
            targets[img.id] = img.targetPercentage;
        });
        setLocalTargets(targets);
    }, [accounts]);

    const handleChange = (id: string, val: string) => {
        setLocalTargets((prev) => ({ ...prev, [id]: parseFloat(val) || 0 }));
        setIsDirty(true);
    };

    const total = Object.entries(localTargets).reduce((sum, [id, val]) => {
        const acc = accounts.find(a => a.id === id);
        if (acc && acc.type !== 'INCOME') {
            return sum + val;
        }
        return sum;
    }, 0);

    const handleSave = () => {
        if (total !== 100) return;

        Object.entries(localTargets).forEach(([id, target]) => {
            updateAccount(id, { targetPercentage: target });
        });
        setIsDirty(false);
    };

    const handleResetDefaults = () => {
        // Standard Profit First "Starting" percentages
        const defaults: Record<string, number> = {
            'PROFIT': 5,
            'OWNERS_COMP': 50,
            'TAX': 15,
            'OPEX': 30
        };

        const newTargets: Record<string, number> = {};

        accounts.forEach(acc => {
            if (acc.type !== 'INCOME') {
                if (defaults[acc.type] !== undefined) {
                    newTargets[acc.id] = defaults[acc.type];
                } else {
                    newTargets[acc.id] = 0;
                }
            }
        });

        setLocalTargets(newTargets);
        setIsDirty(true);
    };

    const handleCreateMissingAccounts = async () => {
        if (!confirm("This will create any missing core Profit First accounts (Profit, Tax, Owner's Comp, OpEx). Continue?")) return;

        try {
            const { supabase } = await import("@/lib/supabase");
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            const requiredTypes = ['PROFIT', 'OWNERS_COMP', 'TAX', 'OPEX'];
            const existingTypes = new Set(accounts.map(a => a.type));
            const missing = requiredTypes.filter(t => !existingTypes.has(t as any));

            if (missing.length === 0) {
                alert("All core accounts already exist.");
                return;
            }

            const newAccounts = [];
            for (const type of missing) {
                const nameMap: Record<string, string> = {
                    'PROFIT': 'Profit',
                    'OWNERS_COMP': "Owner's Comp",
                    'TAX': 'Tax',
                    'OPEX': 'Operating Exp'
                };

                newAccounts.push({
                    id: crypto.randomUUID(),
                    user_id: user.id,
                    name: nameMap[type],
                    type: type,
                    balance: 0,
                    target_percentage: 0,
                    current_percentage: 0
                });
            }

            const { error } = await supabase.from('accounts').insert(newAccounts);
            if (error) throw error;

            alert(`Created ${newAccounts.length} missing accounts. Reloading...`);
            window.location.reload();
        } catch (err: any) {
            console.error(err);
            alert("Error creating accounts: " + err.message);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your allocation targets and preferences.</p>
            </div>

            <UserProfile />

            <BankAccountManager />

            {/* TAPS Configuration */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Target Allocation Percentages (TAPS)</CardTitle>
                            <CardDescription>Adjust your Profit First percentage goals (Must sum to 100%).</CardDescription>
                        </div>
                        {accounts.filter(a => a.type !== 'INCOME').length < 4 && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleCreateMissingAccounts}
                            >
                                Fix Missing Accounts
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Header Row */}
                    <div className="grid grid-cols-3 gap-4 font-semibold text-sm text-muted-foreground mb-2">
                        <div className="col-span-2">Account Name</div>
                        <div className="text-right">Target %</div>
                    </div>

                    {accounts
                        .filter(a => a.type !== 'INCOME')
                        .sort((a, b) => {
                            // Enforce specific order: Profit -> Owner's Comp -> Tax -> OpEx
                            const order: Record<string, number> = { 'PROFIT': 1, 'OWNERS_COMP': 2, 'TAX': 3, 'OPEX': 4 };
                            return (order[a.type] || 99) - (order[b.type] || 99);
                        })
                        .map((acc) => (
                            <div key={acc.id} className="grid grid-cols-3 items-center gap-4 py-2 border-b last:border-0">
                                <div className="col-span-2">
                                    <Label htmlFor={acc.id} className="text-base font-medium">{acc.name}</Label>
                                    <p className="text-xs text-muted-foreground">
                                        {acc.type === 'PROFIT' && "For debt reduction, emergencies, and quarterly distributions."}
                                        {acc.type === 'OWNERS_COMP' && "Your salary for working in the business."}
                                        {acc.type === 'TAX' && "For government taxes and/or Zakat."}
                                        {acc.type === 'OPEX' && "For all other business expenses."}
                                    </p>
                                </div>
                                <div className="relative">
                                    <Input
                                        id={acc.id}
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={localTargets[acc.id] ?? acc.targetPercentage}
                                        onChange={(e) => handleChange(acc.id, e.target.value)}
                                        className="pr-8 text-right font-mono"
                                    />
                                    <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
                                </div>
                            </div>
                        ))}

                    <div className={`p-4 rounded-lg flex items-center justify-between text-sm font-bold border ${total !== 100 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            <span>Total Allocation</span>
                        </div>
                        <div className="flex items-center gap-4">
                            {total !== 100 && (
                                <Button variant="outline" size="sm" onClick={handleResetDefaults} className="h-8 bg-white border-red-200 text-red-700 hover:bg-red-50">
                                    Autofill Defaults (100%)
                                </Button>
                            )}
                            <div className="text-lg">{total}%</div>
                        </div>
                    </div>

                    {total !== 100 && (
                        <p className="text-xs text-red-600 text-center">
                            The total must equal exactly 100% to save changes. You are currently {total > 100 ? "over" : "under"} by {Math.abs(100 - total)}%.
                        </p>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between bg-muted/50 p-4">
                    <Button variant="ghost" onClick={() => setIsDirty(false)} disabled={!isDirty}>Discard Changes</Button>
                    <Button onClick={handleSave} disabled={!isDirty || total !== 100}>
                        <Save className="mr-2 h-4 w-4" /> Save Configuration
                    </Button>
                </CardFooter>
            </Card>

            <DataImportExport />
        </div>
    );
}
