import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import AppMockup from "@/components/AppMockup";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <AppMockup />
      <Footer />
    </div>
  );
}
