import { supabase } from "./supabase";
import { Account, Transaction, BankAccount, ProfitDistribution } from "./types";

export interface AppData {
    accounts: Account[];
    transactions: Transaction[];
    bankAccounts: BankAccount[];
    profitDistributions: ProfitDistribution[];
    currencySymbol: string;
}

/**
 * Migrate local storage data to Supabase for a newly authenticated user
 */
export async function migrateLocalDataToSupabase(userId: string): Promise<void> {
    try {
        // Get data from localStorage
        const localData = localStorage.getItem("profit-first-store");
        if (!localData) {
            console.log("No local data to migrate");
            return;
        }

        const parsedData = JSON.parse(localData);
        // Validating state structure - zustand persist usually wraps in { state: ... }
        const state = parsedData.state || parsedData;

        // Check if user already has data in Supabase
        const { data: existingAccounts } = await supabase
            .from("accounts")
            .select("id")
            .eq("user_id", userId)
            .limit(1);

        if (existingAccounts && existingAccounts.length > 0) {
            console.log("User already has data in Supabase, skipping migration");
            return;
        }

        console.log("Starting data migration to Supabase...");

        // Migrate accounts
        if (state.accounts && state.accounts.length > 0) {
            const accountsToInsert = state.accounts.map((account: Account) => ({
                id: account.id,
                user_id: userId,
                name: account.name,
                type: account.type,
                balance: account.balance,
                target_percentage: account.targetPercentage,
                current_percentage: account.currentPercentage,
                bank_account_id: account.bankAccountId,
            }));

            const { error: accountsError } = await supabase
                .from("accounts")
                .insert(accountsToInsert);

            if (accountsError) throw accountsError;
            console.log(`Migrated ${accountsToInsert.length} accounts`);
        }

        // Migrate bank accounts
        if (state.bankAccounts && state.bankAccounts.length > 0) {
            const bankAccountsToInsert = state.bankAccounts.map((bankAccount: BankAccount) => ({
                id: bankAccount.id,
                user_id: userId,
                bank_name: bankAccount.bankName,
                branch_name: bankAccount.branchName,
                account_number: bankAccount.accountNumber,
                account_type: bankAccount.accountType,
                routing_number: bankAccount.routingNumber,
                swift_code: bankAccount.swiftCode,
            }));

            const { error: bankAccountsError } = await supabase
                .from("bank_accounts")
                .insert(bankAccountsToInsert);

            if (bankAccountsError) throw bankAccountsError;
            console.log(`Migrated ${bankAccountsToInsert.length} bank accounts`);
        }

        // Migrate transactions
        if (state.transactions && state.transactions.length > 0) {
            const transactionsToInsert = state.transactions.map((transaction: Transaction) => ({
                id: transaction.id,
                user_id: userId,
                date: transaction.date,
                description: transaction.description,
                total_amount: transaction.totalAmount,
            }));

            const { error: transactionsError } = await supabase
                .from("transactions")
                .insert(transactionsToInsert);

            if (transactionsError) throw transactionsError;
            console.log(`Migrated ${transactionsToInsert.length} transactions`);

            // Migrate transaction allocations
            const allocationsToInsert: any[] = [];
            state.transactions.forEach((transaction: Transaction) => {
                if (transaction.allocations) {
                    transaction.allocations.forEach((allocation: any) => {
                        allocationsToInsert.push({
                            transaction_id: transaction.id,
                            account_id: allocation.accountId,
                            amount: allocation.amount,
                        });
                    });
                }
            });

            if (allocationsToInsert.length > 0) {
                const { error: allocationsError } = await supabase
                    .from("transaction_allocations")
                    .insert(allocationsToInsert);

                if (allocationsError) throw allocationsError;
                console.log(`Migrated ${allocationsToInsert.length} transaction allocations`);
            }
        }

        // Migrate profit distributions
        if (state.profitDistributions && state.profitDistributions.length > 0) {
            const distributionsToInsert = state.profitDistributions.map((distribution: ProfitDistribution) => ({
                id: distribution.id,
                user_id: userId,
                date: distribution.date,
                quarter: distribution.quarter,
                total_profit: distribution.totalProfit,
                distribution_amount: distribution.distributionAmount,
                to_owners: distribution.toOwners,
                to_company: distribution.toCompany,
                notes: distribution.notes,
                is_completed: distribution.isCompleted || false,
            }));

            const { error: distributionsError } = await supabase
                .from("profit_distributions")
                .insert(distributionsToInsert);

            if (distributionsError) throw distributionsError;
            console.log(`Migrated ${distributionsToInsert.length} profit distributions`);
        }

        // Update user profile with currency preference
        // Use currencySymbol as per Store interface and currency_symbol as per DB schema
        if (state.currencySymbol) {
            const { error: profileError } = await supabase
                .from("profiles")
                .update({ currency_symbol: state.currencySymbol })
                .eq("id", userId);

            if (profileError) {
                // Try to recover if profile missing
                if (profileError.code === "PGRST116" || profileError.details?.includes("not found")) {
                    await supabase.from("profiles").upsert({
                        id: userId,
                        currency_symbol: state.currencySymbol
                    });
                } else {
                    console.error("Error updating profile currency:", profileError);
                }
            } else {
                console.log(`Updated currency preference to ${state.currencySymbol}`);
            }
        }

        console.log("✅ Data migration completed successfully!");

        // Mark migration as complete in localStorage
        localStorage.setItem("profit-first-migrated", "true");
    } catch (error) {
        console.error("Error migrating data to Supabase:", error);
        throw error;
    }
}

