"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Wallet, History, Settings, PlusCircle, TrendingUp } from "lucide-react";

const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/allocate", label: "Allocate", icon: Wallet },
    { href: "/distributions", label: "Distributions", icon: TrendingUp },
    { href: "/history", label: "History", icon: History },
    { href: "/settings", label: "Settings", icon: Settings },
];

export function Navbar() {
    const pathname = usePathname();

    return (
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container flex h-16 items-center justify-between px-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
                    <span className="text-primary">Profit</span>First
                </Link>

                {/* Centered Navigation - Desktop */}
                <div className="hidden md:flex items-center gap-6 absolute left-1/2 transform -translate-x-1/2">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                                pathname === item.href
                                    ? "text-primary"
                                    : "text-muted-foreground"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    ))}
                </div>

                {/* Action Button */}
                <div className="flex items-center gap-4">
                    <Button asChild size="sm" className="hidden sm:flex">
                        <Link href="/allocate">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Income
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Mobile Nav */}
            <div className="md:hidden border-t flex justify-around p-2 bg-background">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center p-2 text-xs font-medium transition-colors hover:text-primary",
                            pathname === item.href ? "text-primary" : "text-muted-foreground"
                        )}
                    >
                        <item.icon className="h-5 w-5 mb-1" />
                        {item.label}
                    </Link>
                ))}
            </div>
        </nav>
    );
}

