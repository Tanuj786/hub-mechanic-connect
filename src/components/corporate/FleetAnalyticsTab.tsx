import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, Loader2 } from 'lucide-react';

interface Props {
  corporateId: string;
}

const COLORS = ['hsl(221, 83%, 53%)', 'hsl(25, 95%, 53%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)'];

const FleetAnalyticsTab = ({ corporateId }: Props) => {
  const [loading, setLoading] = useState(true);
  const [vehicleSpend, setVehicleSpend] = useState<any[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<any[]>([]);
  const [monthlySpend, setMonthlySpend] = useState<any[]>([]);

  useEffect(() => { fetchAnalytics(); }, [corporateId]);

  const fetchAnalytics = async () => {
    const { data: bulkReqs } = await supabase
      .from('bulk_service_requests')
      .select('*, service_requests(status, final_cost, created_at), fleet_vehicles(vehicle_name)')
      .eq('corporate_id', corporateId);

    if (!bulkReqs) { setLoading(false); return; }

    // Vehicle spend
    const spendMap: Record<string, number> = {};
    const statusMap: Record<string, number> = {};
    const monthMap: Record<string, number> = {};

    bulkReqs.forEach(r => {
      const vName = r.fleet_vehicles?.vehicle_name || 'Unknown';
      const cost = r.service_requests?.final_cost || 0;
      const status = r.service_requests?.status || 'pending';
      const month = r.service_requests?.created_at ? new Date(r.service_requests.created_at).toLocaleString('default', { month: 'short' }) : 'Unknown';

      spendMap[vName] = (spendMap[vName] || 0) + cost;
      statusMap[status] = (statusMap[status] || 0) + 1;
      monthMap[month] = (monthMap[month] || 0) + cost;
    });

    setVehicleSpend(Object.entries(spendMap).map(([name, value]) => ({ name, value })));
    setStatusBreakdown(Object.entries(statusMap).map(([name, value]) => ({ name, value })));
    setMonthlySpend(Object.entries(monthMap).map(([name, value]) => ({ name, value })));
    setLoading(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const hasData = vehicleSpend.length > 0 || statusBreakdown.length > 0;

  if (!hasData) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-12 text-center text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>No analytics data yet. Create service requests to see insights.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Monthly Spend */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Monthly Spend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlySpend}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v) => `₹${v}`} />
              <Tooltip formatter={(v: number) => [`₹${v}`, 'Spent']} />
              <Bar dataKey="value" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Request Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusBreakdown} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {statusBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cost per Vehicle */}
      <Card className="border-border/50 md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Cost per Vehicle</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={vehicleSpend} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" fontSize={12} tickFormatter={(v) => `₹${v}`} />
              <YAxis type="category" dataKey="name" fontSize={12} width={120} />
              <Tooltip formatter={(v: number) => [`₹${v}`, 'Total Cost']} />
              <Bar dataKey="value" fill="hsl(25, 95%, 53%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default FleetAnalyticsTab;