/**
 * Load all user data from Supabase
 */
export async function loadDataFromSupabase(userId: string): Promise<AppData | null> {
    try {
        console.log("Loading data from Supabase for user:", userId);
        const data: Partial<AppData> = {};

        // Load accounts
        try {
            const { data: accountsData, error: accountsError } = await supabase
                .from("accounts")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: true });

            if (accountsError) {
                console.error("Error loading accounts:", accountsError);
            } else {
                data.accounts = (accountsData || []).map((acc) => ({
                    id: acc.id,
                    name: acc.name,
                    type: acc.type,
                    balance: acc.balance,
                    targetPercentage: acc.target_percentage,
                    currentPercentage: acc.current_percentage || 0,
                    bankAccountId: acc.bank_account_id,
                }));
            }
        } catch (e) {
            console.error("Exception loading accounts:", e);
            data.accounts = [];
        }

        // Load bank accounts
        try {
            const { data: bankAccountsData, error: bankAccountsError } = await supabase
                .from("bank_accounts")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: true });

            if (bankAccountsError) {
                console.error("Error loading bank accounts:", bankAccountsError);
            } else {
                data.bankAccounts = (bankAccountsData || []).map((ba) => ({
                    id: ba.id,
                    bankName: ba.bank_name,
                    branchName: ba.branch_name,
                    accountNumber: ba.account_number,
                    accountType: ba.account_type,
                    routingNumber: ba.routing_number,
                    swiftCode: ba.swift_code,
                    createdAt: ba.created_at,
                }));
            }
        } catch (e) {
            console.error("Exception loading bank accounts:", e);
            data.bankAccounts = [];
        }

        // Load transactions
        try {
            const { data: transactionsData, error: transactionsError } = await supabase
                .from("transactions")
                .select("*, transaction_allocations(*)")
                .eq("user_id", userId)
                .order("date", { ascending: false });

            if (transactionsError) {
                console.error("Error loading transactions:", transactionsError);
            } else {
                data.transactions = (transactionsData || []).map((txn) => {
                    const allocations: { accountId: string; amount: number }[] = [];
                    if (txn.transaction_allocations) {
                        try {
                            txn.transaction_allocations.forEach((alloc: any) => {
                                allocations.push({
                                    accountId: alloc.account_id,
                                    amount: alloc.amount,
                                });
                            });
                        } catch (err) {
                            console.error("Error parsing allocations for transaction:", txn.id, err);
                        }
                    }

                    return {
                        id: txn.id,
                        date: txn.date,
                        description: txn.description,
                        totalAmount: txn.total_amount,
                        allocations,
                    };
                });
            }
        } catch (e) {
            console.error("Exception loading transactions:", e);
            data.transactions = [];
        }

        // Load profit distributions
        try {
            const { data: distributionsData, error: distributionsError } = await supabase
                .from("profit_distributions")
                .select("*")
                .eq("user_id", userId)
                .order("date", { ascending: false });

            if (distributionsError) {
                console.error("Error loading profit distributions:", distributionsError);
            } else {
                data.profitDistributions = (distributionsData || []).map((dist) => ({
                    id: dist.id,
                    date: dist.date,
                    quarter: dist.quarter,
                    totalProfit: dist.total_profit,
                    distributionAmount: dist.distribution_amount,
                    toOwners: dist.to_owners,
                    toCompany: dist.to_company,
                    notes: dist.notes,
                    isCompleted: dist.is_completed || false,
                }));
            }
        } catch (e) {
            console.error("Exception loading profit distributions:", e);
            data.profitDistributions = [];
        }

        // Load currency from profile (currency_symbol)
        try {
            const { data: profileData, error: profileError } = await supabase
                .from("profiles")
                .select("currency_symbol")
                .eq("id", userId)
                .single();

            if (profileError) {
                if (profileError.code === "PGRST116") {
                    console.log("Profile not found (PGRST116). Attempting to create missing profile...");
                    // Profile missing (likely deleted manually), try to recreate it
                    const { error: insertError } = await supabase
                        .from("profiles")
                        .insert({ id: userId });

                    if (insertError) {
                        console.error("Failed to create missing profile:", insertError.message);
                    } else {
                        console.log("Successfully created missing profile.");
                    }
                } else {
                    console.error("Error loading profile:", profileError.message, "Code:", profileError.code);
                }
            }
            data.currencySymbol = profileData?.currency_symbol || "USD";
        } catch (e: any) {
            console.error("Exception loading profile:", e?.message || e);
            data.currencySymbol = "USD";
        }

        console.log("✅ Data loaded from Supabase successfully!");

        return {
            accounts: data.accounts || [],
            transactions: data.transactions || [],
            bankAccounts: data.bankAccounts || [],
            profitDistributions: data.profitDistributions || [],
            currencySymbol: data.currencySymbol || "USD",
        };
    } catch (error: any) {
        console.error("Critical error in loadDataFromSupabase:", error?.message || error);
        return null;
    }
}

/**
 * Check if local data has been migrated
 */
export function hasLocalDataBeenMigrated(): boolean {
    return localStorage.getItem("profit-first-migrated") === "true";
}

/**
 * Clear local storage after successful migration
 */
export function clearLocalStorageAfterMigration(): void {
    const migrated = localStorage.getItem("profit-first-migrated");
    localStorage.clear();
    if (migrated) {
        localStorage.setItem("profit-first-migrated", migrated);
    }
}
