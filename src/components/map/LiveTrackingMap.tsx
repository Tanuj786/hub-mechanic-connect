import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Navigation, MapPin, Loader2 } from 'lucide-react';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const customerIcon = new L.DivIcon({
  html: `<div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const mechanicIcon = new L.DivIcon({
  html: `<div style="background: linear-gradient(135deg, #f59e0b, #d97706); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
  </div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Auto-fit map bounds when positions change
function MapBoundsUpdater({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  
  useEffect(() => {
    if (positions.length >= 2) {
      const bounds = L.latLngBounds(positions.map(p => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    } else if (positions.length === 1) {
      map.setView(positions[0], 15);
    }
  }, [positions, map]);
  
  return null;
}

interface LiveTrackingMapProps {
  serviceRequestId: string;
  customerLocation?: { lat: number; lng: number } | null;
  mechanicId?: string | null;
  customerName?: string;
  mechanicName?: string;
  /** 'customer' or 'mechanic' — determines who is broadcasting location */
  viewerRole: 'customer' | 'mechanic';
}

export const LiveTrackingMap = ({
  serviceRequestId,
  customerLocation,
  mechanicId,
  customerName = 'Customer',
  mechanicName = 'Mechanic',
  viewerRole,
}: LiveTrackingMapProps) => {
  const [mechanicLocation, setMechanicLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const watchIdRef = useRef<number | null>(null);
  const channelRef = useRef<any>(null);

  // Fetch mechanic's initial location from mechanic_shops
  useEffect(() => {
    if (!mechanicId) return;
    
    const fetchMechanicLocation = async () => {
      const { data } = await supabase
        .from('mechanic_shops')
        .select('latitude, longitude')
        .eq('mechanic_id', mechanicId)
        .maybeSingle();
      
      if (data?.latitude && data?.longitude) {
        setMechanicLocation({ lat: Number(data.latitude), lng: Number(data.longitude) });
      }
      setLoading(false);
    };
    
    fetchMechanicLocation();
  }, [mechanicId]);

  // Subscribe to realtime location broadcasts via Supabase Realtime Broadcast
  useEffect(() => {
    const channel = supabase
      .channel(`tracking-${serviceRequestId}`)
      .on('broadcast', { event: 'location-update' }, (payload) => {
        const { role, lat, lng } = payload.payload;
        if (role === 'mechanic' && viewerRole === 'customer') {
          setMechanicLocation({ lat, lng });
        }
        if (role === 'customer' && viewerRole === 'mechanic') {
          // Update customer location for mechanic view
          setMyLocation({ lat, lng });
        }
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, [serviceRequestId, viewerRole]);

  // Broadcast own location continuously
  useEffect(() => {
    if (!navigator.geolocation) return;

    const broadcastLocation = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      const loc = { lat: latitude, lng: longitude };
      
      if (viewerRole === 'mechanic') {
        setMechanicLocation(loc);
        // Also update mechanic_shops table for persistence
        if (mechanicId) {
          supabase.from('mechanic_shops').update({
            latitude: latitude,
            longitude: longitude,
          }).eq('mechanic_id', mechanicId).then();
        }
      } else {
        setMyLocation(loc);
      }

      // Broadcast via realtime
      channelRef.current?.send({
        type: 'broadcast',
        event: 'location-update',
        payload: { role: viewerRole, lat: latitude, lng: longitude },
      });
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      broadcastLocation,
      (err) => console.error('Geolocation error:', err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [viewerRole, mechanicId, serviceRequestId]);

  // Determine displayed positions
  const custPos = viewerRole === 'customer' ? myLocation || customerLocation : customerLocation || myLocation;
  const mechPos = mechanicLocation;

  const positions: [number, number][] = [];
  if (custPos) positions.push([custPos.lat, custPos.lng]);
  if (mechPos) positions.push([mechPos.lat, mechPos.lng]);

  const center: [number, number] = positions.length > 0
    ? positions[0]
    : [20.5937, 78.9629]; // Default India center

  if (loading && !custPos && !mechPos) {
    return (
      <div className="flex items-center justify-center h-64 bg-secondary/30 rounded-xl">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden border border-border shadow-lg"
    >
      {/* Map Header */}
      <div className="bg-card px-4 py-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <Navigation className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Live Tracking</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }} />
            Customer
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }} />
            Mechanic
          </span>
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={14}
        style={{ height: '300px', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapBoundsUpdater positions={positions} />

        {custPos && (
          <Marker position={[custPos.lat, custPos.lng]} icon={customerIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold">{customerName}</p>
                <p className="text-xs text-gray-500">Customer Location</p>
              </div>
            </Popup>
          </Marker>
        )}

        {mechPos && (
          <Marker position={[mechPos.lat, mechPos.lng]} icon={mechanicIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold">{mechanicName}</p>
                <p className="text-xs text-gray-500">Mechanic Location</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Status footer */}
      <div className="bg-card px-4 py-2 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Live tracking active
          </span>
          {custPos && mechPos && (
            <span>
              ~{calculateDistance(custPos.lat, custPos.lng, mechPos.lat, mechPos.lng).toFixed(1)} km apart
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Haversine formula for distance
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
