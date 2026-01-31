import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AnimatedCard } from '@/components/ui/animated-card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  MapPin, 
  Navigation, 
  Loader2, 
  Car, 
  Bike, 
  Zap, 
  Battery, 
  CircleDot, 
  Settings, 
  Search,
  CheckCircle,
  Clock,
  User,
  Star,
  Phone,
  MessageSquare,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { CustomerMediaUpload } from '@/components/media/CustomerMediaUpload';

type VehicleType = 'car' | 'bike' | 'electric' | 'battery' | 'tyre' | 'general';
type FlowStep = 'location' | 'vehicle' | 'service' | 'description' | 'searching' | 'found' | 'confirmed';

interface ServiceType {
  id: string;
  name: string;
  icon: string | null;
}

interface MechanicInfo {
  id: string;
  name: string;
  rating: number;
  totalJobs: number;
  estimatedTime: string;
  distance: string;
  shopName: string;
}

interface ServiceRequestFlowProps {
  onRequestCreated?: (requestId: string) => void;
}

const vehicleTypes: { type: VehicleType; icon: any; label: string }[] = [
  { type: 'car', icon: Car, label: 'Car' },
  { type: 'bike', icon: Bike, label: 'Bike' },
  { type: 'electric', icon: Zap, label: 'Electric' },
  { type: 'battery', icon: Battery, label: 'Battery' },
  { type: 'tyre', icon: CircleDot, label: 'Tyre' },
  { type: 'general', icon: Settings, label: 'General' },
];

