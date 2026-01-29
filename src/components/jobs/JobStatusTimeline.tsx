import { motion } from 'framer-motion';
import { 
  Clock, 
  Check, 
  Play, 
  Camera, 
  CreditCard, 
  CheckCircle2,
  Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type TimelineStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'paid';

interface TimelineStep {
  id: TimelineStatus;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

const steps: TimelineStep[] = [
  { id: 'pending', label: 'Request Sent', icon: <Clock className="h-4 w-4" />, description: 'Waiting for mechanic' },
  { id: 'accepted', label: 'Accepted', icon: <Check className="h-4 w-4" />, description: 'Mechanic is on the way' },
  { id: 'in_progress', label: 'In Progress', icon: <Play className="h-4 w-4" />, description: 'Work started' },
  { id: 'completed', label: 'Completed', icon: <Camera className="h-4 w-4" />, description: 'Work finished' },
  { id: 'paid', label: 'Paid', icon: <CreditCard className="h-4 w-4" />, description: 'Payment complete' },
];

const statusOrder: TimelineStatus[] = ['pending', 'accepted', 'in_progress', 'completed', 'paid'];

interface JobStatusTimelineProps {
  currentStatus: TimelineStatus;
  orientation?: 'horizontal' | 'vertical';
  showDescriptions?: boolean;
  compact?: boolean;
}

export const JobStatusTimeline = ({
  currentStatus,
  orientation = 'horizontal',
  showDescriptions = true,
  compact = false,
}: JobStatusTimelineProps) => {
  const currentIndex = statusOrder.indexOf(currentStatus);

  const getStepState = (stepId: TimelineStatus): 'completed' | 'active' | 'upcoming' => {
    const stepIndex = statusOrder.indexOf(stepId);
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'upcoming';
  };

  if (orientation === 'vertical') {
    return (
      <div className={cn('relative', compact ? 'space-y-3' : 'space-y-6')}>
        {steps.map((step, index) => {
          const state = getStepState(step.id);
          
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex items-start gap-4"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div 
                  className={cn(
                    'absolute left-5 top-10 w-0.5 h-full -translate-x-1/2',
                    state === 'completed' ? 'bg-success' : 'bg-border'
                  )}
                />
              )}

              {/* Step Circle */}
              <motion.div
                animate={state === 'active' ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1.5, repeat: state === 'active' ? Infinity : 0 }}
                className={cn(
                  'relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300',
                  state === 'completed' && 'bg-success text-success-foreground',
                  state === 'active' && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                  state === 'upcoming' && 'bg-muted text-muted-foreground'
                )}
              >
                {state === 'completed' ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  step.icon
                )}
              </motion.div>

              {/* Step Content */}
              <div className="flex-1 pt-1">
                <p className={cn(
                  'font-semibold',
                  state === 'active' && 'text-primary',
                  state === 'upcoming' && 'text-muted-foreground'
                )}>
                  {step.label}
                </p>
                {showDescriptions && step.description && (
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  }

  // Horizontal Timeline
  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const state = getStepState(step.id);
          
          return (
            <div key={step.id} className="flex-1 flex flex-col items-center relative">
              {/* Connector */}
              {index < steps.length - 1 && (
                <div 
                  className={cn(
                    'absolute top-5 left-1/2 w-full h-0.5',
                    state === 'completed' ? 'bg-success' : 'bg-border'
                  )}
                />
              )}

              {/* Step Circle */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1, type: 'spring' }}
                className="relative z-10"
              >
                <motion.div
                  animate={state === 'active' ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 2, repeat: state === 'active' ? Infinity : 0 }}
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                    state === 'completed' && 'bg-success text-success-foreground',
                    state === 'active' && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                    state === 'upcoming' && 'bg-muted text-muted-foreground border-2 border-dashed border-muted-foreground/30'
                  )}
                >
                  {state === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : state === 'upcoming' ? (
                    <Circle className="h-4 w-4" />
                  ) : (
                    step.icon
                  )}
                </motion.div>
              </motion.div>

              {/* Label */}
              <div className="mt-3 text-center">
                <p className={cn(
                  'text-xs font-medium',
                  state === 'active' && 'text-primary',
                  state === 'upcoming' && 'text-muted-foreground'
                )}>
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Compact inline status indicator
export const StatusIndicator = ({ status }: { status: TimelineStatus }) => {
  const currentIndex = statusOrder.indexOf(status);
  
  return (
    <div className="flex items-center gap-1">
      {steps.slice(0, 4).map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        
        return (
          <motion.div
            key={step.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              'w-2 h-2 rounded-full transition-all',
              isCompleted && 'bg-success',
              isActive && 'bg-primary w-4',
              !isCompleted && !isActive && 'bg-muted'
            )}
          />
        );
      })}
    </div>
  );
};
