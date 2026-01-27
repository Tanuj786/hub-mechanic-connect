import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  MapPin, 
  Star, 
  Clock, 
  Phone,
  Navigation,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Mechanic {
  id: string;
  shop_name: string;
  shop_description: string;
  shop_address: string;
  hourly_rate: number;
  years_of_experience: number;
  average_rating: number;
  total_reviews: number;
  is_online: boolean;
  whatsapp_number: string;
  mechanic: {
    full_name: string;
  };
  services: {
    service_type: {
      name: string;
    };
  }[];
}

const FindMechanic = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);

  useEffect(() => {
    fetchMechanics();
  }, []);

  const fetchMechanics = async () => {
    try {
      const { data: shopsData, error: shopsError } = await supabase
        .from('mechanic_shops')
        .select(`
          *,
          mechanic:profiles!mechanic_id(full_name)
        `)
        .eq('is_online', true);

      if (shopsError) throw shopsError;

      // Fetch services for each mechanic
      const mechanicsWithServices = await Promise.all(
        (shopsData || []).map(async (shop) => {
          const { data: servicesData } = await supabase
            .from('mechanic_services')
            .select(`
              service_type:service_types(name)
            `)
            .eq('mechanic_id', shop.mechanic_id);

          return {
            ...shop,
            services: servicesData || [],
          };
        })
      );

      setMechanics(mechanicsWithServices as any);
    } catch (error) {
      console.error('Error fetching mechanics:', error);
    } finally {
      setLoading(false);
    }
  };

  const enableLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationEnabled(true);
          toast({
            title: 'Location Enabled',
            description: 'Showing mechanics near you.',
          });
        },
        () => {
          toast({
            title: 'Location Error',
            description: 'Unable to get your location.',
            variant: 'destructive',
          });
        }
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Link to="/customer/dashboard" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Find Nearby Mechanics</h1>
          <Button 
            onClick={enableLocation}
            className={locationEnabled ? 'gradient-success' : 'gradient-primary'}
          >
            <Navigation className="mr-2 h-4 w-4" />
            {locationEnabled ? 'Location On' : 'Enable Location'}
          </Button>
        </div>

        {location && (
          <Badge variant="secondary" className="mb-6">
            📍 Showing results near: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
          </Badge>
        )}

        {mechanics.length === 0 ? (
          <Card className="stat-card text-center py-12">
            <CardContent>
              <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Mechanics Available</h3>
              <p className="text-muted-foreground">
                No mechanics are currently online. Please try again later.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {mechanics.map((mechanic) => (
              <Card key={mechanic.id} className="stat-card hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{mechanic.shop_name}</h3>
                        <Badge className="gradient-success">Online</Badge>
                      </div>
                      <p className="text-muted-foreground mb-4">
                        {mechanic.mechanic?.full_name}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 text-sm mb-4">
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-warning" />
                          {mechanic.average_rating?.toFixed(1) || '0.0'} ({mechanic.total_reviews || 0} reviews)
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-primary" />
                          {mechanic.years_of_experience || 0} years exp.
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-accent" />
                          {mechanic.shop_address}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {mechanic.services?.slice(0, 4).map((service, idx) => (
                          <Badge key={idx} variant="secondary">
                            {service.service_type?.name}
                          </Badge>
                        ))}
                        {(mechanic.services?.length || 0) > 4 && (
                          <Badge variant="outline">
                            +{(mechanic.services?.length || 0) - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        ₹{mechanic.hourly_rate || 0}
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">per hour</p>
                      
                      {mechanic.whatsapp_number && (
                        <Button 
                          size="sm" 
                          className="gradient-success"
                          onClick={() => window.open(`https://wa.me/${mechanic.whatsapp_number}`, '_blank')}
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          Contact
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FindMechanic;
