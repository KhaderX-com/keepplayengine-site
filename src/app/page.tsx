import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import StudioSections from "@/components/StudioSections";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="kpe-home" id="main-content">
        <Hero />
        <StudioSections />
      </main>
      <Footer />
    </div>
  );
}
