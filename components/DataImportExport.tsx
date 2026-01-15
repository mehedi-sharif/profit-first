"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase"; // Ensure direct DB access
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Upload, AlertCircle, FileUp, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Papa from "papaparse";

type ValidationError = {
    type: "error" | "warning";
    message: string;
};

export function DataImportExport() {
    const store = useStore();
    const [importData, setImportData] = useState("");
    const [validationReport, setValidationReport] = useState<ValidationError[]>([]);
    const [isValidating, setIsValidating] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
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
        const result = Papa.parse(csvContent, { skipEmptyLines: true });
        const rows = result.data as string[][];

        // Helper to find ID by type for mapping
        const accountTypeMap = new Map(store.accounts.map(acc => [acc.type, acc.id]));

        const transactions: any[] = [];
        const distributions: any[] = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];

            // 1. Check for Transaction Date Rows
            const dateMatch = row[0] ? row[0].match(/(\d{1,2})-([A-Za-z]{3})-(\d{2,4})/) : null;
            if (dateMatch && row[1]) {
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
                    const date = `${fullYear}-${monthMap[month]}-${day.padStart(2, '0')}T00:00:00.000Z`;

                    transactions.push({
                        id: crypto.randomUUID(), // Valid UUID
                        date,
                        description: `${month} ${fullYear} Revenue`,
                        totalAmount: revenue,
                        allocations: [
                            { accountId: accountTypeMap.get('PROFIT'), amount: profit },
                            { accountId: accountTypeMap.get('OWNERS_COMP'), amount: ownersComp },
                            { accountId: accountTypeMap.get('TAX'), amount: taxZakat },
                            { accountId: accountTypeMap.get('OPEX'), amount: opex }
                        ].filter(a => a.accountId)
                    });
                }
            }

            // 2. Check for Distribution Rows
            if (row[0] && row[0].includes('Distribution')) {
                const quarter = rows[i - 1]?.[0]; // Quarter is usually in the row above
                const distAmount = parseFloat((row[1] || '0').replace(/,/g, ''));

                if (distAmount > 0 && quarter) {
                    const quarterMatch = quarter.match(/Q(\d)/);
                    if (quarterMatch) {
                        const q = quarterMatch[1];
                        const year = quarter.match(/\d{4}/)?.[0] || new Date().getFullYear().toString();
                        const endDates: { [key: string]: string } = {
                            '1': `${year}-03-31`,
                            '2': `${year}-06-30`,
                            '3': `${year}-09-30`,
                            '4': `${year}-12-31`
                        };

                        distributions.push({
                            id: crypto.randomUUID(), // Valid UUID
                            date: `${endDates[q] || year + '-01-01'}T00:00:00.000Z`,
                            quarter: `Q${q} ${year}`,
                            totalProfit: distAmount * 2, // Assumption: Dist is 50%
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

        return JSON.stringify({
            accounts: store.accounts, // Use current accounts as base
            transactions,
            profitDistributions: distributions,
            bankAccounts: [],
            currencySymbol: store.currencySymbol
        });
    };

    const validateData = (data: any): ValidationError[] => {
        const errors: ValidationError[] = [];

        // 1. Structure Check
        if (!data || typeof data !== 'object') {
            return [{ type: 'error', message: "Invalid JSON structure." }];
        }
        if (!data.accounts || !Array.isArray(data.accounts)) errors.push({ type: 'error', message: "Missing or invalid 'accounts' list." });
        if (!data.transactions || !Array.isArray(data.transactions)) errors.push({ type: 'error', message: "Missing or invalid 'transactions' list." });

        if (errors.length > 0) return errors; // Stop if basic structure fail

        // 2. Accounts Validations
        const accountIds = new Set<string>();
        data.accounts.forEach((acc: any, idx: number) => {
            if (!acc.id) errors.push({ type: 'error', message: `Account at index ${idx} missing ID` });
            if (!acc.type) errors.push({ type: 'error', message: `Account '${acc.name || idx}' missing type` });
            accountIds.add(acc.id);

            if (acc.targetPercentage < 0 || acc.targetPercentage > 100) {
                errors.push({ type: 'error', message: `Account '${acc.name}' has invalid target percentage: ${acc.targetPercentage}` });
            }
        });

        // 3. Transactions Validation
        data.transactions.forEach((tx: any, idx: number) => {
            if (!tx.id) errors.push({ type: 'error', message: `Transaction at index ${idx} missing ID` });
            if (!tx.date) errors.push({ type: 'error', message: `Transaction ${tx.id || idx} missing date` });
            if (typeof tx.totalAmount !== 'number') errors.push({ type: 'error', message: `Transaction ${tx.id} has invalid amount` });

            let allocationSum = 0;
            if (Array.isArray(tx.allocations)) {
                tx.allocations.forEach((alloc: any) => {
                    allocationSum += alloc.amount || 0;
                    if (!accountIds.has(alloc.accountId)) {
                        errors.push({ type: 'error', message: `Transaction ${tx.id} references unknown account ID: ${alloc.accountId}` });
                    }
                });
            }

            // Floating point tolerance
            if (Math.abs(allocationSum - tx.totalAmount) > 0.1) {
                errors.push({ type: 'warning', message: `Transaction ${tx.id} allocations (${allocationSum}) do not match total (${tx.totalAmount})` });
            }
        });

        return errors;
    };

    const processImport = async (jsonDataString: string) => {
        setValidationReport([]);
        setSuccess("");
        setIsValidating(true);

        try {
            // Sanitize input: Trim whitespace and remove invisible Byte Order Mark (BOM)
            const cleanJson = jsonDataString.trim().replace(/^\uFEFF/, '');

            let data;
            try {
                data = JSON.parse(cleanJson);
            } catch (syntaxError) {
                // If direct parsing fails, check if the user accidentally pasted a raw CSV or non-JSON text
                // that wasn't caught by the file uploader logic.
                // However, for this specific "Unexpected token 'P'" error, it's likely a header issue or just invalid text.
                throw new Error("The file or pasted content is not valid JSON. Please check for formatting errors.");
            }

            // Step 1: Validate
            const report = validateData(data);
            setValidationReport(report);
            const hasErrors = report.some(r => r.type === 'error');

            setIsValidating(false);

            if (hasErrors) {
                return; // Stop here, showing report
            }

            // Step 2: Import to Database
            setIsImporting(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated.");

            // A. Import Bank Accounts
            if (data.bankAccounts?.length > 0) {
                const bankAccountsPayload = data.bankAccounts.map((ba: any) => ({
                    id: ba.id,
                    user_id: user.id,
                    bank_name: ba.bankName,
                    branch_name: ba.branchName,
                    account_number: ba.accountNumber,
                    account_type: ba.accountType,
                    routing_number: ba.routingNumber,
                    swift_code: ba.swiftCode,
                    created_at: ba.createdAt || new Date().toISOString()
                }));
                const { error: bankError } = await supabase.from('bank_accounts').upsert(bankAccountsPayload);
                if (bankError) throw bankError;
            }

            // B. Import Accounts
            const accountsPayload = data.accounts.map((acc: any) => ({
                id: acc.id,
                user_id: user.id,
                name: acc.name,
                type: acc.type,
                balance: acc.balance,
                target_percentage: acc.targetPercentage,
                current_percentage: acc.currentPercentage,
                bank_account_id: acc.bankAccountId // Assumes bank accounts imported first or IDs match
            }));
            const { error: accError } = await supabase.from('accounts').upsert(accountsPayload);
            if (accError) throw accError;

            // C. Import Transactions
            const txPayload = data.transactions.map((tx: any) => ({
                id: tx.id,
                user_id: user.id,
                date: tx.date,
                description: tx.description,
                total_amount: tx.totalAmount
            }));
            const { error: txError } = await supabase.from('transactions').upsert(txPayload);
            if (txError) throw txError;

            // D. Import Allocations
            const allocPayload: any[] = [];
            data.transactions.forEach((tx: any) => {
                if (tx.allocations) {
                    tx.allocations.forEach((alloc: any) => {
                        allocPayload.push({
                            transaction_id: tx.id,
                            account_id: alloc.accountId,
                            amount: alloc.amount
                        });
                    });
                }
            });
            if (allocPayload.length > 0) {
                // Clean up old allocations for these transactions first to avoid dupes if re-importing
                // Actually upsert on allocations table usually needs a PK. 
                // Our schema might not have a simple PK for allocations. It's usually (transaction_id, account_id).
                // We'll safely delete relevant allocations first? 
                // For now, let's try direct insert, ignoring duplicates if possible or assume clean slate.
                // Better: Delete existing allocations for these specific transactions.
                const txIds = data.transactions.map((t: any) => t.id);
                await supabase.from('transaction_allocations').delete().in('transaction_id', txIds);
                const { error: allocError } = await supabase.from('transaction_allocations').insert(allocPayload);
                if (allocError) throw allocError;
            }

            // E. Import Distributions
            if (data.profitDistributions?.length > 0) {
                const distPayload = data.profitDistributions.map((dist: any) => ({
                    id: dist.id,
                    user_id: user.id,
                    date: dist.date,
                    quarter: dist.quarter,
                    total_profit: dist.totalProfit,
                    distribution_amount: dist.distributionAmount,
                    to_owners: dist.toOwners,
                    to_company: dist.toCompany,
                    notes: dist.notes,
                    is_completed: dist.isCompleted
                }));
                const { error: distError } = await supabase.from('profit_distributions').upsert(distPayload);
                if (distError) throw distError;
            }

            setSuccess("Import Successful! Reloading...");
            setTimeout(() => window.location.reload(), 1500);

        } catch (err: any) {
            setValidationReport([{ type: 'error', message: `System Error: ${err.message}` }]);
        } finally {
            setIsImporting(false);
            setIsValidating(false);
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            if (file.name.endsWith('.csv')) {
                processImport(parseCSV(content));
            } else {
                processImport(content);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    return (
        <Card className="border-t-4 border-t-primary/20">
            <CardHeader>
                <CardTitle>Import/Export Data</CardTitle>
                <CardDescription>
                    Backup or restore your financial data. Imports are strictly validated before saving to the database.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                {/* Export */}
                <div className="bg-slate-50 p-4 rounded-lg border">
                    <h3 className="text-sm font-semibold mb-2">Export Backup</h3>
                    <Button onClick={handleExport} variant="outline" className="w-full">
                        <Download className="mr-2 h-4 w-4" /> Download JSON
                    </Button>
                </div>

                {/* Import */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-base">Import Data</Label>
                        {validationReport.length > 0 && (
                            <span className="text-xs font-bold text-red-600 animate-pulse">
                                {validationReport.filter(e => e.type === 'error').length} Errors Found
                            </span>
                        )}
                    </div>

                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                        onDrop={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            const file = e.dataTransfer.files[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                    const content = (ev.target?.result as string) || "";
                                    if (file.name.toLowerCase().endsWith('.csv')) {
                                        processImport(parseCSV(content));
                                    } else {
                                        processImport(content);
                                    }
                                };
                                reader.readAsText(file);
                            }
                        }}
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${isDragging ? 'border-primary bg-primary/10' : 'border-slate-200 hover:border-primary/50'
                            }`}
                    >
                        <input type="file" id="file-upload" accept=".json,.csv" onChange={handleFileUpload} className="hidden" />
                        <label htmlFor="file-upload" className="cursor-pointer block">
                            {isImporting ? (
                                <div className="flex flex-col items-center text-primary">
                                    <Loader2 className="h-10 w-10 animate-spin mb-2" />
                                    <p className="font-semibold">Importing to Database...</p>
                                </div>
                            ) : isValidating ? (
                                <div className="flex flex-col items-center text-orange-500">
                                    <Loader2 className="h-10 w-10 animate-spin mb-2" />
                                    <p className="font-semibold">Checking Data Integrity...</p>
                                </div>
                            ) : (
                                <>
                                    <FileUp className="mx-auto h-10 w-10 text-slate-400 mb-3" />
                                    <p className="text-sm font-medium text-slate-700">Click to upload or drag & drop</p>
                                    <p className="text-xs text-slate-400 mt-1">JSON or CSV</p>
                                </>
                            )}
                        </label>
                    </div>

                    <div className="relative">
                        <Textarea
                            placeholder='Or paste JSON content here...'
                            value={importData}
                            onChange={(e) => setImportData(e.target.value)}
                            rows={4}
                            className="font-mono text-xs resize-none"
                        />
                        <Button
                            size="sm"
                            className="absolute bottom-2 right-2"
                            disabled={!importData.trim() || isValidating || isImporting}
                            onClick={() => processImport(importData)}
                        >
                            <Upload className="w-3 h-3 mr-1" /> Validate & Import
                        </Button>
                    </div>

                    {/* Validation Report UI */}
                    {validationReport.length > 0 && (
                        <div className="rounded-md border border-red-200 bg-red-50 overflow-hidden">
                            <div className="p-3 bg-red-100/50 border-b border-red-200 flex items-center gap-2 text-red-800 font-semibold text-sm">
                                <XCircle className="w-4 h-4" />
                                Import Failed: Validation Issues Found
                            </div>
                            <ScrollArea className="h-[200px] w-full p-4">
                                <ul className="space-y-2 text-sm">
                                    {validationReport.map((error, idx) => (
                                        <li key={idx} className={`flex items-start gap-2 ${error.type === 'error' ? 'text-red-700' : 'text-orange-700'}`}>
                                            <span className="mt-0.5">•</span>
                                            <span>{error.message}</span>
                                        </li>
                                    ))}
                                </ul>
                            </ScrollArea>
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="p-4 bg-green-50 text-green-800 rounded-lg flex items-center justify-center gap-2 font-medium border border-green-200 animate-in fade-in slide-in-from-bottom-2">
                            <CheckCircle2 className="w-5 h-5" />
                            {success}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
