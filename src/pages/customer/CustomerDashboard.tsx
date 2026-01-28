import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AnimatedCard, StaggerContainer, StaggerItem } from '@/components/ui/animated-card';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ChatWindow, ChatButton } from '@/components/chat/ChatWindow';
import { RazorpayPayment } from '@/components/payment/RazorpayPayment';
import { 
  LayoutDashboard, 
  Search, 
  Bell, 
  LogOut, 
  MapPin, 
  Car, 
  Bike, 
  Zap, 
  Battery, 
  CircleDot, 
  Settings,
  Navigation,
  Clock,
  CreditCard,
  MessageSquare,
  Star,
  FileText,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type VehicleType = 'car' | 'bike' | 'electric' | 'battery' | 'tyre' | 'general';

interface ServiceRequest {
  id: string;
  status: string;
  created_at: string;
  mechanic_id: string | null;
  service_type: {
    name: string;
  };
  mechanic?: {
    full_name: string;
    phone_number: string;
  };
}

interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  status: string;
  service_request_id: string;
}

const CustomerDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);
  const [serviceHistory, setServiceHistory] = useState<ServiceRequest[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatService, setChatService] = useState<ServiceRequest | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
      setupRealtimeSubscription();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const { data: historyData, error } = await supabase
        .from('service_requests')
        .select('id, status, created_at, mechanic_id, service_type:service_types(name), mechanic:profiles!mechanic_id(full_name, phone_number)')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (!error) {
        setServiceHistory(historyData || []);
      }

      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setNotifications(notifData || []);

      // Fetch pending invoices
      const { data: invoiceData } = await supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      setPendingInvoices(invoiceData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('customer-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_requests',
          filter: `customer_id=eq.${user?.id}`,
        },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`,
        },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
          filter: `customer_id=eq.${user?.id}`,
        },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          toast({
            title: 'Location Set',
            description: 'Your current location has been detected.',
          });
        },
        () => {
          toast({
            title: 'Location Error',
            description: 'Unable to get your location. Please enter manually.',
            variant: 'destructive',
          });
        }
      );
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const openPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPayment(true);
  };

  const openChat = (service: ServiceRequest) => {
    setChatService(service);
    setShowChat(true);
  };

  const vehicleTypes = [
    { type: 'car' as VehicleType, icon: Car, label: 'Car' },
    { type: 'bike' as VehicleType, icon: Bike, label: 'Bike' },
    { type: 'electric' as VehicleType, icon: Zap, label: 'Electric' },
    { type: 'battery' as VehicleType, icon: Battery, label: 'Battery' },
    { type: 'tyre' as VehicleType, icon: CircleDot, label: 'Tyre' },
    { type: 'general' as VehicleType, icon: Settings, label: 'General' },
  ];

  const getStatusCounts = () => {
    const counts = { active: 0, completed: 0, cancelled: 0 };
    serviceHistory.forEach((s) => {
      if (s.status === 'pending' || s.status === 'accepted' || s.status === 'in_progress') {
        counts.active++;
      } else if (s.status === 'completed') {
        counts.completed++;
      } else if (s.status === 'cancelled') {
        counts.cancelled++;
      }
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        className="w-64 bg-sidebar text-sidebar-foreground flex flex-col"
      >
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <CircleDot className="h-6 w-6 text-accent" />
            MechanicQ
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'find', icon: Search, label: 'Find Mechanic', action: () => navigate('/customer/find-mechanic') },
            { id: 'invoices', icon: CreditCard, label: 'Invoices', badge: pendingInvoices.length },
            { id: 'notifications', icon: Bell, label: 'Notifications', badge: notifications.filter(n => !n.is_read).length },
          ].map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => item.action ? item.action() : setActiveNav(item.id)}
              className={`nav-link w-full ${activeNav === item.id ? 'active' : ''}`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
              {item.badge ? (
                <Badge className="ml-auto gradient-accent">{item.badge}</Badge>
              ) : null}
            </motion.button>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <motion.button
            whileHover={{ x: 4 }}
            onClick={handleSignOut}
            className="nav-link w-full text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </motion.button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <AnimatePresence mode="wait">
          {activeNav === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <motion.h2 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-3xl font-bold"
                >
                  Welcome Back! 👋
                </motion.h2>
                <NotificationBell />
              </div>

              {/* Status Cards */}
              <StaggerContainer className="grid grid-cols-3 gap-4">
                {[
                  { icon: Clock, value: statusCounts.active, label: 'Active', gradient: 'gradient-primary', color: 'text-primary-foreground' },
                  { icon: CheckCircle, value: statusCounts.completed, label: 'Completed', gradient: 'gradient-success', color: 'text-success-foreground' },
                  { icon: XCircle, value: statusCounts.cancelled, label: 'Cancelled', gradient: 'bg-destructive/20', color: 'text-destructive', iconBg: false },
                ].map((stat, index) => (
                  <StaggerItem key={stat.label}>
                    <AnimatedCard delay={index * 0.1} glow className="p-6">
                      <div className="flex items-center gap-4">
                        <motion.div 
                          whileHover={{ rotate: 10 }}
                          className={`w-14 h-14 rounded-xl ${stat.gradient} flex items-center justify-center`}
                        >
                          <stat.icon className={`h-7 w-7 ${stat.color}`} />
                        </motion.div>
                        <div>
                          <p className="text-3xl font-bold">{stat.value}</p>
                          <p className="text-muted-foreground">{stat.label}</p>
                        </div>
                      </div>
                    </AnimatedCard>
                  </StaggerItem>
                ))}
              </StaggerContainer>

              {/* Pending Invoices Alert */}
              {pendingInvoices.length > 0 && (
                <AnimatedCard delay={0.3} className="p-6 border-l-4 border-l-accent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-accent-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold">You have {pendingInvoices.length} pending invoice{pendingInvoices.length > 1 ? 's' : ''}</h3>
                        <p className="text-sm text-muted-foreground">Click to view and pay</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setActiveNav('invoices')}
                      className="gradient-accent"
                    >
                      View Invoices
                    </Button>
                  </div>
                </AnimatedCard>
              )}

              {/* Location Section */}
              <AnimatedCard delay={0.4} className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Set Your Location
                </h3>
                <div className="space-y-4">
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button 
                      onClick={handleGetLocation}
                      className="w-full gradient-primary py-6 text-lg"
                    >
                      <Navigation className="mr-2 h-5 w-5" />
                      Use Current Location
                    </Button>
                  </motion.div>
                  <div className="text-center text-muted-foreground text-sm">or enter manually</div>
                  <Input
                    placeholder="Enter your address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="input-field"
                  />
                  {location && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Badge variant="secondary" className="w-full justify-center py-3 text-sm">
                        📍 Location set: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                      </Badge>
                    </motion.div>
                  )}
                </div>
              </AnimatedCard>

              {/* Vehicle Selection */}
              <AnimatedCard delay={0.5} className="p-6">
                <h3 className="font-semibold mb-4">Select Vehicle Type</h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  {vehicleTypes.map(({ type, icon: Icon, label }, index) => (
                    <motion.button
                      key={type}
                      whileHover={{ scale: 1.05, y: -4 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                      onClick={() => setSelectedVehicle(type)}
                      className={`stat-card text-center p-4 cursor-pointer transition-all ${
                        selectedVehicle === type ? 'ring-2 ring-primary shadow-glow' : ''
                      }`}
                    >
                      <Icon className={`h-8 w-8 mx-auto mb-2 ${selectedVehicle === type ? 'text-primary' : 'text-muted-foreground'}`} />
                      <p className="text-sm font-medium">{label}</p>
                    </motion.button>
                  ))}
                </div>
              </AnimatedCard>

              {/* Active Services */}
              {serviceHistory.filter(s => ['pending', 'accepted', 'in_progress'].includes(s.status)).length > 0 && (
                <AnimatedCard delay={0.6} hover={false} className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-warning" />
                    Active Services
                  </h3>
                  <div className="space-y-4">
                    {serviceHistory
                      .filter(s => ['pending', 'accepted', 'in_progress'].includes(s.status))
                      .map((service, index) => (
                        <motion.div
                          key={service.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-4 border border-primary/30 rounded-xl bg-primary/5"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold">{service.service_type?.name || 'Service'}</h4>
                              {service.mechanic && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Star className="h-3 w-3 text-warning" />
                                  {service.mechanic.full_name}
                                </p>
                              )}
                            </div>
                            <Badge className={`status-badge ${service.status}`}>
                              {service.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          {service.mechanic_id && (
                            <Button 
                              variant="outline"
                              onClick={() => openChat(service)}
                              className="w-full"
                            >
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Chat with Mechanic
                            </Button>
                          )}
                        </motion.div>
                      ))}
                  </div>
                </AnimatedCard>
              )}

              {/* Service History */}
              <AnimatedCard delay={0.7} hover={false} className="p-6">
                <h3 className="font-semibold mb-4">Service History</h3>
                {serviceHistory.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No service requests yet.</p>
                    <Button 
                      onClick={() => navigate('/customer/find-mechanic')}
                      className="mt-4 gradient-primary"
                    >
                      Find a Mechanic
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {serviceHistory.slice(0, 5).map((service, index) => (
                      <motion.div
                        key={service.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 + index * 0.05 }}
                        className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl hover:bg-secondary/70 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(service.status)}
                          <div>
                            <p className="font-medium">{service.service_type?.name || 'Service'}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(service.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge className={`status-badge ${service.status}`}>
                          {service.status}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatedCard>
            </motion.div>
          )}

          {activeNav === 'invoices' && (
            <motion.div
              key="invoices"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold">Invoices</h2>
              
              {/* Pending Invoices */}
              {pendingInvoices.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-warning" />
                    Pending Payment
                  </h3>
                  {pendingInvoices.map((invoice, index) => (
                    <AnimatedCard 
                      key={invoice.id} 
                      delay={index * 0.1}
                      className="p-6"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center">
                            <FileText className="h-6 w-6 text-accent-foreground" />
                          </div>
                          <div>
                            <p className="font-semibold">{invoice.invoice_number}</p>
                            <p className="text-2xl font-bold text-primary">₹{invoice.total_amount.toFixed(2)}</p>
                          </div>
                        </div>
                        <Button 
                          onClick={() => openPayment(invoice)}
                          className="gradient-accent text-lg px-8"
                        >
                          <CreditCard className="mr-2 h-5 w-5" />
                          Pay Now
                        </Button>
                      </div>
                    </AnimatedCard>
                  ))}
                </div>
              )}

              {pendingInvoices.length === 0 && (
                <AnimatedCard className="p-12 text-center">
                  <CheckCircle className="h-16 w-16 mx-auto text-success mb-4" />
                  <h3 className="text-xl font-semibold mb-2">All Paid Up!</h3>
                  <p className="text-muted-foreground">You have no pending invoices.</p>
                </AnimatedCard>
              )}
            </motion.div>
          )}

          {activeNav === 'notifications' && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold">Notifications</h2>
              {notifications.length === 0 ? (
                <AnimatedCard className="p-12 text-center">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No notifications yet</p>
                </AnimatedCard>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification, index) => (
                    <AnimatedCard 
                      key={notification.id} 
                      delay={index * 0.05}
                      className={`p-4 ${!notification.is_read ? 'border-l-4 border-l-primary' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{notification.title}</h4>
                          <p className="text-muted-foreground">{notification.message}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </AnimatedCard>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <RazorpayPayment
              invoiceId={selectedInvoice.id}
              onPaymentSuccess={() => {
                setShowPayment(false);
                setSelectedInvoice(null);
                fetchData();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Chat Window */}
      {chatService && (
        <ChatWindow
          serviceRequestId={chatService.id}
          otherPartyName={chatService.mechanic?.full_name || 'Mechanic'}
          isOpen={showChat}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
};

export default CustomerDashboard;