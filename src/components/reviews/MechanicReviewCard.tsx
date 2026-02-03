import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Calendar, MessageSquareReply, Reply } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  rating: number;
  review: string | null;
  created_at: string;
  mechanic_response: string | null;
  mechanic_response_at: string | null;
  customer: {
    full_name: string;
    avatar_url: string | null;
  };
  service_type: {
    name: string;
  };
}

interface MechanicReviewCardProps {
  review: Review;
  showResponseButton?: boolean;
  onRespond?: (review: Review) => void;
}

const getRatingLabel = (rating: number) => {
  const labels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
  return labels[rating - 1] || '';
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const MechanicReviewCard = ({
  review,
  showResponseButton = false,
  onRespond,
}: MechanicReviewCardProps) => {
  return (
    <div className="p-5 bg-card rounded-xl border border-border hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* Avatar */}
        <Avatar className="h-12 w-12">
          <AvatarImage src={review.customer.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {review.customer.full_name?.charAt(0)?.toUpperCase() || 'C'}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold">{review.customer.full_name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        'h-4 w-4',
                        star <= review.rating
                          ? 'text-warning fill-warning'
                          : 'text-muted-foreground/30'
                      )}
                    />
                  ))}
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-xs',
                    review.rating >= 4
                      ? 'bg-success/10 text-success'
                      : review.rating >= 3
                      ? 'bg-warning/10 text-warning'
                      : 'bg-destructive/10 text-destructive'
                  )}
                >
                  {getRatingLabel(review.rating)}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="mb-1">
                {review.service_type?.name || 'Service'}
              </Badge>
              <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                <Calendar className="h-3 w-3" />
                {formatDate(review.created_at)}
              </p>
            </div>
          </div>

          {review.review && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mt-3 text-muted-foreground bg-secondary/50 rounded-lg p-3"
            >
              "{review.review}"
            </motion.p>
          )}

          {/* Mechanic Response */}
          {review.mechanic_response && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 ml-4 pl-4 border-l-2 border-primary/30"
            >
              <div className="flex items-center gap-2 mb-1">
                <Reply className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Mechanic's Response</span>
                <span className="text-xs text-muted-foreground">
                  {review.mechanic_response_at && formatDate(review.mechanic_response_at)}
                </span>
              </div>
              <p className="text-sm text-foreground">{review.mechanic_response}</p>
            </motion.div>
          )}

          {/* Response Button */}
          {showResponseButton && !review.mechanic_response && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRespond?.(review)}
                className="text-xs"
              >
                <MessageSquareReply className="h-3 w-3 mr-1" />
                Respond to Review
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
