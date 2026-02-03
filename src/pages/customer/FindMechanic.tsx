import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnimatedCard } from '@/components/ui/animated-card';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ServiceRequestFlow } from '@/components/service-request/ServiceRequestFlow';
import { MechanicReviewsDisplay } from '@/components/reviews/MechanicReviewsDisplay';
import { 
  ArrowLeft,
  MapPin, 
  Star, 
  Clock, 
  Phone,
  Navigation,
  Loader2,
  Wrench,
  Users,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Mechanic {
  id: string;
  mechanic_id: string;
  shop_name: string;
  shop_description: string;
  shop_address: string;
  hourly_rate: number;
  years_of_experience: number;
  average_rating: number;
  total_reviews: number;
  is_online: boolean;
  whatsapp_number: string;
  jobs_completed: number;
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
  const [showRequestFlow, setShowRequestFlow] = useState(true);
  const [requestCreated, setRequestCreated] = useState(false);
  const [onlineMechanicsCount, setOnlineMechanicsCount] = useState(0);
  const [expandedMechanic, setExpandedMechanic] = useState<string | null>(null);

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
      setOnlineMechanicsCount(mechanicsWithServices.length);
    } catch (error) {
      console.error('Error fetching mechanics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCreated = (requestId: string) => {
    setRequestCreated(true);
    toast({
      title: 'Request Sent!',
      description: 'We are finding the best mechanic for you.',
    });
  };

  const toggleMechanicExpand = (mechanicId: string) => {
    setExpandedMechanic(expandedMechanic === mechanicId ? null : mechanicId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="h-12 w-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border"
      >
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/customer/dashboard"
              className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </Link>
            <h1 className="text-xl font-bold">Request Service</h1>
            <NotificationBell />
          </div>
        </div>
      </motion.header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          <AnimatedCard className="p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-success/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-success" />
            </div>
            <p className="text-2xl font-bold">{onlineMechanicsCount}</p>
            <p className="text-sm text-muted-foreground">Online Now</p>
          </AnimatedCard>
          <AnimatedCard delay={0.1} className="p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">15-30</p>
            <p className="text-sm text-muted-foreground">Min ETA</p>
          </AnimatedCard>
          <AnimatedCard delay={0.2} className="p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-warning/10 flex items-center justify-center">
              <Star className="h-5 w-5 text-warning" />
            </div>
            <p className="text-2xl font-bold">4.8</p>
            <p className="text-sm text-muted-foreground">Avg Rating</p>
          </AnimatedCard>
        </motion.div>

        {/* Service Request Flow */}
        <AnimatedCard delay={0.3} className="p-6 mb-8">
          <ServiceRequestFlow onRequestCreated={handleRequestCreated} />
        </AnimatedCard>

        {/* Available Mechanics Preview with Reviews */}
        {!requestCreated && mechanics.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              Nearby Mechanics
            </h2>
            <div className="grid gap-4">
              {mechanics.slice(0, 5).map((mechanic, index) => (
                <motion.div
                  key={mechanic.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{mechanic.shop_name}</h3>
                            <Badge className="bg-success/10 text-success border-success/30">
                              <span className="w-2 h-2 rounded-full bg-success mr-1 animate-pulse" />
                              Online
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {mechanic.mechanic?.full_name}
                          </p>
                          
                          <div className="flex flex-wrap gap-3 text-sm">
                            <span className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-warning fill-warning" />
                              {mechanic.average_rating?.toFixed(1) || '0.0'}
                              <span className="text-muted-foreground">
                                ({mechanic.total_reviews || 0})
                              </span>
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <CheckCircle className="h-4 w-4 text-success" />
                              {mechanic.jobs_completed || 0} jobs
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              {mechanic.shop_address.slice(0, 30)}...
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2 mt-3">
                            {mechanic.services?.slice(0, 3).map((service, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {service.service_type?.name}
                              </Badge>
                            ))}
                            {(mechanic.services?.length || 0) > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{(mechanic.services?.length || 0) - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="text-right ml-4">
                          <p className="text-xl font-bold text-primary">
                            ₹{mechanic.hourly_rate || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">per hour</p>
                        </div>
                      </div>

                      {/* View Reviews Button */}
                      {mechanic.total_reviews > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleMechanicExpand(mechanic.id)}
                          className="w-full mt-3 text-xs"
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {expandedMechanic === mechanic.id ? 'Hide' : 'View'} Customer Reviews
                          {expandedMechanic === mechanic.id ? (
                            <ChevronUp className="h-3 w-3 ml-1" />
                          ) : (
                            <ChevronDown className="h-3 w-3 ml-1" />
                          )}
                        </Button>
                      )}

                      {/* Expanded Reviews Section */}
                      <AnimatePresence>
                        {expandedMechanic === mechanic.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 pt-4 border-t border-border">
                              <MechanicReviewsDisplay
                                mechanicId={mechanic.mechanic_id}
                                limit={3}
                                showTitle={false}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {mechanics.length > 5 && (
              <p className="text-center text-sm text-muted-foreground">
                +{mechanics.length - 5} more mechanics available
              </p>
            )}
          </motion.div>
        )}

        {/* No Mechanics Available */}
        {mechanics.length === 0 && !loading && (
          <AnimatedCard delay={0.4} className="p-12 text-center">
            <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Mechanics Online</h3>
            <p className="text-muted-foreground mb-4">
              No mechanics are currently available in your area. Please try again later.
            </p>
            <Button onClick={() => navigate('/customer/dashboard')} variant="outline">
              Return to Dashboard
            </Button>
          </AnimatedCard>
        )}
      </main>
    </div>
  );
};

export default FindMechanic;
