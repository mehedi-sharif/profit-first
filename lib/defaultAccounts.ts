import { Account, AccountType } from './types';

export const createDefaultAccounts = (): Account[] => {
    return [
        {
            id: crypto.randomUUID(),
            name: "Real Revenue",
            type: "INCOME" as AccountType,
            targetPercentage: 0,
            currentPercentage: 0,
            balance: 0,
        },
        {
            id: crypto.randomUUID(),
            name: "Company Profit",
            type: "PROFIT" as AccountType,
            targetPercentage: 40,
            currentPercentage: 0,
            balance: 0,
        },
        {
            id: crypto.randomUUID(),
            name: "Owner's Comp",
            type: "OWNERS_COMP" as AccountType,
            targetPercentage: 20,
            currentPercentage: 0,
            balance: 0,
        },
        {
            id: crypto.randomUUID(),
            name: "Tax/Zakat",
            type: "TAX" as AccountType,
            targetPercentage: 10,
            currentPercentage: 0,
            balance: 0,
        },
        {
            id: crypto.randomUUID(),
            name: "Operating Expense",
            type: "OPEX" as AccountType,
            targetPercentage: 30,
            currentPercentage: 0,
            balance: 0,
        },
    ];
};

