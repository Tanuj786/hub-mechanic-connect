import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  ChevronDown,
  ChevronUp,
  Download,
  Receipt,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface InvoiceCardProps {
  invoiceId: string;
  invoiceNumber: string;
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: string;
  notes?: string;
  onPayNow?: () => void;
  showDetails?: boolean;
  isLoading?: boolean;
}

export const InvoiceCard = ({
  invoiceId,
  invoiceNumber,
  totalAmount,
  subtotal,
  taxAmount,
  taxRate,
  status,
  createdAt,
  notes,
  onPayNow,
  showDetails = false,
  isLoading = false,
}: InvoiceCardProps) => {
  const [isExpanded, setIsExpanded] = useState(showDetails);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const fetchItems = async () => {
    if (items.length > 0) return;
    
    setLoadingItems(true);
    const { data, error } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: true });
    
    if (!error && data) {
      setItems(data);
    }
    setLoadingItems(false);
  };

  useEffect(() => {
    if (isExpanded && items.length === 0) {
      fetchItems();
    }
  }, [isExpanded]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const statusConfig = {
    pending: {
      label: 'Pending',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      icon: <Clock className="h-4 w-4" />,
    },
    paid: {
      label: 'Paid',
      color: 'text-success',
      bgColor: 'bg-success/10',
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
    cancelled: {
      label: 'Cancelled',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      icon: <FileText className="h-4 w-4" />,
    },
  };

  const config = statusConfig[status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-card rounded-2xl border-2 overflow-hidden transition-all',
        status === 'pending' && 'border-warning/30 shadow-lg shadow-warning/5',
        status === 'paid' && 'border-success/30',
        status === 'cancelled' && 'border-destructive/30 opacity-60'
      )}
    >
      {/* Header */}
      <div className={cn(
        'p-5',
        status === 'pending' && 'bg-gradient-to-r from-warning/5 to-transparent'
      )}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ rotate: 5 }}
              className={cn(
                'w-14 h-14 rounded-xl flex items-center justify-center',
                status === 'pending' ? 'gradient-accent' : 
                status === 'paid' ? 'gradient-success' : 'bg-muted'
              )}
            >
              <Receipt className="h-7 w-7 text-white" />
            </motion.div>
            <div>
              <p className="text-sm text-muted-foreground">Invoice</p>
              <p className="font-bold text-lg">{invoiceNumber}</p>
              <p className="text-xs text-muted-foreground">{formatDate(createdAt)}</p>
            </div>
          </div>

          <div className="text-right">
            <Badge className={cn('gap-1.5 px-3 py-1.5 mb-2', config.bgColor, config.color)}>
              {config.icon}
              {config.label}
            </Badge>
            <motion.p 
              className={cn(
                'text-3xl font-bold',
                status === 'pending' ? 'text-primary' : 'text-foreground'
              )}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              ₹{totalAmount.toFixed(2)}
            </motion.p>
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-3 flex items-center justify-between bg-secondary/30 hover:bg-secondary/50 transition-colors"
      >
        <span className="text-sm font-medium">View Details</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-5 space-y-4">
              {/* Items List */}
              {loadingItems ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground pb-2 border-b">
                    <div className="col-span-6">Description</div>
                    <div className="col-span-2 text-center">Qty</div>
                    <div className="col-span-2 text-right">Rate</div>
                    <div className="col-span-2 text-right">Amount</div>
                  </div>
                  {items.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 text-sm py-2">
                      <div className="col-span-6 font-medium">{item.description}</div>
                      <div className="col-span-2 text-center text-muted-foreground">{item.quantity}</div>
                      <div className="col-span-2 text-right text-muted-foreground">₹{item.unit_price.toFixed(2)}</div>
                      <div className="col-span-2 text-right font-medium">₹{item.total_price.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST ({taxRate}%)</span>
                  <span>₹{taxAmount.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Notes */}
              {notes && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{notes}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Footer */}
      {status === 'pending' && onPayNow && (
        <div className="p-4 bg-gradient-to-r from-accent/10 to-primary/10 border-t">
          <Button
            onClick={onPayNow}
            disabled={isLoading}
            className="w-full gradient-accent text-lg py-6 shadow-lg shadow-accent/20"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <CreditCard className="mr-2 h-5 w-5" />
            )}
            Pay Now - ₹{totalAmount.toFixed(2)}
          </Button>
        </div>
      )}

      {status === 'paid' && (
        <div className="p-4 bg-success/5 border-t border-success/20">
          <div className="flex items-center justify-center gap-2 text-success font-semibold">
            <CheckCircle2 className="h-5 w-5" />
            Payment Completed Successfully
          </div>
        </div>
      )}
    </motion.div>
  );
};
