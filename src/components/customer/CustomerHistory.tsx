import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatedCard, StaggerContainer, StaggerItem } from '@/components/ui/animated-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  IndianRupee,
  Star,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Wrench,
  Download,
  History,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceHistory {
  id: string;
  status: string;
  vehicle_type: string;
  customer_address: string;
  description: string | null;
  final_cost: number | null;
  created_at: string;
  completed_at: string | null;
  service_type: {
    name: string;
  };
  mechanic: {
    full_name: string;
  } | null;
  rating: {
    rating: number;
    review: string | null;
  } | null;
}

interface PaymentHistory {
  id: string;
  invoice_number: string;
  total_amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
  mechanic: {
    full_name: string;
  };
  service_request: {
    service_type: {
      name: string;
    };
  };
}

export const CustomerHistory = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState<ServiceHistory[]>([]);
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;

    try {
      // Fetch service history
      const { data: serviceData, error: serviceError } = await supabase
        .from('service_requests')
        .select(`
          id,
          status,
          vehicle_type,
          customer_address,
          description,
          final_cost,
          created_at,
          completed_at,
          service_type:service_types(name),
          mechanic:profiles!mechanic_id(full_name)
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (serviceError) throw serviceError;

      // Fetch ratings for each service
      const servicesWithRatings = await Promise.all(
        (serviceData || []).map(async (service: any) => {
          const { data: ratingData } = await supabase
            .from('ratings')
            .select('rating, review')
            .eq('service_request_id', service.id)
            .maybeSingle();

          return { ...service, rating: ratingData };
        })
      );

      setServices(servicesWithRatings);

      // Fetch payment history
      const { data: paymentData, error: paymentError } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          total_amount,
          status,
          paid_at,
          created_at,
          mechanic:profiles!mechanic_id(full_name),
          service_request:service_requests!service_request_id(
            service_type:service_types(name)
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (paymentError) throw paymentError;
      setPayments(paymentData as any || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success';
      case 'paid':
        return 'bg-success/10 text-success';
      case 'in_progress':
        return 'bg-warning/10 text-warning';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <AnimatedCard className="p-12 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"
        />
      </AnimatedCard>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Services ({services.length})
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payments ({payments.filter(p => p.status === 'paid').length})
          </TabsTrigger>
        </TabsList>

        {/* Services History */}
        <TabsContent value="services" className="mt-6">
          {services.length === 0 ? (
            <AnimatedCard className="p-12 text-center">
              <History className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Service History</h3>
              <p className="text-muted-foreground">
                Your completed services will appear here.
              </p>
            </AnimatedCard>
          ) : (
            <StaggerContainer className="space-y-4">
              {services.map((service, index) => (
                <StaggerItem key={service.id}>
                  <AnimatedCard delay={index * 0.05} className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{service.service_type?.name}</h3>
                          <Badge className={cn('text-xs', getStatusColor(service.status))}>
                            {getStatusIcon(service.status)}
                            <span className="ml-1 capitalize">{service.status.replace('_', ' ')}</span>
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <p className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(service.created_at)}
                          </p>
                          {service.mechanic && (
                            <p className="flex items-center gap-1">
                              <Wrench className="h-3 w-3" />
                              {service.mechanic.full_name}
                            </p>
                          )}
                        </div>

                        {service.description && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {service.description}
                          </p>
                        )}

                        {service.rating && (
                          <div className="mt-3 flex items-center gap-2">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={cn(
                                    'h-4 w-4',
                                    star <= service.rating!.rating
                                      ? 'text-warning fill-warning'
                                      : 'text-muted-foreground/30'
                                  )}
                                />
                              ))}
                            </div>
                            {service.rating.review && (
                              <span className="text-xs text-muted-foreground">
                                "{service.rating.review.slice(0, 50)}..."
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-right ml-4">
                        {service.final_cost && (
                          <p className="text-xl font-bold text-primary flex items-center justify-end">
                            <IndianRupee className="h-4 w-4" />
                            {service.final_cost.toFixed(0)}
                          </p>
                        )}
                        <Badge variant="outline" className="mt-1 text-xs capitalize">
                          {service.vehicle_type}
                        </Badge>
                      </div>
                    </div>
                  </AnimatedCard>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </TabsContent>

        {/* Payments History */}
        <TabsContent value="payments" className="mt-6">
          {payments.length === 0 ? (
            <AnimatedCard className="p-12 text-center">
              <CreditCard className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Payment History</h3>
              <p className="text-muted-foreground">
                Your payment records will appear here.
              </p>
            </AnimatedCard>
          ) : (
            <StaggerContainer className="space-y-4">
              {payments.map((payment, index) => (
                <StaggerItem key={payment.id}>
                  <AnimatedCard delay={index * 0.05} className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold">{payment.invoice_number}</h3>
                          <Badge className={cn('text-xs', getStatusColor(payment.status))}>
                            {payment.status === 'paid' ? (
                              <><CheckCircle className="h-3 w-3 mr-1" /> Paid</>
                            ) : (
                              'Pending'
                            )}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <p className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {payment.paid_at ? formatDate(payment.paid_at) : formatDate(payment.created_at)}
                          </p>
                          <p className="flex items-center gap-1">
                            <Wrench className="h-3 w-3" />
                            {payment.mechanic?.full_name}
                          </p>
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {payment.service_request?.service_type?.name}
                        </p>
                      </div>

                      <div className="text-right ml-4">
                        <p className="text-xl font-bold text-success flex items-center justify-end">
                          <IndianRupee className="h-4 w-4" />
                          {payment.total_amount.toFixed(0)}
                        </p>
                        {payment.status === 'paid' && (
                          <Button variant="ghost" size="sm" className="mt-2 text-xs">
                            <Download className="h-3 w-3 mr-1" />
                            Receipt
                          </Button>
                        )}
                      </div>
                    </div>
                  </AnimatedCard>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </TabsContent>
      </Tabs>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <AnimatedCard className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{services.length}</p>
          <p className="text-sm text-muted-foreground">Total Services</p>
        </AnimatedCard>
        <AnimatedCard delay={0.1} className="p-4 text-center">
          <p className="text-2xl font-bold text-success">
            {payments.filter(p => p.status === 'paid').length}
          </p>
          <p className="text-sm text-muted-foreground">Payments Made</p>
        </AnimatedCard>
        <AnimatedCard delay={0.2} className="p-4 text-center">
          <p className="text-2xl font-bold text-warning flex items-center justify-center">
            <IndianRupee className="h-5 w-5" />
            {payments
              .filter(p => p.status === 'paid')
              .reduce((sum, p) => sum + p.total_amount, 0)
              .toFixed(0)}
          </p>
          <p className="text-sm text-muted-foreground">Total Spent</p>
        </AnimatedCard>
      </div>
    </div>
  );
};
