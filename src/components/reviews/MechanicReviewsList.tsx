import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatedCard, StaggerContainer, StaggerItem } from '@/components/ui/animated-card';
import { Star, MessageSquare, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MechanicReviewCard } from './MechanicReviewCard';
import { MechanicReviewResponse } from './MechanicReviewResponse';

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

export const MechanicReviewsList = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: [0, 0, 0, 0, 0],
  });

  useEffect(() => {
    if (user) {
      fetchReviews();
    }
  }, [user]);

  const fetchReviews = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('ratings')
        .select(`
          id,
          rating,
          review,
          created_at,
          mechanic_response,
          mechanic_response_at,
          customer:profiles!customer_id(full_name, avatar_url),
          service_request:service_requests!service_request_id(
            service_type:service_types(name)
          )
        `)
        .eq('mechanic_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedReviews = (data || []).map((r: any) => ({
        id: r.id,
        rating: r.rating,
        review: r.review,
        created_at: r.created_at,
        mechanic_response: r.mechanic_response,
        mechanic_response_at: r.mechanic_response_at,
        customer: r.customer,
        service_type: r.service_request?.service_type || { name: 'Service' },
      }));

      setReviews(transformedReviews);

      // Calculate stats
      if (transformedReviews.length > 0) {
        const total = transformedReviews.length;
        const avgRating = transformedReviews.reduce((sum, r) => sum + r.rating, 0) / total;
        const distribution = [0, 0, 0, 0, 0];
        transformedReviews.forEach((r) => {
          distribution[r.rating - 1]++;
        });

        setStats({
          averageRating: avgRating,
          totalReviews: total,
          ratingDistribution: distribution,
        });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = (review: Review) => {
    setSelectedReview(review);
    setShowResponseModal(true);
  };

  const handleResponseSubmitted = () => {
    fetchReviews();
    setShowResponseModal(false);
    setSelectedReview(null);
  };

  if (loading) {
    return (
      <AnimatedCard className="p-12 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"
        />
      </AnimatedCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Average Rating Card */}
        <AnimatedCard className="p-6">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="text-5xl font-bold text-primary"
              >
                {stats.averageRating.toFixed(1)}
              </motion.div>
              <div className="flex justify-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'h-5 w-5',
                      star <= Math.round(stats.averageRating)
                        ? 'text-warning fill-warning'
                        : 'text-muted-foreground/30'
                    )}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.ratingDistribution[rating - 1];
                const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center gap-2 text-sm">
                    <span className="w-3">{rating}</span>
                    <Star className="h-3 w-3 text-warning fill-warning" />
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: 0.3 + rating * 0.1, duration: 0.5 }}
                        className="h-full bg-warning rounded-full"
                      />
                    </div>
                    <span className="w-8 text-right text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </AnimatedCard>

        {/* Quick Stats */}
        <AnimatedCard delay={0.1} className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <ThumbsUp className="h-5 w-5 text-success" />
            Review Highlights
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-success/10 rounded-xl">
              <p className="text-2xl font-bold text-success">
                {reviews.filter((r) => r.rating >= 4).length}
              </p>
              <p className="text-sm text-muted-foreground">Positive Reviews</p>
            </div>
            <div className="text-center p-4 bg-primary/10 rounded-xl">
              <p className="text-2xl font-bold text-primary">
                {reviews.filter((r) => r.mechanic_response).length}
              </p>
              <p className="text-sm text-muted-foreground">Responded</p>
            </div>
          </div>
        </AnimatedCard>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <AnimatedCard delay={0.2} className="p-12 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring' }}
          >
            <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          </motion.div>
          <h3 className="text-xl font-semibold mb-2">No Reviews Yet</h3>
          <p className="text-muted-foreground">
            Complete jobs to start receiving reviews from customers.
          </p>
        </AnimatedCard>
      ) : (
        <StaggerContainer className="space-y-4">
          {reviews.map((review, index) => (
            <StaggerItem key={review.id}>
              <AnimatedCard delay={0.2 + index * 0.05} className="p-0 overflow-hidden">
                <MechanicReviewCard
                  review={review}
                  showResponseButton={true}
                  onRespond={handleRespond}
                />
              </AnimatedCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {/* Response Modal */}
      {selectedReview && (
        <MechanicReviewResponse
          isOpen={showResponseModal}
          onClose={() => {
            setShowResponseModal(false);
            setSelectedReview(null);
          }}
          reviewId={selectedReview.id}
          customerName={selectedReview.customer.full_name}
          reviewText={selectedReview.review || ''}
          existingResponse={selectedReview.mechanic_response}
          onResponseSubmitted={handleResponseSubmitted}
        />
      )}
    </div>
  );
};
