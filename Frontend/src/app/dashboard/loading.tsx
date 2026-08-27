import { Card, CardContent } from "@/components/ui/card";

export default function DashboardLoading() {
    return (
        <div className="min-h-screen bg-[#1B253B] text-[#ECF0F7] font-body selection:bg-[#5B6CF0]/30 overflow-hidden relative">

            {/* Navbar skeleton */}
            <nav className="relative z-50 border-b border-[#8B99B0]/10 backdrop-blur-md bg-[#1B253B]/90 flex-none h-14">
                <div className="max-w-[88rem] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#1B253B] border border-[#8B99B0]/10 animate-pulse" />
                        <div className="w-24 h-5 bg-[#1B253B] rounded animate-pulse" />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-32 h-4 bg-[#1B253B] rounded animate-pulse" />
                    </div>
                </div>
            </nav>

            <main className="max-w-[88rem] mx-auto px-6 py-12 relative z-10 w-full flex-1">
                {/* Stats skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="border-[#8B99B0]/10 bg-[#1B253B] backdrop-blur-xl overflow-hidden relative shadow-lg">
                            <CardContent className="pt-6 relative z-10">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-4">
                                        <div className="w-20 h-4 bg-[#222C4A] rounded animate-pulse" />
                                        <div className="w-12 h-10 bg-[#222C4A] rounded animate-pulse" />
                                    </div>
                                    <div className="w-12 h-12 bg-[#222C4A] rounded-2xl animate-pulse" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="bg-[#1B253B] border border-[#8B99B0]/10 rounded-2xl backdrop-blur-xl overflow-hidden">
                    <div className="p-6 border-b border-[#8B99B0]/10 flex items-center justify-between">
                        <div className="w-48 h-6 bg-[#222C4A] rounded animate-pulse" />
                        <div className="w-36 h-10 bg-[#222C4A] rounded-xl animate-pulse" />
                    </div>

                    {/* List skeleton */}
                    <div className="divide-y divide-[#8B99B0]/10 bg-transparent">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="p-5 flex items-center justify-between">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-40 h-5 bg-[#222C4A] rounded animate-pulse" />
                                        <div className="w-16 h-5 bg-[#222C4A] rounded-md animate-pulse" />
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="w-24 h-3 bg-[#222C4A] rounded animate-pulse" />
                                        <div className="w-24 h-3 bg-[#222C4A] rounded animate-pulse" />
                                        <div className="w-24 h-3 bg-[#222C4A] rounded animate-pulse" />
                                    </div>
                                </div>
                                <div className="w-10 h-10 bg-[#222C4A] rounded-xl animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
