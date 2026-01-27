import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Wrench, ArrowLeft, Loader2, Mail } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
});

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = emailSchema.safeParse({ email });
    if (!validation.success) {
      toast({
        title: 'Validation Error',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setSent(true);
      toast({
        title: 'Email Sent!',
        description: 'Check your inbox for password reset instructions.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/customer/login" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Login
        </Link>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 gradient-primary rounded-full flex items-center justify-center mb-4">
              {sent ? <Mail className="h-6 w-6 text-primary-foreground" /> : <Wrench className="h-6 w-6 text-primary-foreground" />}
            </div>
            <CardTitle className="text-2xl">
              {sent ? 'Check Your Email' : 'Forgot Password'}
            </CardTitle>
            <CardDescription>
              {sent 
                ? 'We\'ve sent you a password reset link' 
                : 'Enter your email to receive a reset link'}
            </CardDescription>
          </CardHeader>
          {!sent ? (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-field"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full gradient-primary" 
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
              </CardFooter>
            </form>
          ) : (
            <CardFooter className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground text-center">
                Didn't receive the email? Check your spam folder or
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setSent(false)}
              >
                Try Again
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
