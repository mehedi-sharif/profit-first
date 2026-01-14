export type AccountType = 'INCOME' | 'PROFIT' | 'OWNERS_COMP' | 'TAX' | 'OPEX';

export interface BankAccount {
    id: string;
    bankName: string;
    branchName: string;
    accountNumber: string; // Last 4 digits or masked
    accountType: string; // e.g., "Personal", "Business"
    routingNumber?: string;
    swiftCode?: string;
    createdAt: string;
}

export interface Account {
    id: string;
    name: string;
    type: AccountType;
    targetPercentage: number; // TAPS
    currentPercentage: number; // CAPS
    balance: number;
    bankAccountId?: string; // Optional link to a bank account
}

export interface Allocation {
    accountId: string;
    amount: number;
}

export interface Transaction {
    id: string;
    date: string; // ISO date
    description: string;
    totalAmount: number;
    allocations: Allocation[];
}

export interface ProfitDistribution {
    id: string;
    date: string; // ISO date
    quarter: string; // e.g., "Q1 2026"
    totalProfit: number; // Total profit balance at time of distribution
    distributionAmount: number; // 50% of total profit
    toOwners: number; // 50% of distribution
    toCompany: number; // 50% of distribution
    notes?: string;
    isCompleted: boolean; // Whether the transfer has been completed
}

export interface AppState {
    currencySymbol: string;
    accounts: Account[];
    transactions: Transaction[];
    bankAccounts: BankAccount[];
    profitDistributions: ProfitDistribution[];
}
