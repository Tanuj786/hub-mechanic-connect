import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Car, Wrench, MapPin, Clock, Star, Shield } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="gradient-hero text-primary-foreground">
        <nav className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Wrench className="h-8 w-8 text-accent" />
            <span className="text-2xl font-bold">MechanicQ</span>
          </div>
          <div className="flex gap-4">
            <Link to="/customer/login">
              <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                Customer Login
              </Button>
            </Link>
            <Link to="/mechanic/register">
              <Button className="gradient-accent border-0">
                Register Shop
              </Button>
            </Link>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
            Roadside Assistance
            <span className="block text-accent">When You Need It</span>
          </h1>
          <p className="text-xl md:text-2xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
            Connect with verified mechanics instantly. Get help for tyre punctures, 
            fuel delivery, engine repairs, and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/customer/login">
              <Button size="lg" className="gradient-accent border-0 text-lg px-8 py-6">
                <Car className="mr-2 h-5 w-5" />
                Get Help Now
              </Button>
            </Link>
            <Link to="/mechanic/register">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                <Wrench className="mr-2 h-5 w-5" />
                Join as Mechanic
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Why Choose MechanicQ?
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Fast, reliable, and transparent roadside assistance at your fingertips
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<MapPin className="h-8 w-8" />}
              title="Find Nearby Mechanics"
              description="Locate verified mechanics in your area with real-time availability and location tracking"
            />
            <FeatureCard 
              icon={<Clock className="h-8 w-8" />}
              title="Quick Response"
              description="Average response time under 15 minutes. Get back on the road faster"
            />
            <FeatureCard 
              icon={<Star className="h-8 w-8" />}
              title="Rated & Reviewed"
              description="Choose mechanics based on customer ratings and reviews for quality service"
            />
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-secondary/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Our Services
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Tyre Puncture', icon: '🔧' },
              { name: 'Fuel Delivery', icon: '⛽' },
              { name: 'Engine Repair', icon: '🔩' },
              { name: 'Brake Repair', icon: '🛑' },
              { name: 'Battery Jump Start', icon: '🔋' },
              { name: 'Towing Services', icon: '🚛' },
              { name: 'Oil Change', icon: '🛢️' },
              { name: 'AC Repair', icon: '❄️' },
            ].map((service) => (
              <div 
                key={service.name}
                className="stat-card text-center hover:scale-105 transition-transform cursor-pointer"
              >
                <span className="text-4xl mb-3 block">{service.icon}</span>
                <h3 className="font-semibold">{service.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <Shield className="h-16 w-16 mx-auto mb-6 text-accent" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Join Our Network of Trusted Mechanics
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Expand your business, reach more customers, and grow your income
          </p>
          <Link to="/mechanic/register">
            <Button size="lg" className="gradient-accent border-0 text-lg px-8">
              Register Your Shop Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Wrench className="h-6 w-6 text-accent" />
              <span className="text-xl font-bold">MechanicQ</span>
            </div>
            <p className="text-background/60">
              © 2024 MechanicQ. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="stat-card text-center">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-primary text-primary-foreground mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export default Index;
