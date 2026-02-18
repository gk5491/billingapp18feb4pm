import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Package, CheckCircle, XCircle, FileText, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CustomerSalesOrdersPage() {
    const { token } = useAuthStore();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: ordersResponse, isLoading } = useQuery<any>({
        queryKey: ["/api/flow/my-sales-orders"],
    });

    const orders = ordersResponse?.data || [];

    const actionMutation = useMutation({
        mutationFn: async ({ id, action }: { id: string, action: 'approve' | 'reject' }) => {
            const res = await fetch(`/api/flow/sales-orders/${id}/action`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ action })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || `Failed to ${action} sales order`);
            return result;
        },
        onSuccess: (_, variables) => {
            toast({ title: "Success", description: `Sales order ${variables.action}d successfully` });
            queryClient.invalidateQueries({ queryKey: ["/api/flow/my-sales-orders"] });
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });

    const getStatusBadge = (status: string) => {
        const s = status.toLowerCase();
        if (s === 'approved') return <Badge className="bg-green-100 text-green-700">Approved</Badge>;
        if (s === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
        if (s === 'sent') return <Badge className="bg-blue-100 text-blue-700">Received</Badge>;
        return <Badge variant="secondary">{status}</Badge>;
    };

    if (isLoading) return <div className="p-8 text-center">Loading your sales orders...</div>;

    return (
        <div className="container mx-auto py-10 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">My Sales Orders</h1>
                <p className="text-slate-500">Review and approve orders from the administration</p>
            </div>

            {orders.length === 0 ? (
                <Card className="border-dashed bg-slate-50/50">
                    <CardContent className="py-20 text-center">
                        <Package className="h-16 w-16 mx-auto text-slate-200 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900">No sales orders found</h3>
                        <p className="text-slate-500 max-w-xs mx-auto mt-2">You don't have any sales orders to review at this time.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {orders.map((order: any) => (
                        <Card key={order.id} className="overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl">{order.salesOrderNumber}</CardTitle>
                                    <CardDescription>Date: {new Date(order.date).toLocaleDateString()}</CardDescription>
                                </div>
                                <div className="flex items-center gap-3">
                                    {getStatusBadge(order.orderStatus)}
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Order Items</h4>
                                        <div className="space-y-3">
                                            {order.items.map((item: any, idx: number) => (
                                                <div key={idx} className="flex justify-between items-center text-sm">
                                                    <span>{item.name} x {item.quantity} {item.unit}</span>
                                                    <span className="font-semibold">₹{item.amount.toLocaleString('en-IN')}</span>
                                                </div>
                                            ))}
                                            <div className="pt-3 border-t flex justify-between items-center font-bold text-lg">
                                                <span>Total</span>
                                                <span className="text-blue-600">₹{order.total.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-3 min-w-[200px]">
                                        <Button variant="outline" className="w-full gap-2">
                                            <FileText className="h-4 w-4" /> View Details
                                        </Button>
                                        <Button variant="outline" className="w-full gap-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                                            <Download className="h-4 w-4" /> Download PDF
                                        </Button>
                                        {order.orderStatus === 'Sent' && (
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                <Button 
                                                    onClick={() => actionMutation.mutate({ id: order.id, action: 'approve' })}
                                                    disabled={actionMutation.isPending}
                                                    className="bg-green-600 hover:bg-green-700 gap-1"
                                                >
                                                    <CheckCircle className="h-4 w-4" /> Approve
                                                </Button>
                                                <Button 
                                                    onClick={() => actionMutation.mutate({ id: order.id, action: 'reject' })}
                                                    disabled={actionMutation.isPending}
                                                    variant="destructive" 
                                                    className="gap-1"
                                                >
                                                    <XCircle className="h-4 w-4" /> Reject
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
