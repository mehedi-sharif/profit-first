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

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your allocation targets and preferences.</p>
            </div>

            <UserProfile />

            <BankAccountManager />

            <Card>
                <CardHeader>
                    <CardTitle>Target Allocation Percentages (TAPS)</CardTitle>
                    <CardDescription>Adjust your goals as your business grows.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {accounts.filter(a => a.type !== 'INCOME').map((acc) => (
                        <div key={acc.id} className="grid grid-cols-2 items-center gap-4">
                            <Label htmlFor={acc.id}>{acc.name}</Label>
                            <div className="relative">
                                <Input
                                    id={acc.id}
                                    type="number"
                                    value={localTargets[acc.id] ?? acc.targetPercentage}
                                    onChange={(e) => handleChange(acc.id, e.target.value)}
                                    className="pr-8"
                                />
                                <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
                            </div>
                        </div>
                    ))}

                    <div className={`p-3 rounded-md flex items-center gap-2 text-sm font-medium ${total !== 100 ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                        <AlertCircle className="w-4 h-4" />
                        Total: {total}% {total !== 100 && "(Must likely sum to 100%)"}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => setIsDirty(false)} disabled={!isDirty}>Cancel</Button>
                    <Button onClick={handleSave} disabled={!isDirty || total !== 100}>
                        <Save className="mr-2 h-4 w-4" /> Save Changes
                    </Button>
                </CardFooter>
            </Card>

            <DataImportExport />
        </div>
    );
}
