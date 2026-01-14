"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { ProfitDistribution } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calendar, DollarSign, Users, Building, CheckCircle2, Clock } from "lucide-react";

export default function ProfitDistributionPage() {
    const { accounts, currencySymbol, profitDistributions, addProfitDistribution, toggleDistributionComplete } = useStore();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [notes, setNotes] = useState("");

    const profitAccount = accounts.find((acc) => acc.type === "PROFIT");
    const currentProfit = profitAccount?.balance || 0;

    // Calculate distribution amounts (50% of current profit)
    const distributionAmount = currentProfit * 0.5;
    const toOwners = distributionAmount * 0.5;
    const toCompany = distributionAmount * 0.5;

    // Get current quarter
    const getCurrentQuarter = () => {
        const now = new Date();
        const quarter = Math.floor(now.getMonth() / 3) + 1;
        return `Q${quarter} ${now.getFullYear()}`;
    };

    // Get next distribution date (end of current quarter)
    const getNextDistributionDate = () => {
        const now = new Date();
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const nextQuarterMonth = (currentQuarter + 1) * 3; // 3, 6, 9, or 12

        // If next quarter is in next year
        if (nextQuarterMonth > 11) {
            return new Date(now.getFullYear() + 1, 2, 31); // March 31 next year
        }

        // Last day of the next quarter's last month
        const lastMonth = nextQuarterMonth - 1;
        const lastDay = new Date(now.getFullYear(), nextQuarterMonth, 0).getDate();
        return new Date(now.getFullYear(), lastMonth, lastDay);
    };

    const handleDistribute = () => {
        if (currentProfit <= 0) return;

        const distribution: ProfitDistribution = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            quarter: getCurrentQuarter(),
            totalProfit: currentProfit,
            distributionAmount,
            toOwners,
            toCompany,
            notes: notes || undefined,
            isCompleted: false,
        };

        addProfitDistribution(distribution);
        setNotes("");
        setIsDialogOpen(false);
    };

    const nextDistributionDate = getNextDistributionDate();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Profit Distribution</h1>
                <p className="text-muted-foreground">Quarterly profit withdrawals for owners and company.</p>
            </div>

            {/* Current Profit Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Current Profit Balance</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {currencySymbol}{currentProfit.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Available for distribution</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Distribution Amount (50%)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {currencySymbol}{distributionAmount.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Total to distribute</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Current Quarter</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{getCurrentQuarter()}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Next: {nextDistributionDate.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            })}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Distribution Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle>Distribution Breakdown</CardTitle>
                    <CardDescription>
                        50% of the Company Profit will be distributed equally between owners and company.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex items-center gap-4 p-4 border rounded-lg bg-blue-50/50">
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-medium text-muted-foreground">To Owners</div>
                                <div className="text-2xl font-bold text-blue-600">
                                    {currencySymbol}{toOwners.toLocaleString()}
                                </div>
                                <div className="text-xs text-muted-foreground">50% of distribution</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 border rounded-lg bg-purple-50/50">
                            <div className="p-3 bg-purple-100 rounded-full">
                                <Building className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-medium text-muted-foreground">To Company</div>
                                <div className="text-2xl font-bold text-purple-600">
                                    {currencySymbol}{toCompany.toLocaleString()}
                                </div>
                                <div className="text-xs text-muted-foreground">50% of distribution</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full" size="lg" disabled={currentProfit <= 0}>
                                <TrendingUp className="mr-2 h-4 w-4" />
                                Process Distribution
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Confirm Profit Distribution</DialogTitle>
                                <DialogDescription>
                                    This will distribute {currencySymbol}{distributionAmount.toLocaleString()} from your Company Profit account.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes (Optional)</Label>
                                    <Input
                                        id="notes"
                                        placeholder="e.g., Q1 2026 Distribution"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>
                                <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Quarter:</span>
                                        <span className="font-medium">{getCurrentQuarter()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Current Profit:</span>
                                        <span className="font-medium">{currencySymbol}{currentProfit.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Distribution (50%):</span>
                                        <span className="font-medium">{currencySymbol}{distributionAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="border-t pt-2 mt-2">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">To Owners:</span>
                                            <span className="font-medium text-blue-600">{currencySymbol}{toOwners.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">To Company:</span>
                                            <span className="font-medium text-purple-600">{currencySymbol}{toCompany.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="border-t pt-2 mt-2">
                                        <div className="flex justify-between font-bold">
                                            <span>Remaining Profit:</span>
                                            <span className="text-green-600">{currencySymbol}{(currentProfit - distributionAmount).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleDistribute}>Confirm Distribution</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardFooter>
            </Card>

            {/* Distribution History */}
            <Card>
                <CardHeader>
                    <CardTitle>Distribution History</CardTitle>
                    <CardDescription>Past quarterly profit distributions.</CardDescription>
                </CardHeader>
                <CardContent>
                    {profitDistributions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Calendar className="mx-auto h-12 w-12 mb-2 opacity-50" />
                            <p>No distributions yet.</p>
                            <p className="text-sm">Process your first quarterly distribution above.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {profitDistributions.map((dist) => (
                                <div key={dist.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-start gap-3">
                                            <Checkbox
                                                checked={dist.isCompleted}
                                                onCheckedChange={() => toggleDistributionComplete(dist.id)}
                                                className="mt-1"
                                            />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <div className="font-semibold">{dist.quarter}</div>
                                                    {dist.isCompleted ? (
                                                        <Badge variant="default" className="bg-green-600">
                                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                                            Completed
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">
                                                            <Clock className="h-3 w-3 mr-1" />
                                                            Pending
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {new Date(dist.date).toLocaleDateString()}
                                                </div>
                                                {dist.notes && (
                                                    <div className="text-sm text-muted-foreground mt-1">{dist.notes}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold">
                                                {currencySymbol}{dist.distributionAmount.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                from {currencySymbol}{dist.totalProfit.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Users className="h-4 w-4 text-blue-600" />
                                            <span className="text-muted-foreground">Owners:</span>
                                            <span className="font-medium">{currencySymbol}{dist.toOwners.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Building className="h-4 w-4 text-purple-600" />
                                            <span className="text-muted-foreground">Company:</span>
                                            <span className="font-medium">{currencySymbol}{dist.toCompany.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
