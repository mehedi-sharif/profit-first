"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Transaction } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2 } from "lucide-react";

export function AllocationCalculator() {
    const router = useRouter();
    const { accounts, addTransaction, currencySymbol } = useStore();
    const [incomeAmount, setIncomeAmount] = useState<number | string>("");
    const [description, setDescription] = useState("Income Allocation");

    // Accounts to receive money (exclude INCOME itself if it's the source, 
    // but usually in Profit First you clarify if this is "New Money" hitting the Income account first
    // or "Allocation" from Income to others.
    // We'll assume this is "Allocation Routine": Split 'amount' into the buckets.
    const targetAccounts = accounts.filter(a => a.type !== 'INCOME');

    const amount = parseFloat(incomeAmount.toString()) || 0;

    const allocations = targetAccounts.map(acc => ({
        ...acc,
        allocatedAmount: (amount * acc.targetPercentage) / 100
    }));

    const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);

    const handleCommit = () => {
        if (amount <= 0) return;

        const transaction: Transaction = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            description,
            totalAmount: amount,
            allocations: allocations.map(a => ({
                accountId: a.id,
                amount: a.allocatedAmount
            }))
        };

        addTransaction(transaction);
        router.push("/");
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>New Income Allocation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="amount">Total Income Amount</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground flex items-center justify-center font-bold">৳</span>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="0.00"
                                className="pl-10 text-lg"
                                value={incomeAmount}
                                onChange={(e) => setIncomeAmount(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="desc">Description</Label>
                        <Input
                            id="desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g. Client Payment #123"
                        />
                    </div>
                </CardContent>
            </Card>

            {amount > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Allocation Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Account</TableHead>
                                    <TableHead>Target %</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {allocations.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>{item.targetPercentage}%</TableCell>
                                        <TableCell className="text-right font-bold text-green-600">
                                            {currencySymbol}{item.allocatedAmount.toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow>
                                    <TableCell className="font-bold">Total</TableCell>
                                    <TableCell></TableCell>
                                    <TableCell className="text-right font-bold">
                                        {currencySymbol}{totalAllocated.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" size="lg" onClick={handleCommit}>
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Commit Allocation
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}
