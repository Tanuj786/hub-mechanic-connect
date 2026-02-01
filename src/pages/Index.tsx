import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Car, Wrench, MapPin, Clock, Star, Shield, Zap, Phone, CheckCircle } from 'lucide-react';
import madat24Logo from '@/assets/madat24-mascot-logo.png';

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <header className="relative gradient-hero text-primary-foreground min-h-screen flex flex-col">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/20 blur-3xl"
          />
          <motion.div
            animate={{ 
              scale: [1.2, 1, 1.2],
              rotate: [360, 180, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent/20 blur-3xl"
          />
        </div>

        {/* Navigation */}
        <nav className="container mx-auto px-4 py-6 flex justify-between items-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2"
          >
            <img src={madat24Logo} alt="Madat24" className="h-12 w-auto" />
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex gap-4"
          >
            <Link to="/customer/login">
              <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                Customer Login
              </Button>
            </Link>
            <Link to="/mechanic/login">
              <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                Mechanic Login
              </Button>
            </Link>
            <Link to="/mechanic/register">
              <Button className="gradient-accent border-0 shadow-accent">
                Register Shop
              </Button>
            </Link>
          </motion.div>
        </nav>

        {/* Hero Content */}
        <div className="flex-1 flex items-center relative z-10">
          <div className="container mx-auto px-4 py-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent mb-6"
                >
                  <Zap className="h-4 w-4" />
                  <span className="text-sm font-medium">Fast & Reliable Service</span>
                </motion.div>
                
                <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                  Roadside
                  <motion.span 
                    className="block text-accent"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    Assistance
                  </motion.span>
                  <motion.span 
                    className="block text-3xl md:text-4xl font-normal text-primary-foreground/80 mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    When You Need It Most
                  </motion.span>
                </h1>
                
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-xl text-primary-foreground/70 mb-10 max-w-lg"
                >
                  Connect with verified mechanics instantly. Get help for tyre punctures, 
                  fuel delivery, engine repairs, and more.
                </motion.p>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <Link to="/customer/signup">
                    <Button size="lg" className="gradient-accent border-0 text-lg px-8 py-6 shadow-accent hover:shadow-lg transition-all">
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
                </motion.div>

                {/* Stats */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="flex gap-8 mt-12"
                >
                  {[
                    { value: '5000+', label: 'Mechanics' },
                    { value: '50K+', label: 'Services Done' },
                    { value: '4.8★', label: 'Rating' },
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.1 + index * 0.1 }}
                    >
                      <p className="text-3xl font-bold text-accent">{stat.value}</p>
                      <p className="text-sm text-primary-foreground/60">{stat.label}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              {/* Hero Image/Animation */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="hidden lg:block relative"
              >
                <div className="relative">
                  {/* Floating Cards */}
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-0 right-0 glass-card p-4 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full gradient-success flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-success-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Service Complete</p>
                        <p className="text-sm text-muted-foreground">Battery Jump Start</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="absolute bottom-20 left-0 glass-card p-4 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Mechanic Arriving</p>
                        <p className="text-sm text-muted-foreground">ETA: 8 mins</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute top-1/3 right-10 glass-card p-3 rounded-xl"
                  >
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-warning fill-warning" />
                      <span className="font-semibold text-foreground">4.9</span>
                    </div>
                  </motion.div>

                  {/* Central Car Icon */}
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="w-64 h-64 mx-auto rounded-full gradient-primary flex items-center justify-center shadow-glow"
                  >
                    <Car className="h-32 w-32 text-primary-foreground" />
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 border-2 border-primary-foreground/30 rounded-full flex justify-center pt-2"
          >
            <div className="w-1.5 h-3 bg-primary-foreground/50 rounded-full" />
          </motion.div>
        </motion.div>
      </header>

      {/* Features Section */}
      <section className="py-24 bg-background relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why Choose <span className="text-primary">Madat24</span>?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Fast, reliable, and transparent roadside assistance at your fingertips
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: MapPin, title: 'Find Nearby Mechanics', description: 'Locate verified mechanics in your area with real-time availability and location tracking', delay: 0 },
              { icon: Clock, title: 'Quick Response', description: 'Average response time under 15 minutes. Get back on the road faster', delay: 0.1 },
              { icon: Star, title: 'Rated & Reviewed', description: 'Choose mechanics based on customer ratings and reviews for quality service', delay: 0.2 },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: feature.delay }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="stat-card text-center group"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-primary text-primary-foreground mb-6 group-hover:shadow-glow transition-shadow">
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-center mb-16"
          >
            Our Services
          </motion.h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Tyre Puncture', icon: '🔧', color: 'from-blue-500 to-blue-600' },
              { name: 'Fuel Delivery', icon: '⛽', color: 'from-orange-500 to-orange-600' },
              { name: 'Engine Repair', icon: '🔩', color: 'from-purple-500 to-purple-600' },
              { name: 'Brake Repair', icon: '🛑', color: 'from-red-500 to-red-600' },
              { name: 'Battery Jump', icon: '🔋', color: 'from-green-500 to-green-600' },
              { name: 'Towing Services', icon: '🚛', color: 'from-amber-500 to-amber-600' },
              { name: 'Oil Change', icon: '🛢️', color: 'from-cyan-500 to-cyan-600' },
              { name: 'AC Repair', icon: '❄️', color: 'from-sky-500 to-sky-600' },
            ].map((service, index) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05, y: -4 }}
                className="stat-card text-center cursor-pointer group"
              >
                <motion.span 
                  className="text-5xl mb-4 block"
                  whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.3 }}
                >
                  {service.icon}
                </motion.span>
                <h3 className="font-semibold group-hover:text-primary transition-colors">{service.name}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 gradient-primary text-primary-foreground relative overflow-hidden">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute -right-40 -top-40 w-80 h-80 border border-primary-foreground/10 rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute -left-20 -bottom-20 w-60 h-60 border border-primary-foreground/10 rounded-full"
        />
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Shield className="h-16 w-16 mx-auto mb-6 text-accent" />
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Join Our Network of Trusted Mechanics
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Expand your business, reach more customers, and grow your income
            </p>
            <Link to="/mechanic/register">
              <Button size="lg" className="gradient-accent border-0 text-lg px-10 py-6 shadow-accent hover:shadow-lg">
                Register Your Shop Today
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                <Phone className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">24/7 Support</p>
                <p className="font-semibold text-lg">1800-MADAT24</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex items-center gap-2 mb-4 md:mb-0"
            >
              <img src={madat24Logo} alt="Madat24" className="h-10 w-auto" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-sm text-background/60"
            >
              © 2024 Madat24. All rights reserved.
            </motion.p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
