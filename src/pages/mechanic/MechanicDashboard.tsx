import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AnimatedCard, StaggerContainer, StaggerItem } from '@/components/ui/animated-card';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ChatWindow, ChatButton } from '@/components/chat/ChatWindow';
import { WorkMediaUpload } from '@/components/media/WorkMediaUpload';
import { InvoiceGenerator } from '@/components/invoice/InvoiceGenerator';
import { 
  LayoutDashboard, 
  Bell, 
  User,
  Settings,
  LogOut, 
  DollarSign, 
  Briefcase, 
  Star,
  Clock,
  Award,
  Zap,
  MessageSquare,
  Check,
  Loader2,
  MapPin,
  Camera,
  FileText,
  Phone,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ShopData {
  id: string;
  shop_name: string;
  shop_description: string;
  shop_address: string;
  whatsapp_number: string;
  hourly_rate: number;
  years_of_experience: number;
  is_online: boolean;
  total_earnings: number;
  jobs_completed: number;
  average_rating: number;
  total_reviews: number;
  response_rate: number;
}

interface ServiceRequest {
  id: string;
  status: string;
  created_at: string;
  customer_address: string;
  description: string;
  customer_id: string;
  customer: {
    full_name: string;
    phone_number: string;
  };
  service_type: {
    name: string;
  };
}

const MechanicDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<ShopData | null>(null);
  const [pendingRequests, setPendingRequests] = useState<ServiceRequest[]>([]);
  const [activeJobs, setActiveJobs] = useState<ServiceRequest[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    push_notifications: true,
    location_sharing: true,
    dark_mode: false,
  });
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone_number: '',
  });
  
  // Modal states
  const [selectedJob, setSelectedJob] = useState<ServiceRequest | null>(null);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatJob, setChatJob] = useState<ServiceRequest | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
      setupRealtimeSubscription();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      const { data: shopData } = await supabase
        .from('mechanic_shops')
        .select('*')
        .eq('mechanic_id', user.id)
        .maybeSingle();
      
      setShop(shopData);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profileData) {
        setProfile({
          full_name: profileData.full_name || '',
          email: profileData.email || '',
          phone_number: profileData.phone_number || '',
        });
      }

      const { data: pendingData } = await supabase
        .from('service_requests')
        .select(`
          *,
          customer:profiles!customer_id(full_name, phone_number),
          service_type:service_types(name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      setPendingRequests(pendingData || []);

      const { data: activeData } = await supabase
        .from('service_requests')
        .select(`
          *,
          customer:profiles!customer_id(full_name, phone_number),
          service_type:service_types(name)
        `)
        .eq('mechanic_id', user.id)
        .in('status', ['accepted', 'in_progress'])
        .order('created_at', { ascending: false });
      
      setActiveJobs(activeData || []);

      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      setNotifications(notifData || []);

      const { data: settingsData } = await supabase
        .from('mechanic_settings')
        .select('*')
        .eq('mechanic_id', user.id)
        .maybeSingle();
      
      if (settingsData) {
        setSettings({
          push_notifications: settingsData.push_notifications ?? true,
          location_sharing: settingsData.location_sharing ?? true,
          dark_mode: settingsData.dark_mode ?? false,
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('mechanic-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_requests',
        },
        () => {
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const toggleOnlineStatus = async () => {
    if (!shop) return;

    const newStatus = !shop.is_online;
    const { error } = await supabase
      .from('mechanic_shops')
      .update({ is_online: newStatus })
      .eq('id', shop.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    } else {
      setShop({ ...shop, is_online: newStatus });
      toast({
        title: newStatus ? 'You are now Online!' : 'You are now Offline',
        description: newStatus ? 'You will receive service requests' : 'You won\'t receive new requests',
      });
    }
  };

  const acceptJob = async (requestId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('service_requests')
      .update({ 
        mechanic_id: user.id, 
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to accept job',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Job Accepted!',
        description: 'The customer has been notified.',
      });
      fetchData();
    }
  };

  const openJobWorkflow = (job: ServiceRequest) => {
    setSelectedJob(job);
    setShowMediaUpload(true);
  };

  const proceedToInvoice = () => {
    setShowMediaUpload(false);
    setShowInvoice(true);
  };

  const completeJobWithInvoice = async (invoiceId: string) => {
    if (!selectedJob) return;

    const { error } = await supabase
      .from('service_requests')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', selectedJob.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete job',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Job Completed!',
        description: 'Invoice has been sent to the customer.',
      });
      setShowInvoice(false);
      setSelectedJob(null);
      fetchData();
    }
  };

  const openChat = (job: ServiceRequest) => {
    setChatJob(job);
    setShowChat(true);
  };

  const updateSettings = async (key: string, value: boolean) => {
    if (!user) return;

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    await supabase
      .from('mechanic_settings')
      .update({ [key]: value, updated_at: new Date().toISOString() })
      .eq('mechanic_id', user.id);
  };

  const saveProfile = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        phone_number: profile.phone_number,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to save profile',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Profile Saved',
        description: 'Your profile has been updated.',
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-12 w-12 text-primary" />
        </motion.div>
      </div>
    );
  }

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
            <Star className="h-6 w-6 text-accent" />
            MechanicQ Pro
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'notifications', icon: Bell, label: 'Notifications', badge: notifications.filter(n => !n.is_read).length },
            { id: 'profile', icon: User, label: 'Profile' },
            { id: 'settings', icon: Settings, label: 'Settings' },
          ].map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveNav(item.id)}
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
              {/* Header with Online Toggle */}
              <div className="flex items-center justify-between">
                <motion.h2 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-3xl font-bold"
                >
                  Dashboard
                </motion.h2>
                <div className="flex items-center gap-4">
                  <NotificationBell />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 bg-card rounded-full px-4 py-2 border border-border"
                  >
                    <span className={`w-2 h-2 rounded-full ${shop?.is_online ? 'bg-success animate-pulse' : 'bg-muted'}`} />
                    <span className="text-sm font-medium">
                      {shop?.is_online ? 'Online' : 'Offline'}
                    </span>
                    <Switch 
                      checked={shop?.is_online || false} 
                      onCheckedChange={toggleOnlineStatus}
                      className="data-[state=checked]:bg-success"
                    />
                  </motion.div>
                </div>
              </div>

              {/* Stats Cards */}
              <StaggerContainer className="grid grid-cols-4 gap-4">
                {[
                  { icon: DollarSign, value: `₹${shop?.total_earnings || 0}`, label: 'Total Earnings', gradient: 'gradient-success', color: 'text-success-foreground' },
                  { icon: Briefcase, value: shop?.jobs_completed || 0, label: 'Jobs Completed', gradient: 'gradient-primary', color: 'text-primary-foreground' },
                  { icon: Star, value: shop?.average_rating?.toFixed(1) || '0.0', sublabel: `${shop?.total_reviews || 0} Reviews`, gradient: 'gradient-accent', color: 'text-accent-foreground' },
                  { icon: Clock, value: `${shop?.response_rate || 0}%`, label: 'Response Rate', gradient: 'bg-warning/20', color: 'text-warning', iconBg: false },
                ].map((stat, index) => (
                  <StaggerItem key={stat.label || stat.sublabel}>
                    <AnimatedCard delay={index * 0.1} glow className="p-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full ${stat.gradient} flex items-center justify-center`}>
                          <stat.icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{stat.value}</p>
                          <p className="text-muted-foreground text-sm">{stat.label || stat.sublabel}</p>
                        </div>
                      </div>
                    </AnimatedCard>
                  </StaggerItem>
                ))}
              </StaggerContainer>

              {/* Performance & Quick Status */}
              <div className="grid grid-cols-2 gap-6">
                <AnimatedCard delay={0.3} className="p-6">
                  <h3 className="font-semibold mb-4">Performance</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Customer Satisfaction</span>
                      <motion.span 
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        className="font-semibold text-success"
                      >
                        {((shop?.average_rating || 0) / 5 * 100).toFixed(0)}%
                      </motion.span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(shop?.average_rating || 0) / 5 * 100}%` }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="h-full gradient-success rounded-full"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Response Rate</span>
                      <span className="font-semibold text-primary">{shop?.response_rate || 0}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${shop?.response_rate || 0}%` }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        className="h-full gradient-primary rounded-full"
                      />
                    </div>
                  </div>
                </AnimatedCard>

                <AnimatedCard delay={0.4} className="p-6">
                  <h3 className="font-semibold mb-4">Quick Status</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="text-center p-4 bg-warning/10 rounded-xl cursor-pointer"
                    >
                      <p className="text-3xl font-bold text-warning">{pendingRequests.length}</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </motion.div>
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="text-center p-4 bg-primary/10 rounded-xl cursor-pointer"
                    >
                      <p className="text-3xl font-bold text-primary">{activeJobs.length}</p>
                      <p className="text-xs text-muted-foreground">Active</p>
                    </motion.div>
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="text-center p-4 bg-success/10 rounded-xl cursor-pointer"
                    >
                      <p className="text-3xl font-bold text-success">{shop?.jobs_completed || 0}</p>
                      <p className="text-xs text-muted-foreground">Done</p>
                    </motion.div>
                  </div>
                </AnimatedCard>
              </div>

              {/* Pending Requests */}
              {pendingRequests.length > 0 && (
                <AnimatedCard delay={0.5} hover={false} className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Bell className="h-5 w-5 text-warning" />
                    New Service Requests
                  </h3>
                  <div className="space-y-4">
                    {pendingRequests.map((request, index) => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 border border-warning/30 rounded-xl bg-warning/5 hover:bg-warning/10 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">{request.service_type?.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {request.customer?.full_name}
                            </p>
                          </div>
                          <Badge className="status-badge pending">Pending</Badge>
                        </div>
                        <p className="text-sm mb-3 flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {request.customer_address}
                        </p>
                        <Button 
                          onClick={() => acceptJob(request.id)}
                          className="w-full gradient-success"
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Accept Job
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </AnimatedCard>
              )}

              {/* Active Jobs */}
              {activeJobs.length > 0 && (
                <AnimatedCard delay={0.6} hover={false} className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Active Jobs
                  </h3>
                  <div className="space-y-4">
                    {activeJobs.map((job, index) => (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 border border-primary/30 rounded-xl bg-primary/5"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">{job.service_type?.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {job.customer?.full_name}
                            </p>
                          </div>
                          <Badge className="status-badge active">{job.status}</Badge>
                        </div>
                        <p className="text-sm mb-3 flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {job.customer_address}
                        </p>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline"
                            onClick={() => openChat(job)}
                            className="flex-1"
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Chat
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => window.open(`tel:${job.customer?.phone_number}`)}
                            className="flex-1"
                          >
                            <Phone className="mr-2 h-4 w-4" />
                            Call
                          </Button>
                          <Button 
                            onClick={() => openJobWorkflow(job)}
                            className="flex-1 gradient-primary"
                          >
                            <Camera className="mr-2 h-4 w-4" />
                            Complete
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
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

          {activeNav === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 max-w-md"
            >
              <h2 className="text-3xl font-bold">Profile</h2>
              <AnimatedCard className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profile.email}
                    disabled
                    className="input-field"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile.phone_number}
                    onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                    className="input-field"
                  />
                </div>
                <Button onClick={saveProfile} className="w-full gradient-primary">
                  Save Changes
                </Button>
              </AnimatedCard>
            </motion.div>
          )}

          {activeNav === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 max-w-md"
            >
              <h2 className="text-3xl font-bold">Settings</h2>
              <AnimatedCard className="p-6 space-y-6">
                {[
                  { key: 'push_notifications', label: 'Push Notifications', desc: 'Receive alerts for new requests' },
                  { key: 'location_sharing', label: 'Location Sharing', desc: 'Share location with customers' },
                  { key: 'dark_mode', label: 'Dark Mode', desc: 'Use dark theme' },
                ].map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{setting.label}</p>
                      <p className="text-sm text-muted-foreground">{setting.desc}</p>
                    </div>
                    <Switch 
                      checked={settings[setting.key as keyof typeof settings]}
                      onCheckedChange={(value) => updateSettings(setting.key, value)}
                    />
                  </div>
                ))}
              </AnimatedCard>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Work Media Upload Dialog */}
      <Dialog open={showMediaUpload} onOpenChange={setShowMediaUpload}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Work Photos/Videos</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              <WorkMediaUpload serviceRequestId={selectedJob.id} />
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setShowMediaUpload(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={proceedToInvoice} className="flex-1 gradient-accent">
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Invoice
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Invoice Generation Dialog */}
      <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Invoice</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <InvoiceGenerator
              serviceRequestId={selectedJob.id}
              customerId={selectedJob.customer_id}
              customerName={selectedJob.customer?.full_name || 'Customer'}
              onInvoiceCreated={completeJobWithInvoice}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Chat Window */}
      {chatJob && (
        <ChatWindow
          serviceRequestId={chatJob.id}
          otherPartyName={chatJob.customer?.full_name || 'Customer'}
          isOpen={showChat}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
};

export default MechanicDashboard;