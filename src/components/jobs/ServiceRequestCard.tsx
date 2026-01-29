import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  MapPin, 
  Phone, 
  MessageSquare, 
  Check, 
  Play, 
  Camera, 
  FileText,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  Car,
  Wrench,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type JobStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export interface ServiceRequestCardProps {
  id: string;
  status: JobStatus;
  serviceName: string;
  customerName: string;
  customerPhone?: string;
  address: string;
  description?: string;
  vehicleType?: string;
  createdAt: string;
  estimatedCost?: number;
  customerMedia?: { url: string; type: 'image' | 'video' }[];
  // Mechanic actions
  onAccept?: () => void;
  onReject?: () => void;
  onStartJob?: () => void;
  onCompleteJob?: () => void;
  onOpenChat?: () => void;
  onCall?: () => void;
  // Loading states
  isAccepting?: boolean;
  isStarting?: boolean;
  // View mode
  viewMode?: 'mechanic' | 'customer';
}

const statusConfig: Record<JobStatus, { 
  label: string; 
  color: string; 
  bgColor: string; 
  borderColor: string;
  icon: React.ReactNode;
}> = {
  pending: { 
    label: 'Pending', 
    color: 'text-warning', 
    bgColor: 'bg-warning/10', 
    borderColor: 'border-warning/30',
    icon: <Clock className="h-4 w-4" />
  },
  accepted: { 
    label: 'Accepted', 
    color: 'text-primary', 
    bgColor: 'bg-primary/10', 
    borderColor: 'border-primary/30',
    icon: <Check className="h-4 w-4" />
  },
  in_progress: { 
    label: 'In Progress', 
    color: 'text-accent', 
    bgColor: 'bg-accent/10', 
    borderColor: 'border-accent/30',
    icon: <Wrench className="h-4 w-4 animate-pulse" />
  },
  completed: { 
    label: 'Completed', 
    color: 'text-success', 
    bgColor: 'bg-success/10', 
    borderColor: 'border-success/30',
    icon: <CheckCircle2 className="h-4 w-4" />
  },
  cancelled: { 
    label: 'Cancelled', 
    color: 'text-destructive', 
    bgColor: 'bg-destructive/10', 
    borderColor: 'border-destructive/30',
    icon: <X className="h-4 w-4" />
  },
};

export const ServiceRequestCard = ({
  id,
  status,
  serviceName,
  customerName,
  customerPhone,
  address,
  description,
  vehicleType,
  createdAt,
  estimatedCost,
  customerMedia = [],
  onAccept,
  onReject,
  onStartJob,
  onCompleteJob,
  onOpenChat,
  onCall,
  isAccepting = false,
  isStarting = false,
  viewMode = 'mechanic',
}: ServiceRequestCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = statusConfig[status];
  
  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        'relative overflow-hidden rounded-2xl border-2 bg-card transition-all duration-300',
        config.borderColor,
        'hover:shadow-lg hover:shadow-primary/5',
        status === 'in_progress' && 'ring-2 ring-accent/20'
      )}
    >
      {/* Status Indicator Bar */}
      <motion.div 
        className={cn('h-1.5', config.bgColor)}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        style={{ transformOrigin: 'left' }}
      />

      <div className="p-5">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                config.bgColor
              )}
            >
              <Car className={cn('h-6 w-6', config.color)} />
            </motion.div>
            <div>
              <h3 className="font-bold text-lg leading-tight">{serviceName}</h3>
              {vehicleType && (
                <span className="text-sm text-muted-foreground capitalize">
                  {vehicleType} Service
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              className={cn(
                'gap-1.5 px-3 py-1.5 rounded-full font-medium',
                config.bgColor, 
                config.color
              )}
            >
              {config.icon}
              {config.label}
            </Badge>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {timeAgo(createdAt)}
            </span>
          </div>
        </div>

        {/* Customer Info */}
        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-secondary/50">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {customerName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{customerName}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{address}</span>
            </p>
          </div>
          {customerPhone && viewMode === 'mechanic' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onCall}
              className="flex-shrink-0 hover:bg-primary/10"
            >
              <Phone className="h-5 w-5 text-primary" />
            </Button>
          )}
        </div>

        {/* Description (Expandable) */}
        {description && (
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-left mb-4"
          >
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Issue Description</span>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p className="text-sm text-muted-foreground p-3 pt-2">
                    {description}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        )}

        {/* Customer Media Preview */}
        {customerMedia.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Customer Photos/Videos
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {customerMedia.map((media, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-border"
                >
                  {media.type === 'image' ? (
                    <img 
                      src={media.url} 
                      alt={`Media ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video 
                      src={media.url}
                      className="w-full h-full object-cover"
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Estimated Cost */}
        {estimatedCost && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-success/5 border border-success/20 mb-4">
            <span className="text-sm font-medium">Estimated Cost</span>
            <span className="text-lg font-bold text-success">₹{estimatedCost.toFixed(0)}</span>
          </div>
        )}

        {/* Action Buttons - Mechanic View */}
        {viewMode === 'mechanic' && (
          <div className="space-y-3">
            {status === 'pending' && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onReject}
                  className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                  disabled={isAccepting}
                >
                  <X className="mr-2 h-4 w-4" />
                  Decline
                </Button>
                <Button
                  onClick={onAccept}
                  className="flex-1 gradient-success"
                  disabled={isAccepting}
                >
                  {isAccepting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Accept Job
                </Button>
              </div>
            )}

            {status === 'accepted' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <Button
                  onClick={onStartJob}
                  className="w-full gradient-accent text-lg py-6"
                  disabled={isStarting}
                >
                  {isStarting ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Play className="mr-2 h-5 w-5" />
                  )}
                  Start Job
                </Button>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={onOpenChat} className="flex-1">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Chat
                  </Button>
                  <Button variant="outline" onClick={onCall} className="flex-1">
                    <Phone className="mr-2 h-4 w-4" />
                    Call
                  </Button>
                </div>
              </motion.div>
            )}

            {status === 'in_progress' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <Button
                  onClick={onCompleteJob}
                  className="w-full gradient-primary text-lg py-6"
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Upload Photos & Complete
                </Button>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={onOpenChat} className="flex-1">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Chat
                  </Button>
                  <Button variant="outline" onClick={onCall} className="flex-1">
                    <Phone className="mr-2 h-4 w-4" />
                    Call
                  </Button>
                </div>
              </motion.div>
            )}

            {status === 'completed' && (
              <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-success/10 text-success">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">Job Completed Successfully</span>
              </div>
            )}
          </div>
        )}

        {/* Customer View Actions */}
        {viewMode === 'customer' && status !== 'pending' && status !== 'cancelled' && (
          <div className="flex gap-3">
            <Button variant="outline" onClick={onOpenChat} className="flex-1">
              <MessageSquare className="mr-2 h-4 w-4" />
              Chat with Mechanic
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
