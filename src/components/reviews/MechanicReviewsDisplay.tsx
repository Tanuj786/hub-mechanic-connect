import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { MechanicReviewCard } from './MechanicReviewCard';
import { Star, MessageSquare, ThumbsUp } from 'lucide-react';
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

interface MechanicReviewsDisplayProps {
  mechanicId: string;
  showTitle?: boolean;
  limit?: number;
  compact?: boolean;
}

export const MechanicReviewsDisplay = ({
  mechanicId,
  showTitle = true,
  limit = 5,
  compact = false,
}: MechanicReviewsDisplayProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    positiveCount: 0,
  });

  useEffect(() => {
    fetchReviews();
  }, [mechanicId]);

  const fetchReviews = async () => {
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
        .eq('mechanic_id', mechanicId)
        .order('created_at', { ascending: false })
        .limit(limit);

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
        const positive = transformedReviews.filter((r) => r.rating >= 4).length;

        setStats({
          averageRating: avgRating,
          totalReviews: total,
          positiveCount: positive,
        });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-20 bg-secondary rounded-lg"></div>
        <div className="h-32 bg-secondary rounded-lg"></div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No reviews yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      {showTitle && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
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
            <div>
              <span className="text-lg font-bold">{stats.averageRating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground ml-1">
                ({stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''})
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-success">
            <ThumbsUp className="h-4 w-4" />
            {Math.round((stats.positiveCount / stats.totalReviews) * 100)}% positive
          </div>
        </motion.div>
      )}

      {/* Reviews List */}
      <div className="space-y-3">
        {reviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <MechanicReviewCard review={review} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};
