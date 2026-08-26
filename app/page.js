import ScrollProgress from "./components/ScrollProgress";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import TrustBar from "./components/TrustBar";
import InteractiveShowcase from "./components/InteractiveShowcase";
import Testimonials from "./components/Testimonials";
import FAQ from "./components/FAQ";
import CTABanner from "./components/CTABanner";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <main>
      <ScrollProgress />
      <Navbar />
      <Hero />
      <TrustBar />
      <InteractiveShowcase />
      <Testimonials />
      <FAQ />
      <CTABanner />
      <Footer />
    </main>
  );
}
