import { Lilita_One } from "next/font/google";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import StudioSections from "@/components/StudioSections";
import Footer from "@/components/Footer";

const lilitaOne = Lilita_One({ weight: "400", subsets: ["latin"] });

export default function Home() {
  return (
    <div className={`min-h-screen ${lilitaOne.className}`}>
      <Navbar />
      <main className="kpe-home" id="main-content">
        <Hero />
        <StudioSections />
      </main>
      <Footer />
    </div>
  );
}
