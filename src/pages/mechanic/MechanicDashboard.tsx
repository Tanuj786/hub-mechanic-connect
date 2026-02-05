import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AnimatedCard, StaggerContainer, StaggerItem } from '@/components/ui/animated-card';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ServiceRequestCard, JobStatus } from '@/components/jobs/ServiceRequestCard';
import { JobCompletionModal } from '@/components/jobs/JobCompletionModal';
import { IncomingRequestAlert } from '@/components/service-request/IncomingRequestAlert';
import { MechanicReviewsList } from '@/components/reviews/MechanicReviewsList';
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
  Loader2,
  TrendingUp,
  Target,
  Trophy,
  Volume2,
  VolumeX,
  MessageSquare,
  Camera,
  Upload
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

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
  vehicle_type: string;
  estimated_cost: number | null;
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
    avatar_url: '',
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Modal states
  const [selectedJob, setSelectedJob] = useState<ServiceRequest | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatJob, setChatJob] = useState<ServiceRequest | null>(null);
  
  // Incoming request alert
  const [incomingRequest, setIncomingRequest] = useState<ServiceRequest | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Loading states
  const [acceptingJobId, setAcceptingJobId] = useState<string | null>(null);
  const [startingJobId, setStartingJobId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      const [shopRes, profileRes, pendingRes, activeRes, notifRes, settingsRes] = await Promise.all([
        supabase.from('mechanic_shops').select('*').eq('mechanic_id', user.id).maybeSingle(),
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('service_requests')
          .select(`*, customer:profiles!customer_id(full_name, phone_number), service_type:service_types(name)`)
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
        supabase.from('service_requests')
          .select(`*, customer:profiles!customer_id(full_name, phone_number), service_type:service_types(name)`)
          .eq('mechanic_id', user.id)
          .in('status', ['accepted', 'in_progress'])
          .order('created_at', { ascending: false }),
        supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('mechanic_settings').select('*').eq('mechanic_id', user.id).maybeSingle(),
      ]);

      setShop(shopRes.data);
      if (profileRes.data) {
        setProfile({
          full_name: profileRes.data.full_name || '',
          email: profileRes.data.email || '',
          phone_number: profileRes.data.phone_number || '',
          avatar_url: profileRes.data.avatar_url || '',
        });
      }
      setPendingRequests(pendingRes.data || []);
      setActiveJobs(activeRes.data || []);
      setNotifications(notifRes.data || []);
      if (settingsRes.data) {
        setSettings({
          push_notifications: settingsRes.data.push_notifications ?? true,
          location_sharing: settingsRes.data.location_sharing ?? true,
          dark_mode: settingsRes.data.dark_mode ?? false,
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, (payload) => {
        // Check for new pending requests
        if (payload.eventType === 'INSERT' && payload.new.status === 'pending' && shop?.is_online) {
          // Show incoming request alert
          setIncomingRequest(payload.new as ServiceRequest);
        }
        fetchData();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user?.id}` }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  };

  const handleAcceptIncoming = async (requestId: string) => {
    await acceptJob(requestId);
    setIncomingRequest(null);
  };

  const handleRejectIncoming = async (requestId: string) => {
    setIncomingRequest(null);
    // Optionally notify that this mechanic declined
  };
  const toggleOnlineStatus = async () => {
    if (!shop) return;
    const newStatus = !shop.is_online;
    const { error } = await supabase.from('mechanic_shops').update({ is_online: newStatus }).eq('id', shop.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    } else {
      setShop({ ...shop, is_online: newStatus });
      toast({ title: newStatus ? 'You are now Online!' : 'You are now Offline', description: newStatus ? 'You will receive service requests' : 'You won\'t receive new requests' });
    }
  };

  const acceptJob = async (requestId: string) => {
    if (!user) return;
    setAcceptingJobId(requestId);

    const { error } = await supabase.from('service_requests').update({ 
      mechanic_id: user.id, 
      status: 'accepted',
      accepted_at: new Date().toISOString()
    }).eq('id', requestId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to accept job', variant: 'destructive' });
    } else {
      toast({ title: 'Job Accepted!', description: 'The customer has been notified.' });
      // Send notification to customer
      const request = pendingRequests.find(r => r.id === requestId);
      if (request) {
        await supabase.from('notifications').insert({
          user_id: request.customer_id,
          title: 'Job Accepted',
          message: 'A mechanic has accepted your service request and will contact you shortly.',
          type: 'job_update',
          related_request_id: requestId,
        });
      }
      fetchData();
    }
    setAcceptingJobId(null);
  };

  const startJob = async (requestId: string) => {
    if (!user) return;
    setStartingJobId(requestId);

    const { error } = await supabase.from('service_requests').update({ 
      status: 'in_progress'
    }).eq('id', requestId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to start job', variant: 'destructive' });
    } else {
      toast({ title: 'Job Started!', description: 'Work is now in progress.' });
      const job = activeJobs.find(j => j.id === requestId);
      if (job) {
        await supabase.from('notifications').insert({
          user_id: job.customer_id,
          title: 'Job Started',
          message: 'The mechanic has started working on your vehicle.',
          type: 'job_update',
          related_request_id: requestId,
        });
      }
      fetchData();
    }
    setStartingJobId(null);
  };

  const openCompletionModal = (job: ServiceRequest) => {
    setSelectedJob(job);
    setShowCompletionModal(true);
  };

  const completeJobWithInvoice = async (invoiceId: string) => {
    if (!selectedJob) return;

    const { error } = await supabase.from('service_requests').update({ 
      status: 'completed',
      completed_at: new Date().toISOString()
    }).eq('id', selectedJob.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to complete job', variant: 'destructive' });
    } else {
      toast({ title: 'Job Completed!', description: 'Invoice has been sent to the customer.' });
      await supabase.from('notifications').insert({
        user_id: selectedJob.customer_id,
        title: 'Job Completed',
        message: 'Your service has been completed. Please review and pay the invoice.',
        type: 'job_update',
        related_request_id: selectedJob.id,
      });
      setShowCompletionModal(false);
      setSelectedJob(null);
      fetchData();
    }
  };

  const openChat = (job: ServiceRequest) => {
    setChatJob(job);
    setShowChat(true);
  };

  const declineJob = async (requestId: string) => {
    if (!user) return;
    
    // Get the request details before removing
    const request = pendingRequests.find(r => r.id === requestId);
    
    // Update the request status to cancelled
    const { error } = await supabase.from('service_requests').update({
      status: 'cancelled',
      mechanic_id: user.id,
      updated_at: new Date().toISOString()
    }).eq('id', requestId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to decline request', variant: 'destructive' });
      return;
    }

    // Notify the customer
    if (request) {
      await supabase.from('notifications').insert({
        user_id: request.customer_id,
        title: 'Request Declined',
        message: 'Unfortunately, the mechanic could not accept your request. Please try requesting another mechanic.',
        type: 'job_update',
        related_request_id: requestId,
      });
    }

    // Remove from local state
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    toast({
      title: 'Request Declined',
      description: 'The customer has been notified.'
    });
  };

  const updateSettings = async (key: string, value: boolean) => {
    if (!user) return;
    setSettings(prev => ({ ...prev, [key]: value }));
    await supabase.from('mechanic_settings').update({ [key]: value, updated_at: new Date().toISOString() }).eq('mechanic_id', user.id);
  };

  const saveProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from('profiles').update({
      full_name: profile.full_name,
      phone_number: profile.phone_number,
      avatar_url: profile.avatar_url,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);

    toast(error ? { title: 'Error', description: 'Failed to save profile', variant: 'destructive' } : { title: 'Profile Saved', description: 'Your profile has been updated.' });
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files || event.target.files.length === 0) return;
    
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${fileExt}`;
    
    setUploadingAvatar(true);
    
    try {
      // Delete old avatar if exists
      await supabase.storage.from('avatars').remove([`${user.id}/avatar.png`, `${user.id}/avatar.jpg`, `${user.id}/avatar.jpeg`]);
      
      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      // Update profile with new avatar URL
      const { error: updateError } = await supabase.from('profiles').update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);
      
      if (updateError) throw updateError;
      
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      toast({ title: 'Photo Updated', description: 'Your profile photo has been updated.' });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({ title: 'Error', description: 'Failed to upload photo', variant: 'destructive' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Loader2 className="h-12 w-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} className="w-64 bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Star className="h-6 w-6 text-accent" />
            MechanicQ Pro
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'reviews', icon: MessageSquare, label: 'Reviews' },
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
              {item.badge ? <Badge className="ml-auto gradient-accent">{item.badge}</Badge> : null}
            </motion.button>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <motion.button whileHover={{ x: 4 }} onClick={handleSignOut} className="nav-link w-full text-destructive hover:bg-destructive/10">
            <LogOut className="h-5 w-5" />
            Sign Out
          </motion.button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <AnimatePresence mode="wait">
          {activeNav === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              {/* Header with Online Toggle */}
              <div className="flex items-center justify-between">
                <motion.h2 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-3xl font-bold">Dashboard</motion.h2>
                <div className="flex items-center gap-4">
                  {/* Sound Toggle */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="p-2 rounded-full bg-secondary hover:bg-secondary/80"
                    title={soundEnabled ? 'Sound On' : 'Sound Off'}
                  >
                    {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5 text-muted-foreground" />}
                  </motion.button>
                  <NotificationBell />
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-3 bg-card rounded-full px-4 py-2 border border-border shadow-sm">
                    <span className={`w-3 h-3 rounded-full ${shop?.is_online ? 'bg-success animate-pulse' : 'bg-muted'}`} />
                    <span className="text-sm font-medium">{shop?.is_online ? 'Online' : 'Offline'}</span>
                    <Switch checked={shop?.is_online || false} onCheckedChange={toggleOnlineStatus} className="data-[state=checked]:bg-success" />
                  </motion.div>
                </div>
              </div>

              {/* Stats Cards */}
              <StaggerContainer className="grid grid-cols-4 gap-4">
                {[
                  { icon: DollarSign, value: `₹${(shop?.total_earnings || 0).toLocaleString()}`, label: 'Total Earnings', gradient: 'gradient-success', color: 'text-success-foreground' },
                  { icon: Briefcase, value: shop?.jobs_completed || 0, label: 'Jobs Completed', gradient: 'gradient-primary', color: 'text-primary-foreground' },
                  { icon: Star, value: shop?.average_rating?.toFixed(1) || '0.0', sublabel: `${shop?.total_reviews || 0} Reviews`, gradient: 'gradient-accent', color: 'text-accent-foreground' },
                  { icon: Target, value: `${shop?.response_rate || 0}%`, label: 'Response Rate', gradient: 'bg-primary/20', color: 'text-primary', iconBg: false },
                ].map((stat, index) => (
                  <StaggerItem key={stat.label || stat.sublabel}>
                    <AnimatedCard delay={index * 0.1} glow className="p-6">
                      <div className="flex items-center gap-4">
                        <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className={`w-14 h-14 rounded-xl ${stat.gradient} flex items-center justify-center shadow-lg`}>
                          <stat.icon className={`h-7 w-7 ${stat.color}`} />
                        </motion.div>
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
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Performance
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-muted-foreground">Customer Satisfaction</span>
                        <span className="font-semibold text-success">{((shop?.average_rating || 0) / 5 * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(shop?.average_rating || 0) / 5 * 100}%` }} transition={{ delay: 0.5, duration: 0.8 }} className="h-full gradient-success rounded-full" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-muted-foreground">Response Rate</span>
                        <span className="font-semibold text-primary">{shop?.response_rate || 0}%</span>
                      </div>
                      <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${shop?.response_rate || 0}%` }} transition={{ delay: 0.6, duration: 0.8 }} className="h-full gradient-primary rounded-full" />
                      </div>
                    </div>
                  </div>
                </AnimatedCard>

                <AnimatedCard delay={0.4} className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-warning" />
                    Quick Status
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: pendingRequests.length, label: 'Pending', color: 'warning' },
                      { value: activeJobs.length, label: 'Active', color: 'primary' },
                      { value: shop?.jobs_completed || 0, label: 'Done', color: 'success' },
                    ].map((stat) => (
                      <motion.div key={stat.label} whileHover={{ scale: 1.05, y: -2 }} className={`text-center p-4 bg-${stat.color}/10 rounded-xl cursor-pointer transition-all`}>
                        <p className={`text-3xl font-bold text-${stat.color}`}>{stat.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                      </motion.div>
                    ))}
                  </div>
                </AnimatedCard>
              </div>

              {/* Pending Requests */}
              {pendingRequests.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-xl flex items-center gap-2">
                    <Bell className="h-5 w-5 text-warning" />
                    New Service Requests
                    <Badge className="ml-2 gradient-warning text-warning-foreground">{pendingRequests.length}</Badge>
                  </h3>
                  <div className="grid gap-4">
                    {pendingRequests.map((request) => (
                      <ServiceRequestCard
                        key={request.id}
                        id={request.id}
                        status={request.status as JobStatus}
                        serviceName={request.service_type?.name || 'Service'}
                        customerName={request.customer?.full_name || 'Customer'}
                        customerPhone={request.customer?.phone_number}
                        address={request.customer_address}
                        description={request.description}
                        vehicleType={request.vehicle_type}
                        createdAt={request.created_at}
                        estimatedCost={request.estimated_cost || undefined}
                        viewMode="mechanic"
                        onAccept={() => acceptJob(request.id)}
                        onReject={() => declineJob(request.id)}
                        onCall={() => window.open(`tel:${request.customer?.phone_number}`)}
                        isAccepting={acceptingJobId === request.id}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Active Jobs */}
              {activeJobs.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-xl flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Active Jobs
                    <Badge className="ml-2 gradient-primary text-primary-foreground">{activeJobs.length}</Badge>
                  </h3>
                  <div className="grid gap-4">
                    {activeJobs.map((job) => (
                      <ServiceRequestCard
                        key={job.id}
                        id={job.id}
                        status={job.status as JobStatus}
                        serviceName={job.service_type?.name || 'Service'}
                        customerName={job.customer?.full_name || 'Customer'}
                        customerPhone={job.customer?.phone_number}
                        address={job.customer_address}
                        description={job.description}
                        vehicleType={job.vehicle_type}
                        createdAt={job.created_at}
                        viewMode="mechanic"
                        onStartJob={() => startJob(job.id)}
                        onCompleteJob={() => openCompletionModal(job)}
                        onOpenChat={() => openChat(job)}
                        onCall={() => window.open(`tel:${job.customer?.phone_number}`)}
                        isStarting={startingJobId === job.id}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* No Active Work */}
              {pendingRequests.length === 0 && activeJobs.length === 0 && (
                <AnimatedCard delay={0.5} className="p-12 text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                    <Zap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-2">No Active Jobs</h3>
                  <p className="text-muted-foreground mb-4">Turn on Online status to start receiving service requests.</p>
                  {!shop?.is_online && (
                    <Button onClick={toggleOnlineStatus} className="gradient-success">
                      Go Online
                    </Button>
                  )}
                </AnimatedCard>
              )}
            </motion.div>
          )}

          {activeNav === 'reviews' && (
            <motion.div key="reviews" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <Star className="h-8 w-8 text-warning" />
                Customer Reviews
              </h2>
              <MechanicReviewsList />
            </motion.div>
          )}

          {activeNav === 'notifications' && (
            <motion.div key="notifications" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <h2 className="text-3xl font-bold">Notifications</h2>
              {notifications.length === 0 ? (
                <AnimatedCard className="p-12 text-center">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No notifications yet</p>
                </AnimatedCard>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification, index) => (
                    <AnimatedCard key={notification.id} delay={index * 0.05} className={`p-4 ${!notification.is_read ? 'border-l-4 border-l-primary' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{notification.title}</h4>
                          <p className="text-muted-foreground">{notification.message}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(notification.created_at).toLocaleDateString()}</span>
                      </div>
                    </AnimatedCard>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeNav === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6 max-w-md">
              <h2 className="text-3xl font-bold">Profile</h2>
              <AnimatedCard className="p-6 space-y-4">
                {/* Avatar Upload Section */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-4 border-primary/20">
                      {profile.avatar_url ? (
                        <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                        {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'M'}
                      </AvatarFallback>
                    </Avatar>
                    <label 
                      htmlFor="avatar-upload" 
                      className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-lg"
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4 text-primary-foreground" />
                      )}
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={uploadingAvatar}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Click to upload photo</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} className="input-field" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile.email} disabled className="input-field" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" value={profile.phone_number} onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })} className="input-field" />
                </div>
                <Button onClick={saveProfile} className="w-full gradient-primary">Save Changes</Button>
              </AnimatedCard>
            </motion.div>
          )}

          {activeNav === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6 max-w-md">
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
                    <Switch checked={settings[setting.key as keyof typeof settings]} onCheckedChange={(value) => updateSettings(setting.key, value)} />
                  </div>
                ))}
              </AnimatedCard>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Job Completion Modal */}
      {selectedJob && (
        <JobCompletionModal
          isOpen={showCompletionModal}
          onClose={() => { setShowCompletionModal(false); setSelectedJob(null); }}
          serviceRequestId={selectedJob.id}
          customerId={selectedJob.customer_id}
          customerName={selectedJob.customer?.full_name || 'Customer'}
          onComplete={completeJobWithInvoice}
        />
      )}

      {/* Chat Window */}
      {chatJob && (
        <ChatWindow
          serviceRequestId={chatJob.id}
          otherPartyName={chatJob.customer?.full_name || 'Customer'}
          isOpen={showChat}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* Incoming Request Alert */}
      <IncomingRequestAlert
        request={incomingRequest ? {
          id: incomingRequest.id,
          serviceName: incomingRequest.service_type?.name || 'Service Request',
          customerName: incomingRequest.customer?.full_name || 'Customer',
          customerPhone: incomingRequest.customer?.phone_number,
          address: incomingRequest.customer_address,
          vehicleType: incomingRequest.vehicle_type,
          description: incomingRequest.description || undefined,
          createdAt: incomingRequest.created_at,
        } : null}
        onAccept={handleAcceptIncoming}
        onReject={handleRejectIncoming}
        isLoading={acceptingJobId === incomingRequest?.id}
        timeoutSeconds={30}
      />
    </div>
  );
};

export default MechanicDashboard;
