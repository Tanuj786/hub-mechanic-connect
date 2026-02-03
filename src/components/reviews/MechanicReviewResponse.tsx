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
import { MessageSquareReply, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MechanicReviewResponseProps {
  isOpen: boolean;
  onClose: () => void;
  reviewId: string;
  customerName: string;
  reviewText: string;
  existingResponse?: string | null;
  onResponseSubmitted?: () => void;
}

export const MechanicReviewResponse = ({
  isOpen,
  onClose,
  reviewId,
  customerName,
  reviewText,
  existingResponse,
  onResponseSubmitted,
}: MechanicReviewResponseProps) => {
  const { toast } = useToast();
  const [response, setResponse] = useState(existingResponse || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!response.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('ratings')
        .update({
          mechanic_response: response.trim(),
          mechanic_response_at: new Date().toISOString(),
        })
        .eq('id', reviewId);

      if (error) throw error;

      setIsSubmitted(true);
      setTimeout(() => {
        onResponseSubmitted?.();
        onClose();
        setIsSubmitted(false);
      }, 1500);

      toast({
        title: 'Response Submitted',
        description: 'Your response has been posted.',
      });
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/20 flex items-center justify-center"
              >
                <CheckCircle className="h-10 w-10 text-success" />
              </motion.div>
              <h3 className="text-2xl font-bold mb-2">Response Posted!</h3>
              <p className="text-muted-foreground">Your customer will see your response.</p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <MessageSquareReply className="h-5 w-5 text-primary" />
                  Respond to Review
                </DialogTitle>
                <DialogDescription>
                  Reply to {customerName}'s feedback
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Original Review */}
                <div className="bg-secondary/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Customer Review:</p>
                  <p className="text-foreground italic">"{reviewText || 'No written review'}"</p>
                </div>

                {/* Response Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Response</label>
                  <Textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Thank you for your feedback..."
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Be professional and courteous. This will be visible to all users.
                  </p>
                </div>

                {/* Quick Responses */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Quick responses:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Thank you for your kind feedback!',
                      'We appreciate your business!',
                      'Thank you for choosing us!',
                    ].map((quick) => (
                      <Button
                        key={quick}
                        variant="outline"
                        size="sm"
                        onClick={() => setResponse(quick)}
                        className="text-xs"
                      >
                        {quick}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!response.trim() || isSubmitting}
                  className="flex-1 gradient-primary"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <MessageSquareReply className="mr-2 h-4 w-4" />
                      Post Response
                    </>
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
