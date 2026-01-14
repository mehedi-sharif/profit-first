import { AllocationCalculator } from "@/components/AllocationCalculator";

export default function AllocatePage() {
    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold tracking-tight">Allocate Revenue</h1>
            <p className="text-muted-foreground">Distribute your income according to your target percentages (TAPS).</p>
            <AllocationCalculator />
        </div>
    );
}
