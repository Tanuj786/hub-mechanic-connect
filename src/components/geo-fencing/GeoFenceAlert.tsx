import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, X, Shield, AlertTriangle, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface GeoZone {
  id: string;
  name: string;
  zone_type: string;
  center_latitude: number;
  center_longitude: number;
  radius_km: number;
  alert_message: string;
}

interface GeoFenceAlertProps {
  onFindMechanic?: () => void;
}

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const GeoFenceAlert = ({ onFindMechanic }: GeoFenceAlertProps) => {
  const [activeAlert, setActiveAlert] = useState<GeoZone | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [nearbyMechanicsCount, setNearbyMechanicsCount] = useState(0);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const checkGeoFences = useCallback(async (lat: number, lng: number) => {
    const { data: zones } = await supabase
      .from('geo_zones')
      .select('*');

    if (!zones) return;

    for (const zone of zones) {
      const distance = getDistanceKm(lat, lng, zone.center_latitude, zone.center_longitude);
      if (distance <= zone.radius_km) {
        setActiveAlert(zone);
        // Count nearby online mechanics
        const { count } = await supabase
          .from('mechanic_shops')
          .select('*', { count: 'exact', head: true })
          .eq('is_online', true);
        setNearbyMechanicsCount(count || 0);
        return;
      }
    }
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        checkGeoFences(latitude, longitude);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [checkGeoFences]);

  if (!activeAlert || dismissed) return null;

  const zoneIcon = activeAlert.zone_type === 'highway' ? AlertTriangle : MapPin;
  const ZoneIcon = zoneIcon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="relative overflow-hidden rounded-xl border border-accent/30 bg-gradient-to-r from-accent/10 via-accent/5 to-transparent p-4 shadow-lg"
      >
        {/* Animated background pulse */}
        <motion.div
          animate={{ opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-r from-accent/20 to-transparent pointer-events-none"
        />

        <div className="relative flex items-start gap-4">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex-shrink-0 w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center"
          >
            <ZoneIcon className="h-6 w-6 text-accent" />
          </motion.div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-accent" />
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                Geo-Fence Alert
              </span>
            </div>
            <p className="font-bold text-foreground">{activeAlert.alert_message}</p>
            <p className="text-sm text-muted-foreground mt-1">
              📍 {activeAlert.name}
              {nearbyMechanicsCount > 0 && (
                <span className="ml-2 text-accent font-medium">
                  • {nearbyMechanicsCount} mechanic{nearbyMechanicsCount > 1 ? 's' : ''} online nearby
                </span>
              )}
            </p>

            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={onFindMechanic}
                className="gradient-accent shadow-md"
              >
                <Wrench className="mr-1.5 h-4 w-4" />
                Find Mechanic Now
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDismissed(true)}
                className="text-muted-foreground"
              >
                Dismiss
              </Button>
            </div>
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
