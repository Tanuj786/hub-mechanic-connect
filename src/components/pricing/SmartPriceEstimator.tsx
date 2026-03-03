import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IndianRupee, Clock, MapPin, TrendingUp, Info, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface PricingRule {
  id: string;
  rule_name: string;
  rule_type: string;
  multiplier: number;
  condition_value: string | null;
}

interface SmartPriceEstimatorProps {
  serviceTypeId?: string;
  serviceTypeName?: string;
  userLocation?: { lat: number; lng: number } | null;
  mechanicLocation?: { lat: number; lng: number } | null;
  className?: string;
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

function getTimeOfDay(): 'night' | 'early_morning' | 'peak_morning' | 'normal' {
  const hour = new Date().getHours();
  if (hour >= 22 || hour < 6) return 'night';
  if (hour >= 6 && hour < 8) return 'early_morning';
  if (hour >= 8 && hour < 10) return 'peak_morning';
  return 'normal';
}

function getDistanceBucket(distanceKm: number): string {
  if (distanceKm <= 3) return '0-3';
  if (distanceKm <= 5) return '3-5';
  if (distanceKm <= 10) return '5-10';
  return '10+';
}

export const SmartPriceEstimator = ({
  serviceTypeId,
  serviceTypeName,
  userLocation,
  mechanicLocation,
  className,
}: SmartPriceEstimatorProps) => {
  const [basePrice, setBasePrice] = useState(200);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPricingData();
  }, [serviceTypeId]);

  const fetchPricingData = async () => {
    setLoading(true);
    const [serviceRes, rulesRes] = await Promise.all([
      serviceTypeId
        ? supabase.from('service_types').select('base_price').eq('id', serviceTypeId).single()
        : Promise.resolve({ data: null }),
      supabase.from('pricing_rules').select('*'),
    ]);

    if (serviceRes.data?.base_price) {
      setBasePrice(Number(serviceRes.data.base_price));
    }
    setPricingRules(rulesRes.data || []);
    setLoading(false);
  };

  const calculateEstimate = () => {
    let price = basePrice;
    const appliedRules: { name: string; multiplier: number; icon: any }[] = [];

    // Time multiplier
    const timeOfDay = getTimeOfDay();
    const timeRule = pricingRules.find(
      (r) => r.rule_type === 'time_multiplier' && r.condition_value === timeOfDay
    );
    if (timeRule) {
      price *= timeRule.multiplier;
      appliedRules.push({
        name: timeRule.rule_name,
        multiplier: timeRule.multiplier,
        icon: Clock,
      });
    }

    // Distance multiplier
    if (userLocation && mechanicLocation) {
      const distance = getDistanceKm(
        userLocation.lat, userLocation.lng,
        mechanicLocation.lat, mechanicLocation.lng
      );
      const bucket = getDistanceBucket(distance);
      const distRule = pricingRules.find(
        (r) => r.rule_type === 'distance_multiplier' && r.condition_value === bucket
      );
      if (distRule) {
        price *= distRule.multiplier;
        appliedRules.push({
          name: `Distance: ${distance.toFixed(1)} km`,
          multiplier: distRule.multiplier,
          icon: MapPin,
        });
      }
    }

    const minPrice = Math.round(price * 0.85);
    const maxPrice = Math.round(price * 1.15);

    return { minPrice, maxPrice, appliedRules };
  };

  if (loading) {
    return (
      <div className={cn('animate-pulse rounded-xl bg-secondary/50 h-24', className)} />
    );
  }

  const { minPrice, maxPrice, appliedRules } = calculateEstimate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 p-4 overflow-hidden relative',
        className
      )}
    >
      {/* Subtle animated glow */}
      <motion.div
        animate={{ opacity: [0.05, 0.1, 0.05] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 pointer-events-none"
      />

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <IndianRupee className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Smart Price Estimate</h4>
            {serviceTypeName && (
              <p className="text-xs text-muted-foreground">{serviceTypeName}</p>
            )}
          </div>
          <div className="ml-auto">
            <Zap className="h-4 w-4 text-accent" />
          </div>
        </div>

        {/* Price Range */}
        <div className="flex items-baseline gap-1 mb-3">
          <span className="text-2xl font-extrabold text-foreground">
            ₹{minPrice.toLocaleString('en-IN')}
          </span>
          <span className="text-muted-foreground font-medium">–</span>
          <span className="text-2xl font-extrabold text-foreground">
            ₹{maxPrice.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Applied Rules */}
        {appliedRules.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {appliedRules.map((rule, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-2 text-xs"
              >
                <rule.icon className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">{rule.name}</span>
                {rule.multiplier > 1 && (
                  <span className="ml-auto text-accent font-medium flex items-center gap-0.5">
                    <TrendingUp className="h-3 w-3" />
                    +{Math.round((rule.multiplier - 1) * 100)}%
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground/70">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>Estimate only. Final price set by mechanic after inspection.</span>
        </div>
      </div>
    </motion.div>
  );
};
