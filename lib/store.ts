import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, Account, Transaction, BankAccount, ProfitDistribution } from './types';
import { createDefaultAccounts } from './defaultAccounts';

interface Store extends AppState {
    updateAccount: (id: string, updates: Partial<Account>) => void;
    addTransaction: (transaction: Transaction) => void;
    setAccounts: (accounts: Account[]) => void;
    setTransactions: (transactions: Transaction[]) => void;
    setBankAccounts: (bankAccounts: BankAccount[]) => void;
    setProfitDistributions: (profitDistributions: ProfitDistribution[]) => void;
    setCurrency: (symbol: string) => void;
    initializeAccounts: () => void;
    addBankAccount: (bankAccount: BankAccount) => void;
    updateBankAccount: (id: string, updates: Partial<BankAccount>) => void;
    deleteBankAccount: (id: string) => void;
    linkBankAccountToCategory: (accountId: string, bankAccountId: string | undefined) => void;
    addProfitDistribution: (distribution: ProfitDistribution) => void;
    toggleDistributionComplete: (id: string) => void;
}

export const useStore = create<Store>()(
    persist(
        (set, get) => ({
            currencySymbol: '৳',
            accounts: [],
            transactions: [],
            bankAccounts: [],
            profitDistributions: [],
            setCurrency: (symbol) => set({ currencySymbol: symbol }),
            setAccounts: (accounts) => set({ accounts }),
            setTransactions: (transactions) => set({ transactions }),
            setBankAccounts: (bankAccounts) => set({ bankAccounts }),
            setProfitDistributions: (profitDistributions) => set({ profitDistributions }),
            initializeAccounts: () => {
                const state = get();
                if (state.accounts.length === 0) {
                    set({ accounts: createDefaultAccounts() });
                }
            },
            updateAccount: (id, updates) =>
                set((state) => ({
                    accounts: state.accounts.map((acc) =>
                        acc.id === id ? { ...acc, ...updates } : acc
                    ),
                })),
            addTransaction: (transaction) =>
                set((state) => ({
                    transactions: [transaction, ...state.transactions],
                    // Also update balances
                    accounts: state.accounts.map((acc) => {
                        const allocation = transaction.allocations.find((a) => a.accountId === acc.id);
                        if (allocation) {
                            return { ...acc, balance: acc.balance + allocation.amount };
                        }
                        return acc;
                    }),
                })),
            addBankAccount: (bankAccount) =>
                set((state) => ({
                    bankAccounts: [...state.bankAccounts, bankAccount],
                })),
            updateBankAccount: (id, updates) =>
                set((state) => ({
                    bankAccounts: state.bankAccounts.map((ba) =>
                        ba.id === id ? { ...ba, ...updates } : ba
                    ),
                })),
            deleteBankAccount: (id) =>
                set((state) => ({
                    bankAccounts: state.bankAccounts.filter((ba) => ba.id !== id),
                    // Also unlink from any accounts
                    accounts: state.accounts.map((acc) =>
                        acc.bankAccountId === id ? { ...acc, bankAccountId: undefined } : acc
                    ),
                })),
            linkBankAccountToCategory: (accountId, bankAccountId) =>
                set((state) => ({
                    accounts: state.accounts.map((acc) =>
                        acc.id === accountId ? { ...acc, bankAccountId } : acc
                    ),
                })),
            addProfitDistribution: (distribution) =>
                set((state) => {
                    // Find the profit account and deduct the distribution amount
                    const profitAccount = state.accounts.find((acc) => acc.type === 'PROFIT');
                    if (!profitAccount) return state;

                    return {
                        profitDistributions: [distribution, ...state.profitDistributions],
                        accounts: state.accounts.map((acc) =>
                            acc.type === 'PROFIT'
                                ? { ...acc, balance: acc.balance - distribution.distributionAmount }
                                : acc
                        ),
                    };
                }),
            toggleDistributionComplete: (id) =>
                set((state) => ({
                    profitDistributions: state.profitDistributions.map((dist) =>
                        dist.id === id ? { ...dist, isCompleted: !dist.isCompleted } : dist
                    ),
                })),
        }),
        {
            name: 'profit-first-storage',
        }
    )
);
