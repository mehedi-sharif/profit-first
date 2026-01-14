"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Wallet, TrendingUp, Building2 } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { accounts, currencySymbol, initializeAccounts, bankAccounts } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      initializeAccounts();
    }
  }, [mounted, initializeAccounts]);

  if (!mounted) return null; // Avoid hydration mismatch

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const getBankAccountName = (bankAccountId?: string) => {
    if (!bankAccountId) return null;
    const bankAccount = bankAccounts.find((ba) => ba.id === bankAccountId);
    return bankAccount ? `${bankAccount.bankName} (${bankAccount.accountNumber})` : null;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your business finances.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/allocate">
              Allocate Income <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencySymbol}{totalBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all accounts</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => {
          const bankAccountName = getBankAccountName(account.bankAccountId);
          return (
            <Card key={account.id} className={account.type === 'INCOME' ? 'border-primary/50 bg-primary/5' : ''}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium">{account.name}</CardTitle>
                {account.type === 'PROFIT' && <TrendingUp className="h-4 w-4 text-green-500" />}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currencySymbol}{account.balance.toLocaleString()}</div>
                {bankAccountName && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2 mb-1">
                    <Building2 className="h-3 w-3" />
                    {bankAccountName}
                  </div>
                )}
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Target (TAPS)</span>
                    <span className="font-medium">{account.targetPercentage}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Current (CAPS)</span>
                    <span className="font-medium">{((account.balance / (totalBalance || 1)) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