export const ServiceRequestFlow = ({ onRequestCreated }: ServiceRequestFlowProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<FlowStep>('location');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [description, setDescription] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [searchingMechanic, setSearchingMechanic] = useState(false);
  const [foundMechanic, setFoundMechanic] = useState<MechanicInfo | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    fetchServiceTypes();
  }, []);

  // Listen for request acceptance
  useEffect(() => {
    if (!requestId) return;

    const channel = supabase
      .channel(`request-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'service_requests',
          filter: `id=eq.${requestId}`,
        },
        async (payload) => {
          const newStatus = payload.new.status;
          if (newStatus === 'accepted' && payload.new.mechanic_id) {
            // Fetch mechanic details
            const { data: mechanicData } = await supabase
              .from('mechanic_shops')
              .select('*, mechanic:profiles!mechanic_id(full_name)')
              .eq('mechanic_id', payload.new.mechanic_id)
              .single();

            if (mechanicData) {
              setFoundMechanic({
                id: mechanicData.mechanic_id,
                name: mechanicData.mechanic?.full_name || 'Mechanic',
                rating: mechanicData.average_rating || 0,
                totalJobs: mechanicData.jobs_completed || 0,
                estimatedTime: '15-20 mins',
                distance: '2.5 km',
                shopName: mechanicData.shop_name,
              });
              setSearchingMechanic(false);
              setStep('found');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId]);

  const fetchServiceTypes = async () => {
    const { data } = await supabase.from('service_types').select('*');
    setServiceTypes(data || []);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Not Supported',
        description: 'Geolocation is not supported by your browser.',
        variant: 'destructive',
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsGettingLocation(false);
        toast({
          title: 'Location Detected',
          description: 'Your current location has been set.',
        });
      },
      (error) => {
        setIsGettingLocation(false);
        toast({
          title: 'Location Error',
          description: 'Unable to get your location. Please enter manually.',
          variant: 'destructive',
        });
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSubmitRequest = async () => {
    if (!user || !selectedVehicle || !selectedService || (!location && !address)) {
      toast({
        title: 'Missing Information',
        description: 'Please fill all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    setStep('searching');
    setSearchingMechanic(true);

    try {
      const { data, error } = await supabase.from('service_requests').insert({
        customer_id: user.id,
        service_type_id: selectedService.id,
        vehicle_type: selectedVehicle,
        customer_address: address || `${location?.lat.toFixed(6)}, ${location?.lng.toFixed(6)}`,
        customer_latitude: location?.lat,
        customer_longitude: location?.lng,
        description: description.trim() || null,
        status: 'pending',
      }).select().single();

      if (error) throw error;

      setRequestId(data.id);
      onRequestCreated?.(data.id);

      // TODO: Upload media files if any
      // For now, just notify that request is created

    } catch (error) {
      console.error('Error creating request:', error);
      toast({
        title: 'Error',
        description: 'Failed to create service request.',
        variant: 'destructive',
      });
      setStep('description');
      setSearchingMechanic(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!requestId) return;

    try {
      await supabase.from('service_requests').update({ status: 'cancelled' }).eq('id', requestId);
      toast({
        title: 'Request Cancelled',
        description: 'Your service request has been cancelled.',
      });
      // Reset flow
      setStep('location');
      setRequestId(null);
      setSearchingMechanic(false);
      setFoundMechanic(null);
    } catch (error) {
      console.error('Error cancelling request:', error);
    }
  };

  const progressSteps = ['location', 'vehicle', 'service', 'description'];
  const currentStepIndex = progressSteps.indexOf(step);
  const progress = step === 'searching' || step === 'found' ? 100 : ((currentStepIndex + 1) / progressSteps.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      {!['searching', 'found', 'confirmed'].includes(step) && (
        <div className="relative">
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full gradient-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {['Location', 'Vehicle', 'Service', 'Details'].map((label, idx) => (
              <span
                key={label}
                className={cn(
                  'text-xs font-medium',
                  idx <= currentStepIndex ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Step 1: Location */}
        {step === 'location' && (
          <motion.div
            key="location"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <MapPin className="h-12 w-12 mx-auto text-primary mb-3" />
              <h3 className="text-xl font-bold">Where are you?</h3>
              <p className="text-muted-foreground">We'll find mechanics near your location</p>
            </div>

            <Button
              onClick={handleGetLocation}
              disabled={isGettingLocation}
              className="w-full gradient-primary py-6 text-lg"
            >
              {isGettingLocation ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Detecting Location...
                </>
              ) : (
                <>
                  <Navigation className="mr-2 h-5 w-5" />
                  Use Current Location
                </>
              )}
            </Button>

            {location && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-success/10 border border-success/30"
              >
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Location detected!</span>
                </div>
              </motion.div>
            )}

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-muted-foreground text-sm">or enter manually</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Input
              placeholder="Enter your address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input-field"
            />

            <Button
              onClick={() => setStep('vehicle')}
              disabled={!location && !address}
              className="w-full"
            >
              Continue
            </Button>
          </motion.div>
        )}

        {/* Step 2: Vehicle Type */}
        {step === 'vehicle' && (
          <motion.div
            key="vehicle"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <Car className="h-12 w-12 mx-auto text-primary mb-3" />
              <h3 className="text-xl font-bold">What type of vehicle?</h3>
              <p className="text-muted-foreground">Select your vehicle type</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {vehicleTypes.map(({ type, icon: Icon, label }, index) => (
                <motion.button
                  key={type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedVehicle(type)}
                  className={cn(
                    'p-6 rounded-xl border-2 transition-all text-center',
                    selectedVehicle === type
                      ? 'border-primary bg-primary/10 shadow-glow'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <Icon className={cn(
                    'h-10 w-10 mx-auto mb-2',
                    selectedVehicle === type ? 'text-primary' : 'text-muted-foreground'
                  )} />
                  <span className="font-medium">{label}</span>
                </motion.button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('location')} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => setStep('service')}
                disabled={!selectedVehicle}
                className="flex-1 gradient-primary"
              >
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Service Type */}
        {step === 'service' && (
          <motion.div
            key="service"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <Settings className="h-12 w-12 mx-auto text-primary mb-3" />
              <h3 className="text-xl font-bold">What service do you need?</h3>
              <p className="text-muted-foreground">Select the type of service</p>
            </div>

            <div className="grid gap-3 max-h-64 overflow-y-auto">
              {serviceTypes.map((service, index) => (
                <motion.button
                  key={service.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => setSelectedService(service)}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 text-left transition-all',
                    selectedService?.id === service.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <span className="font-medium">{service.name}</span>
                </motion.button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('vehicle')} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => setStep('description')}
                disabled={!selectedService}
                className="flex-1 gradient-primary"
              >
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Description & Media */}
        {step === 'description' && (
          <motion.div
            key="description"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <MessageSquare className="h-12 w-12 mx-auto text-primary mb-3" />
              <h3 className="text-xl font-bold">Describe the problem</h3>
              <p className="text-muted-foreground">Add details and photos to help mechanics</p>
            </div>

            <Textarea
              placeholder="Describe what's wrong with your vehicle..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="resize-none"
            />

            <div className="p-4 rounded-xl bg-secondary/50">
              <h4 className="font-medium mb-3">Add Photos (Optional)</h4>
              <CustomerMediaUpload onMediaChange={setMediaFiles} maxFiles={5} />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('service')} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleSubmitRequest}
                disabled={isSubmitting}
                className="flex-1 gradient-accent"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Find Mechanic
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Searching for Mechanic */}
        {step === 'searching' && (
          <motion.div
            key="searching"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center py-12"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-24 h-24 mx-auto mb-6 rounded-full gradient-primary flex items-center justify-center"
            >
              <Search className="h-12 w-12 text-primary-foreground" />
            </motion.div>
            
            <h3 className="text-2xl font-bold mb-2">Finding Nearby Mechanics</h3>
            <p className="text-muted-foreground mb-6">Please wait while we find the best mechanic for you...</p>

            {/* Animated Dots */}
            <div className="flex justify-center gap-2 mb-8">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                  className="w-3 h-3 rounded-full bg-primary"
                />
              ))}
            </div>

            <Button
              variant="outline"
              onClick={() => setShowCancelConfirm(true)}
              className="text-destructive hover:bg-destructive/10"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel Request
            </Button>
          </motion.div>
        )}

        {/* Mechanic Found */}
        {step === 'found' && foundMechanic && (
          <motion.div
            key="found"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring' }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full gradient-success flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-success-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-success">Mechanic Found!</h3>
            </motion.div>

            <AnimatedCard className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-lg">{foundMechanic.name}</h4>
                  <p className="text-muted-foreground text-sm">{foundMechanic.shopName}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-warning fill-warning" />
                      {foundMechanic.rating.toFixed(1)}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span>{foundMechanic.totalJobs} jobs</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-secondary/50 rounded-xl">
                <div className="text-center">
                  <Clock className="h-5 w-5 mx-auto text-primary mb-1" />
                  <p className="text-sm font-medium">{foundMechanic.estimatedTime}</p>
                  <p className="text-xs text-muted-foreground">Arrival Time</p>
                </div>
                <div className="text-center">
                  <MapPin className="h-5 w-5 mx-auto text-accent mb-1" />
                  <p className="text-sm font-medium">{foundMechanic.distance}</p>
                  <p className="text-xs text-muted-foreground">Away</p>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1">
                  <Phone className="mr-2 h-4 w-4" />
                  Call
                </Button>
                <Button className="flex-1 gradient-primary">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Chat
                </Button>
              </div>
            </AnimatedCard>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-sm text-center text-muted-foreground">
                The mechanic is on their way! You'll receive updates on their location.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel Request?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to cancel this service request?
          </p>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowCancelConfirm(false)} className="flex-1">
              No, Keep It
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowCancelConfirm(false);
                handleCancelRequest();
              }}
              className="flex-1"
            >
              Yes, Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
