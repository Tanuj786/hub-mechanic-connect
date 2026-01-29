import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  Camera, 
  FileText, 
  Check, 
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { WorkMediaUpload } from '@/components/media/WorkMediaUpload';
import { InvoiceGenerator } from '@/components/invoice/InvoiceGenerator';
import { cn } from '@/lib/utils';

interface JobCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceRequestId: string;
  customerId: string;
  customerName: string;
  onComplete: (invoiceId: string) => void;
}

type Step = 'media' | 'invoice';

const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: 'media', label: 'Upload Photos', icon: <Camera className="h-5 w-5" /> },
  { id: 'invoice', label: 'Generate Invoice', icon: <FileText className="h-5 w-5" /> },
];

export const JobCompletionModal = ({
  isOpen,
  onClose,
  serviceRequestId,
  customerId,
  customerName,
  onComplete,
}: JobCompletionModalProps) => {
  const [currentStep, setCurrentStep] = useState<Step>('media');
  const [isCompleting, setIsCompleting] = useState(false);

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const goToNext = () => {
    if (currentStep === 'media') {
      setCurrentStep('invoice');
    }
  };

  const goToPrevious = () => {
    if (currentStep === 'invoice') {
      setCurrentStep('media');
    }
  };

  const handleInvoiceCreated = async (invoiceId: string) => {
    setIsCompleting(true);
    try {
      await onComplete(invoiceId);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleClose = () => {
    setCurrentStep('media');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl">Complete Job</DialogTitle>
          
          {/* Step Indicator */}
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <motion.div
                    animate={{ 
                      scale: currentStep === step.id ? 1.1 : 1,
                    }}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-full transition-colors',
                      currentStep === step.id 
                        ? 'bg-primary text-primary-foreground' 
                        : index < currentStepIndex 
                          ? 'bg-success/20 text-success'
                          : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {index < currentStepIndex ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      step.icon
                    )}
                    <span className="font-medium text-sm">{step.label}</span>
                  </motion.div>
                  
                  {index < steps.length - 1 && (
                    <ChevronRight className="h-5 w-5 mx-2 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4">
          <AnimatePresence mode="wait">
            {currentStep === 'media' && (
              <motion.div
                key="media"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="space-y-4">
                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Camera className="h-5 w-5 text-primary" />
                      Document Your Work
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Upload "Before", "During", and "After" photos to document the service. 
                      This helps build trust with customers and creates a record of your work.
                    </p>
                  </div>
                  
                  <WorkMediaUpload serviceRequestId={serviceRequestId} />
                </div>
              </motion.div>
            )}

            {currentStep === 'invoice' && (
              <motion.div
                key="invoice"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <InvoiceGenerator
                  serviceRequestId={serviceRequestId}
                  customerId={customerId}
                  customerName={customerName}
                  onInvoiceCreated={handleInvoiceCreated}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="border-t pt-4 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={currentStep === 'media' ? handleClose : goToPrevious}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            {currentStep === 'media' ? 'Cancel' : 'Back'}
          </Button>

          {currentStep === 'media' && (
            <Button onClick={goToNext} className="gradient-accent">
              Continue to Invoice
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {/* Invoice step has its own submit button in InvoiceGenerator */}
        </div>
      </DialogContent>
    </Dialog>
  );
};
