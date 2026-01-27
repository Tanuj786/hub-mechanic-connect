import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Wrench, ArrowLeft, Loader2, ArrowRight, MapPin } from 'lucide-react';
import { z } from 'zod';

const shopSchema = z.object({
  shopName: z.string().trim().min(2, 'Shop name must be at least 2 characters').max(100),
  shopDescription: z.string().trim().max(500).optional(),
  gstNumber: z.string().trim().max(20).optional(),
  shopAddress: z.string().trim().min(5, 'Address must be at least 5 characters').max(200),
  whatsappNumber: z.string().trim().min(10, 'WhatsApp number must be at least 10 digits').max(15),
  hourlyRate: z.number().min(0, 'Hourly rate must be positive'),
  yearsOfExperience: z.number().min(0, 'Experience must be positive').max(50),
});

const ShopDetails = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const [shopName, setShopName] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          toast({
            title: 'Location Set',
            description: 'Your shop location has been detected.',
          });
        },
        () => {
          toast({
            title: 'Location Error',
            description: 'Unable to get location. Please enter address manually.',
            variant: 'destructive',
          });
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Error',
        description: 'Please log in first.',
        variant: 'destructive',
      });
      navigate('/mechanic/register');
      return;
    }

    const validation = shopSchema.safeParse({
      shopName,
      shopDescription,
      gstNumber,
      shopAddress,
      whatsappNumber,
      hourlyRate: parseFloat(hourlyRate) || 0,
      yearsOfExperience: parseInt(yearsOfExperience) || 0,
    });

    if (!validation.success) {
      toast({
        title: 'Validation Error',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('mechanic_shops')
        .insert({
          mechanic_id: user.id,
          shop_name: shopName,
          shop_description: shopDescription || null,
          gst_number: gstNumber || null,
          shop_address: shopAddress,
          latitude: location?.lat || null,
          longitude: location?.lng || null,
          whatsapp_number: whatsappNumber,
          hourly_rate: parseFloat(hourlyRate) || 0,
          years_of_experience: parseInt(yearsOfExperience) || 0,
        });

      if (error) throw error;

      toast({
        title: 'Shop Details Saved!',
        description: 'Now select the services you offer.',
      });
      navigate('/mechanic/services');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/mechanic/register" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Account Details
        </Link>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 gradient-accent rounded-full flex items-center justify-center mb-4">
              <Wrench className="h-6 w-6 text-accent-foreground" />
            </div>
            <CardTitle className="text-2xl">Shop Details</CardTitle>
            <CardDescription>Step 2 of 3: Tell us about your shop</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shopName">Shop Name *</Label>
                <Input
                  id="shopName"
                  type="text"
                  placeholder="Enter your shop name"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  required
                  className="input-field"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shopDescription">Shop Description</Label>
                <Textarea
                  id="shopDescription"
                  placeholder="Describe your shop and specialties"
                  value={shopDescription}
                  onChange={(e) => setShopDescription(e.target.value)}
                  className="input-field min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gstNumber">GST Number (Optional)</Label>
                <Input
                  id="gstNumber"
                  type="text"
                  placeholder="Enter GST number if available"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shopAddress">Shop Address *</Label>
                <Input
                  id="shopAddress"
                  type="text"
                  placeholder="Enter your shop address"
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  required
                  className="input-field"
                />
              </div>
              <Button 
                type="button"
                variant="outline" 
                className="w-full"
                onClick={handleGetLocation}
              >
                <MapPin className="mr-2 h-4 w-4" />
                {location ? `Location Set (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})` : 'Use Current Location'}
              </Button>
              <div className="space-y-2">
                <Label htmlFor="whatsappNumber">WhatsApp Number *</Label>
                <Input
                  id="whatsappNumber"
                  type="tel"
                  placeholder="Enter WhatsApp number for customers"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  required
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Hourly Rate (₹)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    placeholder="500"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                  <Input
                    id="yearsOfExperience"
                    type="number"
                    placeholder="5"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
            </CardContent>
            <div className="p-6 pt-0">
              <Button 
                type="submit" 
                className="w-full gradient-accent" 
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue to Services
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ShopDetails;
