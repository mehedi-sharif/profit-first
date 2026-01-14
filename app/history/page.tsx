"use client";

import { useStore } from "@/lib/store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function HistoryPage() {
    const { transactions, accounts, currencySymbol } = useStore();

    if (transactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4 text-center">
                <h2 className="text-xl font-semibold">No transactions yet</h2>
                <p className="text-muted-foreground">Go to the Allocate page to record your first income.</p>
            </div>
        );
    }

    const getAccountName = (id: string) => accounts.find((a) => a.id === id)?.name || "Unknown";
    const getAccountTarget = (id: string) => accounts.find((a) => a.id === id)?.targetPercentage || 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Transaction History</h1>
                <p className="text-muted-foreground">Audit trail of all your income allocations.</p>
            </div>

            <div className="space-y-4">
                {transactions.map((tx) => (
                    <Card key={tx.id}>
                        <CardHeader className="bg-muted/30 py-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-base font-bold">{tx.description}</CardTitle>
                                    <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString()} • {new Date(tx.date).toLocaleTimeString()}</p>
                                </div>
                                <div className="text-lg font-bold">
                                    {currencySymbol}{tx.totalAmount.toLocaleString()}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="text-sm font-medium mb-2">Allocations:</div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                                {tx.allocations.map((alloc) => {
                                    const actualPercentage = (alloc.amount / tx.totalAmount) * 100;
                                    const targetPercentage = getAccountTarget(alloc.accountId);
                                    const isOnTarget = actualPercentage >= targetPercentage;
                                    const difference = actualPercentage - targetPercentage;

                                    return (
                                        <div
                                            key={alloc.accountId}
                                            className={`border rounded px-2 py-3 flex flex-col justify-center text-center relative overflow-hidden ${isOnTarget ? 'bg-green-50/50 border-green-200' : 'bg-red-50/50 border-red-200'
                                                }`}
                                        >
                                            {/* Progress bar background */}
                                            <div
                                                className={`absolute bottom-0 left-0 h-1 ${isOnTarget ? 'bg-green-500' : 'bg-red-500'
                                                    }`}
                                                style={{ width: `${Math.min(actualPercentage, 100)}%` }}
                                            />

                                            <div className="flex items-center justify-center gap-1 mb-1">
                                                <span className="text-[10px] text-muted-foreground uppercase">{getAccountName(alloc.accountId)}</span>
                                                {isOnTarget ? (
                                                    <TrendingUp className="h-3 w-3 text-green-600" />
                                                ) : (
                                                    <TrendingDown className="h-3 w-3 text-red-600" />
                                                )}
                                            </div>
                                            <span className="font-semibold text-sm">{currencySymbol}{alloc.amount.toLocaleString()}</span>
                                            <div className="flex items-center justify-center gap-1 mt-1">
                                                <span className={`text-[10px] font-medium ${isOnTarget ? 'text-green-700' : 'text-red-700'
                                                    }`}>
                                                    {actualPercentage.toFixed(1)}%
                                                </span>
                                                <span className="text-[9px] text-muted-foreground">
                                                    (Target: {targetPercentage}%)
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
