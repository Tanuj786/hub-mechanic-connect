import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  FileText, 
  Check, 
  Loader2,
  IndianRupee,
  ShieldCheck,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Invoice {
  id: string;
  invoice_number: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  notes: string | null;
  created_at: string;
  mechanic: {
    full_name: string;
  };
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface RazorpayPaymentProps {
  invoiceId: string;
  onPaymentSuccess?: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const RazorpayPayment = ({ invoiceId, onPaymentSuccess }: RazorpayPaymentProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchInvoice();
    loadRazorpayScript();
  }, [invoiceId]);

  const loadRazorpayScript = () => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  };

  const fetchInvoice = async () => {
    try {
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*, mechanic:profiles!mechanic_id(full_name)')
        .eq('id', invoiceId)
        .single();

      if (invoiceError) throw invoiceError;
      setInvoice(invoiceData as unknown as Invoice);

      const { data: itemsData, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId);

      if (itemsError) throw itemsError;
      setItems(itemsData || []);
    } catch (error) {
      console.error('Error fetching invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async () => {
    if (!invoice || !user) return;

    setProcessing(true);

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Create Razorpay order via edge function
      const response = await supabase.functions.invoke('create-razorpay-order', {
        body: { invoice_id: invoiceId },
      });

      if (response.error) throw new Error(response.error.message);

      const { order_id, amount, currency, key_id } = response.data;

      // Open Razorpay checkout
      const options = {
        key: key_id,
        amount: amount,
        currency: currency,
        name: 'MechanicQ',
        description: `Payment for Invoice ${invoice.invoice_number}`,
        order_id: order_id,
        handler: async (response: any) => {
          try {
            // Verify payment via edge function
            const verifyResponse = await supabase.functions.invoke('verify-razorpay-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                invoice_id: invoiceId,
              },
            });

            if (verifyResponse.error) throw new Error(verifyResponse.error.message);

            toast({
              title: 'Payment Successful!',
              description: 'Your payment has been processed successfully.',
            });

            setInvoice({ ...invoice, status: 'paid' });
            onPaymentSuccess?.();
          } catch (error: any) {
            toast({
              title: 'Verification Failed',
              description: error.message || 'Payment verification failed',
              variant: 'destructive',
            });
          }
        },
        prefill: {
          name: user.user_metadata?.full_name || '',
          email: user.email || '',
          contact: user.user_metadata?.phone_number || '',
        },
        theme: {
          color: '#2563eb',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'Failed to initiate payment',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!invoice) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Invoice not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="gradient-primary text-primary-foreground">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice {invoice.invoice_number}
            </CardTitle>
            <Badge 
              variant={invoice.status === 'paid' ? 'default' : 'secondary'}
              className={invoice.status === 'paid' ? 'bg-success text-success-foreground' : ''}
            >
              {invoice.status === 'paid' ? (
                <><Check className="h-3 w-3 mr-1" /> Paid</>
              ) : (
                'Pending'
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Mechanic Info */}
          <div className="bg-secondary/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">From:</p>
            <p className="font-semibold">{invoice.mechanic.full_name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(invoice.created_at).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <h4 className="font-semibold">Services</h4>
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b border-border/50">
                <div>
                  <p className="font-medium">{item.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity} × ₹{item.unit_price.toFixed(2)}
                  </p>
                </div>
                <p className="font-medium">₹{item.total_price.toFixed(2)}</p>
              </div>
            ))}
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{invoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GST ({invoice.tax_rate}%)</span>
              <span>₹{invoice.tax_amount.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-xl font-bold">
              <span>Total</span>
              <span className="text-primary flex items-center">
                <IndianRupee className="h-5 w-5" />
                {invoice.total_amount.toFixed(2)}
              </span>
            </div>
          </div>

          {invoice.notes && (
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-sm text-muted-foreground">{invoice.notes}</p>
            </div>
          )}

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-success" />
            Secured by Razorpay
          </div>
        </CardContent>
        
        {invoice.status !== 'paid' && (
          <CardFooter className="bg-secondary/30 p-4">
            <Button
              onClick={initiatePayment}
              disabled={processing}
              className="w-full gradient-accent text-accent-foreground text-lg py-6"
            >
              {processing ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <CreditCard className="h-5 w-5 mr-2" />
              )}
              Pay ₹{invoice.total_amount.toFixed(2)}
            </Button>
          </CardFooter>
        )}

        {invoice.status === 'paid' && (
          <CardFooter className="bg-success/10 p-4">
            <div className="w-full text-center">
              <Check className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="font-semibold text-success">Payment Complete</p>
              <p className="text-sm text-muted-foreground">Thank you for your payment!</p>
            </div>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
};