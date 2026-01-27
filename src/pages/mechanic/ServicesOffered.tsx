import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Wrench, ArrowLeft, Loader2, Check, CircleDot, Fuel, Settings, Octagon, Battery, Truck, Droplet, Wind } from 'lucide-react';

interface ServiceType {
  id: string;
  name: string;
  icon: string;
}

const iconMap: Record<string, any> = {
  'circle-dot': CircleDot,
  'fuel': Fuel,
  'settings': Settings,
  'octagon': Octagon,
  'battery': Battery,
  'truck': Truck,
  'droplet': Droplet,
  'wind': Wind,
};

const ServicesOffered = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchingServices, setFetchingServices] = useState(true);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  useEffect(() => {
    fetchServiceTypes();
  }, []);

  const fetchServiceTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('service_types')
        .select('*')
        .order('name');

      if (error) throw error;
      setServiceTypes(data || []);
    } catch (error) {
      console.error('Error fetching service types:', error);
    } finally {
      setFetchingServices(false);
    }
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Error',
        description: 'Please log in first.',
        variant: 'destructive',
      });
      navigate('/mechanic/register');
      return;
    }

    if (selectedServices.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one service.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const servicesData = selectedServices.map(serviceId => ({
        mechanic_id: user.id,
        service_type_id: serviceId,
      }));

      const { error } = await supabase
        .from('mechanic_services')
        .insert(servicesData);

      if (error) throw error;

      // Also create default settings
      await supabase
        .from('mechanic_settings')
        .insert({
          mechanic_id: user.id,
        });

      toast({
        title: 'Registration Complete!',
        description: 'Welcome to MechanicQ! Your shop is now live.',
      });
      navigate('/mechanic/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Link to="/mechanic/shop-details" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Shop Details
        </Link>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 gradient-accent rounded-full flex items-center justify-center mb-4">
              <Wrench className="h-6 w-6 text-accent-foreground" />
            </div>
            <CardTitle className="text-2xl">Services Offered</CardTitle>
            <CardDescription>Step 3 of 3: Select the services you provide</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {fetchingServices ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {serviceTypes.map((service) => {
                    const Icon = iconMap[service.icon] || Settings;
                    const isSelected = selectedServices.includes(service.id);
                    
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => toggleService(service.id)}
                        className={`service-chip p-4 flex flex-col items-center gap-2 rounded-lg ${
                          isSelected ? 'gradient-primary text-primary-foreground' : ''
                        }`}
                        data-selected={isSelected}
                      >
                        {isSelected ? (
                          <Check className="h-6 w-6" />
                        ) : (
                          <Icon className="h-6 w-6" />
                        )}
                        <span className="text-sm font-medium text-center">{service.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
            <div className="p-6 pt-0">
              <Button 
                type="submit" 
                className="w-full gradient-accent" 
                disabled={loading || selectedServices.length === 0}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Complete Registration
              </Button>
              <p className="text-sm text-muted-foreground text-center mt-4">
                {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ServicesOffered;
