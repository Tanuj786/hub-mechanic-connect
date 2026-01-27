import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type VehicleType = 'car' | 'bike' | 'electric' | 'battery' | 'tyre' | 'general';

interface ServiceRequest {
  id: string;
  status: string;
  created_at: string;
  service_type: {
    name: string;
  };
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchServiceHistory();
      fetchNotifications();
    }
  }, [user]);

  const fetchServiceHistory = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select('id, status, created_at, service_type:service_types(name)')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServiceHistory(data || []);
    } catch (error) {
      console.error('Error fetching service history:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
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
        (error) => {
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

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <CircleDot className="h-6 w-6 text-accent" />
            MechanicQ
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
            onClick={() => navigate('/customer/find-mechanic')}
            className={`nav-link w-full ${activeNav === 'find' ? 'active' : ''}`}
          >
            <Search className="h-5 w-5" />
            Find Mechanic
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
            <h2 className="text-3xl font-bold">Welcome Back!</h2>

            {/* Status Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="stat-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{statusCounts.active}</p>
                      <p className="text-muted-foreground">Active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="stat-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                      <Settings className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{statusCounts.completed}</p>
                      <p className="text-muted-foreground">Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="stat-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                      <CircleDot className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{statusCounts.cancelled}</p>
                      <p className="text-muted-foreground">Cancelled</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Location Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Set Your Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleGetLocation}
                  className="w-full gradient-primary"
                >
                  <Navigation className="mr-2 h-4 w-4" />
                  Use Current Location
                </Button>
                <div className="text-center text-muted-foreground">or</div>
                <Input
                  placeholder="Enter address manually"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="input-field"
                />
                {location && (
                  <Badge variant="secondary" className="w-full justify-center py-2">
                    📍 Location set: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Vehicle Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Vehicle Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  {vehicleTypes.map(({ type, icon: Icon, label }) => (
                    <button
                      key={type}
                      onClick={() => setSelectedVehicle(type)}
                      className={`stat-card text-center p-4 cursor-pointer transition-all ${
                        selectedVehicle === type ? 'ring-2 ring-primary shadow-glow' : ''
                      }`}
                    >
                      <Icon className={`h-8 w-8 mx-auto mb-2 ${selectedVehicle === type ? 'text-primary' : 'text-muted-foreground'}`} />
                      <p className="text-sm font-medium">{label}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Service History */}
            <Card>
              <CardHeader>
                <CardTitle>Service History</CardTitle>
              </CardHeader>
              <CardContent>
                {serviceHistory.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No service requests yet. Find a mechanic to get started!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {serviceHistory.slice(0, 5).map((service) => (
                      <div key={service.id} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                        <div>
                          <p className="font-medium">{service.service_type?.name || 'Service'}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(service.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={`status-badge ${service.status}`}>
                          {service.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
      </main>
    </div>
  );
};

export default CustomerDashboard;
