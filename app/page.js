import ScrollProgress from "./components/ScrollProgress";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import TrustBar from "./components/TrustBar";
import ProblemSolution from "./components/ProblemSolution";
import Integrations from "./components/Integrations";
import InteractiveShowcase from "./components/InteractiveShowcase";
import ComparisonTable from "./components/ComparisonTable";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import ROICalculator from "./components/ROICalculator";
import Testimonials from "./components/Testimonials";
import CommonProblems from "./components/CommonProblems";
import CTABanner from "./components/CTABanner";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";
import AIAssistantWidget from "./components/AIAssistantWidget";

export default function Home() {
  return (
    <main>
      <ScrollProgress />
      <Navbar />
      <Hero />
      <TrustBar />
      <ProblemSolution />
      <Integrations />
      <InteractiveShowcase />
      <ComparisonTable />
      <Features />
      <HowItWorks />
      <ROICalculator />
      <Testimonials />
      <CommonProblems />
      <CTABanner />
      <FAQ />
      <Footer />
      <AIAssistantWidget />
    </main>
  );
}
