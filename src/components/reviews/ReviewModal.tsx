import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Star, Loader2, CheckCircle, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceRequestId: string;
  mechanicId: string;
  mechanicName: string;
  onReviewSubmitted?: () => void;
}

const ratingLabels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

export const ReviewModal = ({
  isOpen,
  onClose,
  serviceRequestId,
  mechanicId,
  mechanicName,
  onReviewSubmitted,
}: ReviewModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!user || rating === 0) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('ratings').insert({
        service_request_id: serviceRequestId,
        customer_id: user.id,
        mechanic_id: mechanicId,
        rating,
        review: review.trim() || null,
      });

      if (error) throw error;

      // Send notification to mechanic
      await supabase.from('notifications').insert({
        user_id: mechanicId,
        title: 'New Review Received',
        message: `You received a ${rating}-star review!`,
        type: 'review',
        related_request_id: serviceRequestId,
      });

      setIsSubmitted(true);
      setTimeout(() => {
        onReviewSubmitted?.();
        onClose();
        setIsSubmitted(false);
        setRating(0);
        setReview('');
      }, 2000);

      toast({
        title: 'Review Submitted',
        description: 'Thank you for your feedback!',
      });
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit review. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <AnimatePresence mode="wait">
          {isSubmitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full gradient-success flex items-center justify-center"
              >
                <CheckCircle className="h-10 w-10 text-success-foreground" />
              </motion.div>
              <h3 className="text-2xl font-bold mb-2">Thank You!</h3>
              <p className="text-muted-foreground">Your review helps us improve.</p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <DialogHeader>
                <DialogTitle className="text-xl">Rate Your Experience</DialogTitle>
                <DialogDescription>
                  How was your service with {mechanicName}?
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Star Rating */}
                <div className="text-center">
                  <div className="flex justify-center gap-2 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.button
                        key={star}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        onClick={() => setRating(star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={cn(
                            'h-10 w-10 transition-colors',
                            star <= displayRating
                              ? 'text-warning fill-warning'
                              : 'text-muted-foreground/30'
                          )}
                        />
                      </motion.button>
                    ))}
                  </div>
                  <AnimatePresence mode="wait">
                    {displayRating > 0 && (
                      <motion.p
                        key={displayRating}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="text-lg font-semibold text-foreground"
                      >
                        {ratingLabels[displayRating - 1]}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Quick Tags */}
                {rating > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="overflow-hidden"
                  >
                    <p className="text-sm text-muted-foreground mb-2">Quick feedback:</p>
                    <div className="flex flex-wrap gap-2">
                      {(rating >= 4
                        ? ['Professional', 'Quick Service', 'Fair Price', 'Friendly', 'Expert']
                        : ['Late Arrival', 'Poor Communication', 'Overpriced', 'Incomplete Work', 'Unprofessional']
                      ).map((tag) => (
                        <motion.button
                          key={tag}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setReview((prev) => prev ? `${prev}, ${tag}` : tag)}
                          className={cn(
                            'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                            rating >= 4
                              ? 'bg-success/10 text-success hover:bg-success/20 border border-success/30'
                              : 'bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30'
                          )}
                        >
                          <ThumbsUp className="h-3 w-3 inline mr-1" />
                          {tag}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Written Review */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Write a review (optional)</label>
                  <Textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Share your experience..."
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Skip
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={rating === 0 || isSubmitting}
                  className="flex-1 gradient-primary"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Review'
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
