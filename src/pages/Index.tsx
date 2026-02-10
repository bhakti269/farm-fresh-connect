import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sprout, Star, ShieldCheck, MessageCircle, Play } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroFarm from "@/assets/hero-farm.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero: full-width banner with tagline (IndiaMART-style) */}
      <section className="relative min-h-[420px] md:min-h-[480px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroFarm})` }}
        />
        <div className="absolute inset-0 bg-primary/75" />
        <div className="relative container mx-auto px-4 text-center z-10">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className="h-px w-12 md:w-20 bg-primary-foreground/50" />
              <h1 className="font-serif text-3xl md:text-5xl font-bold text-primary-foreground whitespace-nowrap">
                Fresh From Farm, Direct To You
              </h1>
              <span className="h-px w-12 md:w-20 bg-primary-foreground/50" />
            </div>
            <p className="text-primary-foreground/90 text-lg md:text-xl mb-8">
              Connect with local farmers. No middlemen. Fair prices.
            </p>
          </div>
        </div>
      </section>

      {/* Mid section: two columns - connect + features | promo banner */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-6">
          {/* Left: We connect Farmers & Buyers + 3 features */}
          <div className="lg:col-span-3 bg-card border border-border rounded-xl p-8 md:p-10 shadow-md">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-3">
              We connect Farmers & Buyers
            </h2>
            <p className="text-muted-foreground mb-8">
              FarmFresh is a direct farm-to-buyer marketplace. Farmers list produce; buyers get fresh stock at fair prices—no long supply chains.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col items-start gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium text-foreground">Trusted Platform</span>
                <p className="text-sm text-muted-foreground">Verified farmers and transparent listings.</p>
              </div>
              <div className="flex flex-col items-start gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium text-foreground">Safe & Secure</span>
                <p className="text-sm text-muted-foreground">Secure payments and reliable delivery.</p>
              </div>
              <div className="flex flex-col items-start gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium text-foreground">Quick Assistance</span>
                <p className="text-sm text-muted-foreground">Support when you need it.</p>
              </div>
            </div>
          </div>

          {/* Right: Promo banner (IndiaMART-style) */}
          <div className="lg:col-span-2 relative rounded-xl overflow-hidden bg-primary text-primary-foreground min-h-[280px] flex flex-col justify-between p-6 md:p-8 shadow-lg">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-4 w-16 h-16 border-2 border-primary-foreground rounded-full" />
              <div className="absolute bottom-8 left-8 w-12 h-12 border-2 border-primary-foreground rounded-lg" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Sprout className="w-8 h-8" />
                <span className="font-serif font-bold text-lg">FarmFresh</span>
              </div>
              <h3 className="font-serif text-xl md:text-2xl font-bold mb-2">
                Grow Your Business, Feed More People
              </h3>
              <p className="text-primary-foreground/85 text-sm mb-6">
                List your produce. Reach buyers directly. Get the best price for your harvest.
              </p>
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row gap-3">
              <Link to="/sell" className="flex-1">
                <Button size="lg" variant="secondary" className="w-full gap-2">
                  Sell Produce
                </Button>
              </Link>
              <Link to="/consumer-register" className="flex-1">
                <Button size="lg" variant="outline" className="w-full border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 gap-2">
                  <Play className="w-4 h-4" /> Buy Fresh
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA strip */}
      <section className="border-t border-border bg-muted/30 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground mb-4">Ready to get started?</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/consumer-register">
              <Button variant="hero" size="lg" className="gap-2">
                Register as Consumer <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/sell">
              <Button variant="outline" size="lg">Register as Farmer</Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
