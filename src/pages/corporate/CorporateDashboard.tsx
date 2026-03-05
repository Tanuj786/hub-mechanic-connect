import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Building2, Truck, Plus, LogOut, BarChart3, ClipboardList, IndianRupee, TrendingUp } from 'lucide-react';
import FleetVehiclesTab from '@/components/corporate/FleetVehiclesTab';
import BulkRequestsTab from '@/components/corporate/BulkRequestsTab';
import FleetAnalyticsTab from '@/components/corporate/FleetAnalyticsTab';

const CorporateDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [corporateAccount, setCorporateAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ vehicles: 0, activeRequests: 0, totalSpent: 0, completedJobs: 0 });

  useEffect(() => {
    if (user) fetchCorporateData();
  }, [user]);

  const fetchCorporateData = async () => {
    if (!user) return;

    const { data: account } = await supabase
      .from('corporate_accounts')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!account) {
      navigate('/corporate/signup');
      return;
    }

    setCorporateAccount(account);

    // Fetch fleet stats
    const { count: vehicleCount } = await supabase
      .from('fleet_vehicles')
      .select('*', { count: 'exact', head: true })
      .eq('corporate_id', account.id);

    const { data: bulkRequests } = await supabase
      .from('bulk_service_requests')
      .select('service_request_id')
      .eq('corporate_id', account.id);

    let activeCount = 0;
    let completedCount = 0;
    let totalSpent = 0;

    if (bulkRequests && bulkRequests.length > 0) {
      const requestIds = bulkRequests.map(br => br.service_request_id);
      const { data: requests } = await supabase
        .from('service_requests')
        .select('status, final_cost')
        .in('id', requestIds);

      if (requests) {
        activeCount = requests.filter(r => r.status && !['completed', 'cancelled'].includes(r.status)).length;
        completedCount = requests.filter(r => r.status === 'completed').length;
        totalSpent = requests.reduce((sum, r) => sum + (r.final_cost || 0), 0);
      }
    }

    setStats({
      vehicles: vehicleCount || 0,
      activeRequests: activeCount,
      totalSpent,
      completedJobs: completedCount,
    });
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-hero text-primary-foreground py-6">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{corporateAccount?.company_name}</h1>
              <p className="text-sm text-primary-foreground/70">Fleet Management Dashboard</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleSignOut} className="text-primary-foreground hover:bg-primary-foreground/10">
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Fleet Vehicles', value: stats.vehicles, icon: Truck, color: 'text-primary' },
            { label: 'Active Requests', value: stats.activeRequests, icon: ClipboardList, color: 'text-accent' },
            { label: 'Total Spent', value: `₹${stats.totalSpent.toLocaleString()}`, icon: IndianRupee, color: 'text-destructive' },
            { label: 'Completed Jobs', value: stats.completedJobs, icon: TrendingUp, color: 'text-success' },
          ].map((stat) => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color} opacity-70`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="vehicles" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="vehicles" className="flex items-center gap-2">
              <Truck className="h-4 w-4" /> Fleet Vehicles
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> Bulk Requests
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vehicles">
            <FleetVehiclesTab corporateId={corporateAccount?.id} onUpdate={fetchCorporateData} />
          </TabsContent>
          <TabsContent value="requests">
            <BulkRequestsTab corporateId={corporateAccount?.id} onUpdate={fetchCorporateData} />
          </TabsContent>
          <TabsContent value="analytics">
            <FleetAnalyticsTab corporateId={corporateAccount?.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CorporateDashboard;
