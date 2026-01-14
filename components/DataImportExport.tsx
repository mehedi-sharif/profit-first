"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Download, Upload, AlertCircle, FileUp } from "lucide-react";
import Papa from "papaparse";

export function DataImportExport() {
    const store = useStore();
    const [importData, setImportData] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isDragging, setIsDragging] = useState(false);

    const handleExport = () => {
        const data = {
            accounts: store.accounts,
            transactions: store.transactions,
            bankAccounts: store.bankAccounts,
            profitDistributions: store.profitDistributions,
            currencySymbol: store.currencySymbol,
            exportDate: new Date().toISOString(),
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `profit-first-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);

        setSuccess("Data exported successfully!");
        setTimeout(() => setSuccess(""), 3000);
    };

    const parseCSV = (csvContent: string) => {
        const result = Papa.parse(csvContent, {
            skipEmptyLines: true,
        });

        const rows = result.data as string[][];

        // Get account IDs
        const accountTypeMap = new Map(
            store.accounts.map(acc => [acc.type, acc.id])
        );

        const transactions: any[] = [];
        const distributions: any[] = [];

        // Parse rows - looking for transaction data
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];

            // Skip header rows and empty rows
            if (!row[0] || row[0].includes('Profit First') || row[0].includes('Term') || row[0].includes('Q')) {
                continue;
            }

            // Check if it's a date (transaction row)
            const dateMatch = row[0].match(/(\d{1,2})-([A-Za-z]{3})-(\d{2,4})/);
            if (dateMatch && row[1]) {
                // Parse revenue amount
                const revenue = parseFloat(row[1].replace(/,/g, ''));
                const profit = parseFloat((row[2] || '0').replace(/,/g, ''));
                const ownersComp = parseFloat((row[4] || '0').replace(/,/g, ''));
                const taxZakat = parseFloat((row[6] || '0').replace(/,/g, ''));
                const opex = parseFloat((row[8] || '0').replace(/,/g, ''));

                if (revenue > 0) {
                    const [, day, month, year] = dateMatch;
                    const fullYear = year.length === 2 ? `20${year}` : year;
                    const monthMap: { [key: string]: string } = {
                        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
                        'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
                        'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
                    };
                    const monthNum = monthMap[month];
                    const date = `${fullYear}-${monthNum}-${day.padStart(2, '0')}T00:00:00.000Z`;

                    transactions.push({
                        id: `tx-${date}-${revenue}`,
                        date,
                        description: `${month} ${fullYear} Revenue`,
                        totalAmount: revenue,
                        allocations: [
                            { accountId: accountTypeMap.get('PROFIT'), amount: profit },
                            { accountId: accountTypeMap.get('OWNERS_COMP'), amount: ownersComp },
                            { accountId: accountTypeMap.get('TAX'), amount: taxZakat },
                            { accountId: accountTypeMap.get('OPEX'), amount: opex }
                        ]
                    });
                }
            }

            // Check for distribution rows
            if (row[0] && row[0].includes('Distribution')) {
                const quarter = rows[i - 1]?.[0]; // Get quarter from previous row
                const distAmount = parseFloat((row[1] || '0').replace(/,/g, ''));

                if (distAmount > 0 && quarter) {
                    const quarterMatch = quarter.match(/Q(\d)/);
                    if (quarterMatch) {
                        const q = quarterMatch[1];
                        const year = quarter.match(/\d{4}/)?.[0] || '2025';
                        const endDates: { [key: string]: string } = {
                            '1': `${year}-03-31`,
                            '2': `${year}-06-30`,
                            '3': `${year}-09-30`,
                            '4': `${year}-12-31`
                        };

                        distributions.push({
                            id: `dist-${year}-q${q}`,
                            date: `${endDates[q]}T00:00:00.000Z`,
                            quarter: `Q${q} ${year}`,
                            totalProfit: distAmount * 2, // Distribution is 50% of profit
                            distributionAmount: distAmount,
                            toOwners: distAmount / 2,
                            toCompany: distAmount / 2,
                            notes: `Q${q} ${year} Distribution`,
                            isCompleted: true
                        });
                    }
                }
            }
        }

        // Create the import data structure
        const importData = {
            accounts: store.accounts.map(acc => ({
                id: acc.id,
                name: acc.name,
                type: acc.type,
                targetPercentage: acc.targetPercentage,
                currentPercentage: acc.currentPercentage,
                balance: acc.balance
            })),
            transactions,
            profitDistributions: distributions,
            bankAccounts: [],
            currencySymbol: store.currencySymbol
        };

        return JSON.stringify(importData);
    };

    const processImportData = (jsonData: string) => {
        setError("");
        setSuccess("");

        try {
            const data = JSON.parse(jsonData);

            // Validate data structure
            if (!data.accounts || !Array.isArray(data.accounts)) {
                throw new Error("Invalid data format: accounts array is required");
            }

            // Get current account IDs to map imported data
            const accountTypeMap = new Map(
                store.accounts.map(acc => [acc.type, acc.id])
            );

            // Update accounts with new balances
            const updatedAccounts = store.accounts.map(acc => {
                const importedAccount = data.accounts.find((a: any) => a.type === acc.type);
                if (importedAccount) {
                    return { ...acc, balance: importedAccount.balance || 0 };
                }
                return acc;
            });

            // Map transactions to use current account IDs
            const mappedTransactions = (data.transactions || []).map((tx: any) => ({
                ...tx,
                allocations: tx.allocations.map((alloc: any) => {
                    // Find the account type from imported data
                    const importedAccount = data.accounts.find((a: any) => a.id === alloc.accountId);
                    if (importedAccount) {
                        const currentAccountId = accountTypeMap.get(importedAccount.type);
                        return { ...alloc, accountId: currentAccountId || alloc.accountId };
                    }
                    return alloc;
                })
            }));

            // Update store
            store.setAccounts(updatedAccounts);

            // Add transactions (prepend to existing)
            if (mappedTransactions.length > 0) {
                mappedTransactions.forEach((tx: any) => {
                    // Check if transaction already exists
                    const exists = store.transactions.some(t => t.id === tx.id);
                    if (!exists) {
                        store.addTransaction(tx);
                    }
                });
            }

            // Add bank accounts
            if (data.bankAccounts && data.bankAccounts.length > 0) {
                data.bankAccounts.forEach((ba: any) => {
                    const exists = store.bankAccounts.some(b => b.id === ba.id);
                    if (!exists) {
                        store.addBankAccount(ba);
                    }
                });
            }

            // Add profit distributions
            if (data.profitDistributions && data.profitDistributions.length > 0) {
                data.profitDistributions.forEach((dist: any) => {
                    const exists = store.profitDistributions.some(d => d.id === dist.id);
                    if (!exists) {
                        store.addProfitDistribution(dist);
                    }
                });
            }

            setSuccess(`Successfully imported ${mappedTransactions.length} transactions, ${data.profitDistributions?.length || 0} distributions!`);
            setImportData("");

            // Refresh page after 2 seconds
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (err) {
            setError(err instanceof Error ? err.message : "Invalid JSON format");
        }
    };

    const handleImport = () => {
        processImportData(importData);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;

            try {
                if (file.name.endsWith('.json')) {
                    processImportData(content);
                } else if (file.name.endsWith('.csv')) {
                    const jsonData = parseCSV(content);
                    processImportData(jsonData);
                } else {
                    setError("Unsupported file type. Please upload a JSON or CSV file.");
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error processing file");
            }
        };
        reader.readAsText(file);

        // Reset input
        event.target.value = '';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;

            try {
                if (file.name.endsWith('.json')) {
                    processImportData(content);
                } else if (file.name.endsWith('.csv')) {
                    const jsonData = parseCSV(content);
                    processImportData(jsonData);
                } else {
                    setError("Unsupported file type. Please upload a JSON or CSV file.");
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error processing file");
            }
        };
        reader.readAsText(file);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Import/Export Data</CardTitle>
                <CardDescription>
                    Backup your data or import historical data from JSON or CSV files.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Export Section */}
                <div className="space-y-2">
                    <Label>Export Data</Label>
                    <p className="text-sm text-muted-foreground">
                        Download all your data as a JSON file for backup.
                    </p>
                    <Button onClick={handleExport} variant="outline" className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Export Data
                    </Button>
                </div>

                {/* File Upload Section */}
                <div className="space-y-2">
                    <Label>Upload File</Label>
                    <p className="text-sm text-muted-foreground">
                        Drag and drop a JSON or CSV file, or click to browse.
                    </p>
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging
                                ? 'border-primary bg-primary/5'
                                : 'border-muted-foreground/25 hover:border-primary/50'
                            }`}
                    >
                        <input
                            type="file"
                            id="file-upload"
                            accept=".json,.csv"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                            <FileUp className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                            <p className="text-sm font-medium mb-1">
                                Drop your file here or click to browse
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Supports JSON and CSV files
                            </p>
                        </label>
                    </div>
                </div>

                {/* Manual Import Section */}
                <div className="space-y-2">
                    <Label htmlFor="import-data">Or Paste JSON Data</Label>
                    <p className="text-sm text-muted-foreground">
                        Paste JSON data below to import transactions, distributions, and balances.
                    </p>
                    <Textarea
                        id="import-data"
                        placeholder='{"accounts": [...], "transactions": [...], "profitDistributions": [...]}'
                        value={importData}
                        onChange={(e) => setImportData(e.target.value)}
                        rows={8}
                        className="font-mono text-xs"
                    />
                    <Button
                        onClick={handleImport}
                        disabled={!importData.trim()}
                        className="w-full"
                    >
                        <Upload className="mr-2 h-4 w-4" />
                        Import Data
                    </Button>
                </div>

                {/* Messages */}
                {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-800 rounded-md text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                    </div>
                )}
                {success && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 text-green-800 rounded-md text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {success}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
