import Navbar from "@/components/Navbar";
import ComingSoon from "@/components/ComingSoon";
import Footer from "@/components/Footer";

export default function CatchAllPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow pt-16 sm:pt-20">
                <ComingSoon />
            </main>
            <Footer />
        </div>
    );
}
