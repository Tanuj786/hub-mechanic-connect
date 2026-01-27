import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
  MapPin
} from 'lucide-react';
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

  useEffect(() => {
    if (user) {
      fetchData();
      setupRealtimeSubscription();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      // Fetch shop data
      const { data: shopData } = await supabase
        .from('mechanic_shops')
        .select('*')
        .eq('mechanic_id', user.id)
        .maybeSingle();
      
      setShop(shopData);

      // Fetch profile
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

      // Fetch pending requests
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

      // Fetch active jobs for this mechanic
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

      // Fetch notifications
      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      setNotifications(notifData || []);

      // Fetch settings
      const { data: settingsData } = await supabase
        .from('mechanic_settings')
        .select('*')
        .eq('mechanic_id', user.id)
        .maybeSingle();
      
      if (settingsData) {
        setSettings({
          push_notifications: settingsData.push_notifications,
          location_sharing: settingsData.location_sharing,
          dark_mode: settingsData.dark_mode,
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

  const completeJob = async (requestId: string) => {
    const { error } = await supabase
      .from('service_requests')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete job',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Job Completed!',
        description: 'Great work! The customer can now rate your service.',
      });
      fetchData();
    }
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Star className="h-6 w-6 text-accent" />
            MechanicQ Pro
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveNav('dashboard')}
            className={`nav-link w-full ${activeNav === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveNav('notifications')}
            className={`nav-link w-full ${activeNav === 'notifications' ? 'active' : ''}`}
          >
            <Bell className="h-5 w-5" />
            Notifications
            {notifications.filter(n => !n.is_read).length > 0 && (
              <Badge className="ml-auto gradient-accent">{notifications.filter(n => !n.is_read).length}</Badge>
            )}
          </button>
          <button 
            onClick={() => setActiveNav('profile')}
            className={`nav-link w-full ${activeNav === 'profile' ? 'active' : ''}`}
          >
            <User className="h-5 w-5" />
            Profile
          </button>
          <button 
            onClick={() => setActiveNav('settings')}
            className={`nav-link w-full ${activeNav === 'settings' ? 'active' : ''}`}
          >
            <Settings className="h-5 w-5" />
            Settings
          </button>
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <button onClick={handleSignOut} className="nav-link w-full text-destructive hover:bg-destructive/10">
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {activeNav === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold">Dashboard</h2>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {shop?.is_online ? 'Online' : 'Offline'}
                </span>
                <Switch 
                  checked={shop?.is_online || false} 
                  onCheckedChange={toggleOnlineStatus}
                  className="data-[state=checked]:bg-success"
                />
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="stat-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full gradient-success flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-success-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">₹{shop?.total_earnings || 0}</p>
                      <p className="text-muted-foreground text-sm">Total Earnings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="stat-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                      <Briefcase className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{shop?.jobs_completed || 0}</p>
                      <p className="text-muted-foreground text-sm">Jobs Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="stat-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center">
                      <Star className="h-6 w-6 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{shop?.average_rating?.toFixed(1) || '0.0'}</p>
                      <p className="text-muted-foreground text-sm">{shop?.total_reviews || 0} Reviews</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="stat-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-warning" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{shop?.response_rate || 0}%</p>
                      <p className="text-muted-foreground text-sm">Response Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance & Achievements */}
            <div className="grid grid-cols-2 gap-6">
              <Card className="stat-card">
                <CardHeader>
                  <CardTitle>Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Customer Satisfaction</span>
                    <span className="font-semibold text-success">
                      {((shop?.average_rating || 0) / 5 * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Online Completion</span>
                    <span className="font-semibold text-primary">95%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Repeat Customers</span>
                    <span className="font-semibold text-accent">23</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="stat-card">
                <CardHeader>
                  <CardTitle>Achievements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Award className="h-8 w-8 text-warning" />
                    <div>
                      <p className="font-semibold">Top Rated</p>
                      <p className="text-sm text-muted-foreground">Rating above 4.5</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Zap className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-semibold">Fast Reply</p>
                      <p className="text-sm text-muted-foreground">Response under 5 min</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-8 w-8 text-success" />
                    <div>
                      <p className="font-semibold">{shop?.jobs_completed || 0} Jobs Done</p>
                      <p className="text-sm text-muted-foreground">Total completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Status */}
            <Card className="stat-card">
              <CardHeader>
                <CardTitle>Quick Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-warning/10 rounded-lg">
                    <p className="text-3xl font-bold text-warning">{pendingRequests.length}</p>
                    <p className="text-sm text-muted-foreground">Pending Requests</p>
                  </div>
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <p className="text-3xl font-bold text-primary">{activeJobs.length}</p>
                    <p className="text-sm text-muted-foreground">Active Jobs</p>
                  </div>
                  <div className="text-center p-4 bg-success/10 rounded-lg">
                    <p className="text-3xl font-bold text-success">{shop?.jobs_completed || 0}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shop Profile Card */}
            {shop && (
              <Card className="stat-card">
                <CardHeader>
                  <CardTitle>Your Shop Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Shop Name</p>
                      <p className="font-semibold">{shop.shop_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Hourly Rate</p>
                      <p className="font-semibold">₹{shop.hourly_rate}/hr</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-semibold">{shop.shop_address}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Experience</p>
                      <p className="font-semibold">{shop.years_of_experience} years</p>
                    </div>
                  </div>
                  {shop.shop_description && (
                    <div>
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p className="font-semibold">{shop.shop_description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Pending Service Requests */}
            {pendingRequests.length > 0 && (
              <Card className="stat-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-warning" />
                    New Service Requests
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="p-4 border border-border rounded-lg bg-warning/5">
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
                        <MapPin className="h-4 w-4" />
                        {request.customer_address}
                      </p>
                      {request.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {request.description}
                        </p>
                      )}
                      <Button 
                        onClick={() => acceptJob(request.id)}
                        className="w-full gradient-success"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Accept Job
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Active Jobs */}
            {activeJobs.length > 0 && (
              <Card className="stat-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Active Jobs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeJobs.map((job) => (
                    <div key={job.id} className="p-4 border border-border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold">{job.service_type?.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {job.customer?.full_name} • {job.customer?.phone_number}
                          </p>
                        </div>
                        <Badge className="status-badge active">{job.status}</Badge>
                      </div>
                      <p className="text-sm mb-3 flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.customer_address}
                      </p>
                      <Button 
                        onClick={() => completeJob(job.id)}
                        className="w-full gradient-primary"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Complete Job
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeNav === 'notifications' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-3xl font-bold">Notifications</h2>
            {notifications.length === 0 ? (
              <Card className="stat-card">
                <CardContent className="py-12 text-center">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No notifications yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <Card key={notification.id} className={`stat-card ${!notification.is_read ? 'border-l-4 border-l-primary' : ''}`}>
                    <CardContent className="py-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{notification.title}</h4>
                          <p className="text-muted-foreground">{notification.message}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeNav === 'profile' && (
          <div className="space-y-6 animate-fade-in max-w-md">
            <h2 className="text-3xl font-bold">Profile</h2>
            <Card className="stat-card">
              <CardContent className="pt-6 space-y-4">
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
              </CardContent>
            </Card>
          </div>
        )}

        {activeNav === 'settings' && (
          <div className="space-y-6 animate-fade-in max-w-md">
            <h2 className="text-3xl font-bold">Settings</h2>
            <Card className="stat-card">
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive alerts for new requests</p>
                  </div>
                  <Switch 
                    checked={settings.push_notifications}
                    onCheckedChange={(value) => updateSettings('push_notifications', value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Location Sharing</p>
                    <p className="text-sm text-muted-foreground">Share location with customers</p>
                  </div>
                  <Switch 
                    checked={settings.location_sharing}
                    onCheckedChange={(value) => updateSettings('location_sharing', value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Dark Mode</p>
                    <p className="text-sm text-muted-foreground">Use dark theme</p>
                  </div>
                  <Switch 
                    checked={settings.dark_mode}
                    onCheckedChange={(value) => updateSettings('dark_mode', value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardHeader>
                <CardTitle>Connected Device</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Connect Device
                </Button>
                <Button variant="outline" className="w-full">
                  Privacy & Security
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default MechanicDashboard;
