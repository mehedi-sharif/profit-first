"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import { BankAccount } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Plus, Trash2, Link as LinkIcon, Pencil, AlertTriangle } from "lucide-react";

export function BankAccountManager() {
    const { bankAccounts, accounts, addBankAccount, updateBankAccount, deleteBankAccount, linkBankAccountToCategory } = useStore();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState("");
    const [selectedBankAccount, setSelectedBankAccount] = useState<BankAccount | null>(null);
    const [newBankAccount, setNewBankAccount] = useState({
        bankName: "",
        branchName: "",
        accountNumber: "",
        accountType: "Personal",
        routingNumber: "",
        swiftCode: "",
    });
    const [editBankAccount, setEditBankAccount] = useState({
        bankName: "",
        branchName: "",
        accountNumber: "",
        accountType: "Personal",
        routingNumber: "",
        swiftCode: "",
    });

    const handleAddBankAccount = async () => {
        if (!newBankAccount.bankName || !newBankAccount.branchName || !newBankAccount.accountNumber) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            const id = crypto.randomUUID();
            const now = new Date().toISOString();

            const bankAccountPayload = {
                id,
                user_id: user.id,
                bank_name: newBankAccount.bankName,
                branch_name: newBankAccount.branchName,
                account_number: newBankAccount.accountNumber,
                account_type: newBankAccount.accountType,
                routing_number: newBankAccount.routingNumber || null,
                swift_code: newBankAccount.swiftCode || null,
            };

            const { error } = await supabase.from("bank_accounts").insert(bankAccountPayload);
            if (error) throw error;

            // Update local store
            addBankAccount({
                id,
                bankName: newBankAccount.bankName,
                branchName: newBankAccount.branchName,
                accountNumber: newBankAccount.accountNumber,
                accountType: newBankAccount.accountType as "Personal" | "Business",
                routingNumber: newBankAccount.routingNumber,
                swiftCode: newBankAccount.swiftCode,
                createdAt: now,
            });

            setNewBankAccount({ bankName: "", branchName: "", accountNumber: "", accountType: "Personal", routingNumber: "", swiftCode: "" });
            setIsAddDialogOpen(false);
        } catch (error: any) {
            console.error("Error adding bank account:", error);
            alert("Failed to add bank account: " + error.message);
        }
    };

    const handleEditClick = (bankAccount: BankAccount) => {
        setSelectedBankAccount(bankAccount);
        setEditBankAccount({
            bankName: bankAccount.bankName,
            branchName: bankAccount.branchName,
            accountNumber: bankAccount.accountNumber,
            accountType: bankAccount.accountType,
            routingNumber: bankAccount.routingNumber || "",
            swiftCode: bankAccount.swiftCode || "",
        });
        setIsEditDialogOpen(true);
    };

    const handleUpdateBankAccount = async () => {
        if (!selectedBankAccount || !editBankAccount.bankName || !editBankAccount.branchName || !editBankAccount.accountNumber) return;

        try {
            const updates = {
                bank_name: editBankAccount.bankName,
                branch_name: editBankAccount.branchName,
                account_number: editBankAccount.accountNumber,
                account_type: editBankAccount.accountType,
                routing_number: editBankAccount.routingNumber || null,
                swift_code: editBankAccount.swiftCode || null,
            };

            const { error } = await supabase
                .from("bank_accounts")
                .update(updates)
                .eq("id", selectedBankAccount.id);

            if (error) throw error;

            updateBankAccount(selectedBankAccount.id, {
                bankName: editBankAccount.bankName,
                branchName: editBankAccount.branchName,
                accountNumber: editBankAccount.accountNumber,
                accountType: editBankAccount.accountType as "Personal" | "Business",
                routingNumber: editBankAccount.routingNumber,
                swiftCode: editBankAccount.swiftCode,
            });

            setIsEditDialogOpen(false);
            setSelectedBankAccount(null);
        } catch (error: any) {
            console.error("Error updating bank account:", error);
            alert("Failed to update bank account: " + error.message);
        }
    };

    const handleDeleteClick = (bankAccount: BankAccount) => {
        setSelectedBankAccount(bankAccount);
        setDeleteConfirmation("");
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedBankAccount || deleteConfirmation !== "CONFIRM") return;

        try {
            const { error } = await supabase
                .from("bank_accounts")
                .delete()
                .eq("id", selectedBankAccount.id);

            if (error) throw error;

            deleteBankAccount(selectedBankAccount.id);
            setIsDeleteDialogOpen(false);
            setSelectedBankAccount(null);
            setDeleteConfirmation("");
        } catch (error: any) {
            console.error("Error deleting bank account:", error);
            alert("Failed to delete bank account: " + error.message);
        }
    };

    const getLinkedAccount = (bankAccountId: string) => {
        return accounts.find((acc) => acc.bankAccountId === bankAccountId);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Bank Accounts</CardTitle>
                        <CardDescription>Manage your bank accounts and link them to categories.</CardDescription>
                    </div>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Bank Account
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Add Bank Account</DialogTitle>
                                <DialogDescription>
                                    Add a new bank account to link with your Profit First categories.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bankName">Bank Name</Label>
                                    <Input
                                        id="bankName"
                                        placeholder="e.g., Dutch Bangla Bank"
                                        value={newBankAccount.bankName}
                                        onChange={(e) => setNewBankAccount({ ...newBankAccount, bankName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="branchName">Branch Name</Label>
                                    <Input
                                        id="branchName"
                                        placeholder="e.g., Gulshan Branch"
                                        value={newBankAccount.branchName}
                                        onChange={(e) => setNewBankAccount({ ...newBankAccount, branchName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="accountNumber">Account Number (Last 4 digits)</Label>
                                    <Input
                                        id="accountNumber"
                                        placeholder="e.g., ****1234"
                                        value={newBankAccount.accountNumber}
                                        onChange={(e) => setNewBankAccount({ ...newBankAccount, accountNumber: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="accountType">Account Type</Label>
                                    <Select
                                        value={newBankAccount.accountType}
                                        onValueChange={(value) => setNewBankAccount({ ...newBankAccount, accountType: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Personal">Personal</SelectItem>
                                            <SelectItem value="Business">Business</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="routingNumber">Routing Number (Optional)</Label>
                                    <Input
                                        id="routingNumber"
                                        placeholder="e.g., 123456789"
                                        value={newBankAccount.routingNumber}
                                        onChange={(e) => setNewBankAccount({ ...newBankAccount, routingNumber: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="swiftCode">SWIFT Code (Optional)</Label>
                                    <Input
                                        id="swiftCode"
                                        placeholder="e.g., DBBLBDDH"
                                        value={newBankAccount.swiftCode}
                                        onChange={(e) => setNewBankAccount({ ...newBankAccount, swiftCode: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleAddBankAccount}>Add Account</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {bankAccounts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Building2 className="mx-auto h-12 w-12 mb-2 opacity-50" />
                        <p>No bank accounts added yet.</p>
                        <p className="text-sm">Add a bank account to link with your categories.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {bankAccounts.map((bankAccount) => {
                            const linkedAccount = getLinkedAccount(bankAccount.id);
                            return (
                                <div
                                    key={bankAccount.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Building2 className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <div className="font-medium">{bankAccount.bankName}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {bankAccount.branchName} • {bankAccount.accountType} • {bankAccount.accountNumber}
                                            </div>
                                            {(bankAccount.routingNumber || bankAccount.swiftCode) && (
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {bankAccount.routingNumber && `Routing: ${bankAccount.routingNumber}`}
                                                    {bankAccount.routingNumber && bankAccount.swiftCode && " • "}
                                                    {bankAccount.swiftCode && `SWIFT: ${bankAccount.swiftCode}`}
                                                </div>
                                            )}
                                            {linkedAccount && (
                                                <div className="flex items-center gap-1 text-xs text-primary mt-1">
                                                    <LinkIcon className="h-3 w-3" />
                                                    Linked to {linkedAccount.name}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Select
                                            value={linkedAccount?.id || "none"}
                                            onValueChange={(value) => {
                                                if (value === "none") {
                                                    const currentLinked = accounts.find((acc) => acc.bankAccountId === bankAccount.id);
                                                    if (currentLinked) {
                                                        linkBankAccountToCategory(currentLinked.id, undefined);
                                                    }
                                                } else {
                                                    linkBankAccountToCategory(value, bankAccount.id);
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Link to category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Not linked</SelectItem>
                                                {accounts.map((acc) => (
                                                    <SelectItem key={acc.id} value={acc.id}>
                                                        {acc.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEditClick(bankAccount)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteClick(bankAccount)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Bank Account</DialogTitle>
                        <DialogDescription>
                            Update bank account information.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-bankName">Bank Name</Label>
                            <Input
                                id="edit-bankName"
                                value={editBankAccount.bankName}
                                onChange={(e) => setEditBankAccount({ ...editBankAccount, bankName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-branchName">Branch Name</Label>
                            <Input
                                id="edit-branchName"
                                value={editBankAccount.branchName}
                                onChange={(e) => setEditBankAccount({ ...editBankAccount, branchName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-accountNumber">Account Number (Last 4 digits)</Label>
                            <Input
                                id="edit-accountNumber"
                                value={editBankAccount.accountNumber}
                                onChange={(e) => setEditBankAccount({ ...editBankAccount, accountNumber: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-accountType">Account Type</Label>
                            <Select
                                value={editBankAccount.accountType}
                                onValueChange={(value) => setEditBankAccount({ ...editBankAccount, accountType: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Personal">Personal</SelectItem>
                                    <SelectItem value="Business">Business</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-routingNumber">Routing Number (Optional)</Label>
                            <Input
                                id="edit-routingNumber"
                                value={editBankAccount.routingNumber}
                                onChange={(e) => setEditBankAccount({ ...editBankAccount, routingNumber: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-swiftCode">SWIFT Code (Optional)</Label>
                            <Input
                                id="edit-swiftCode"
                                value={editBankAccount.swiftCode}
                                onChange={(e) => setEditBankAccount({ ...editBankAccount, swiftCode: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateBankAccount}>Update Account</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Delete Bank Account
                        </DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the bank account
                            {selectedBankAccount && ` "${selectedBankAccount.bankName}"`} and unlink it from any categories.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="delete-confirm">
                                Type <span className="font-bold">CONFIRM</span> to delete
                            </Label>
                            <Input
                                id="delete-confirm"
                                placeholder="CONFIRM"
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleteConfirmation !== "CONFIRM"}
                        >
                            Delete Account
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
