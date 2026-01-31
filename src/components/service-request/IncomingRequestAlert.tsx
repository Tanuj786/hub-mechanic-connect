import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { 
  MapPin, 
  Clock, 
  Car, 
  Bike, 
  Zap, 
  Battery, 
  CircleDot, 
  Settings,
  Phone,
  CheckCircle,
  X,
  Navigation,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IncomingRequest {
  id: string;
  serviceName: string;
  customerName: string;
  customerPhone?: string;
  address: string;
  vehicleType: string;
  description?: string;
  estimatedDistance?: string;
  createdAt: string;
}

interface IncomingRequestAlertProps {
  request: IncomingRequest | null;
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
  isLoading?: boolean;
  timeoutSeconds?: number;
}

const vehicleIcons: Record<string, any> = {
  car: Car,
  bike: Bike,
  electric: Zap,
  battery: Battery,
  tyre: CircleDot,
  general: Settings,
};

export const IncomingRequestAlert = ({
  request,
  onAccept,
  onReject,
  isLoading = false,
  timeoutSeconds = 30,
}: IncomingRequestAlertProps) => {
  const [timeLeft, setTimeLeft] = useState(timeoutSeconds);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (request) {
      setIsOpen(true);
      setTimeLeft(timeoutSeconds);
    } else {
      setIsOpen(false);
    }
  }, [request, timeoutSeconds]);

  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Auto-reject on timeout
          if (request) {
            onReject(request.id);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeLeft, request, onReject]);

  if (!request) return null;

  const VehicleIcon = vehicleIcons[request.vehicleType] || Settings;
  const progress = (timeLeft / timeoutSeconds) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md p-0 overflow-hidden [&>button]:hidden">
        {/* Timer Progress Bar */}
        <div className="h-1.5 bg-secondary">
          <motion.div
            className={cn(
              'h-full transition-colors',
              timeLeft > 10 ? 'bg-primary' : 'bg-destructive'
            )}
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="p-6">
          {/* Header with Animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center mb-6"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-20 h-20 mx-auto mb-4 rounded-full gradient-accent flex items-center justify-center shadow-lg"
            >
              <Navigation className="h-10 w-10 text-accent-foreground" />
            </motion.div>
            <h2 className="text-2xl font-bold">New Service Request!</h2>
            <Badge variant="secondary" className="mt-2">
              <Clock className="h-3 w-3 mr-1" />
              {timeLeft}s remaining
            </Badge>
          </motion.div>

          {/* Request Details */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <VehicleIcon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold">{request.serviceName}</h3>
                <p className="text-sm text-muted-foreground capitalize">{request.vehicleType} Service</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center mt-0.5">
                  <MapPin className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{request.address}</p>
                  {request.estimatedDistance && (
                    <Badge variant="outline" className="mt-1">{request.estimatedDistance} away</Badge>
                  )}
                </div>
              </div>

              {request.description && (
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <p className="text-sm text-muted-foreground mb-1">Issue Description:</p>
                  <p className="text-sm">{request.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onReject(request.id)}
              disabled={isLoading}
              className="flex-1 py-6 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/50"
            >
              <X className="mr-2 h-5 w-5" />
              Decline
            </Button>
            <Button
              onClick={() => onAccept(request.id)}
              disabled={isLoading}
              className="flex-1 py-6 gradient-success text-lg"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-success-foreground border-t-transparent rounded-full"
                />
              ) : (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Accept
                </>
              )}
            </Button>
          </div>

          {/* Quick Actions */}
          {request.customerPhone && (
            <div className="mt-4 pt-4 border-t border-border">
              <Button
                variant="ghost"
                onClick={() => window.open(`tel:${request.customerPhone}`)}
                className="w-full"
              >
                <Phone className="mr-2 h-4 w-4" />
                Call Customer First
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
