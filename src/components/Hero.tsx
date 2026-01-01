import Image from "next/image";

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white pt-16 sm:pt-20">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-64 h-64 sm:w-96 sm:h-96 bg-[#00E5FF]/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-64 h-64 sm:w-96 sm:h-96 bg-purple-300/20 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-100 sm:w-150 h-100 sm:h-150 bg-blue-200/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 lg:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
                    {/* Left Content */}
                    <div className="space-y-3 sm:space-y-4 text-center lg:text-left">
                        <div className="space-y-2">
                            <h2 className="text-[#00E5FF] font-bold text-xs sm:text-sm md:text-base tracking-wide uppercase">
                                ONE LOOP. ZERO BURNOUT. ENDLESS REWARDS.
                            </h2>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-bold text-gray-900 leading-tight">
                                A Play-to-Earn Ecosystem{" "}
                                <span className="block">That Never Runs Dry</span>
                            </h1>
                        </div>

                        <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto lg:mx-0 leading-normal">
                            We build technology that engages and excites players — and an
                            ecosystem that keeps the fun and the rewards flowing. Every
                            session fuels the next, so players stay longer, partners grow
                            faster, and nobody hits pause.
                        </p>
                    </div>

                    {/* Right Content - Logo */}
                    <div className="relative flex items-center justify-center mt-6 lg:mt-0">
                        <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md">
                            <Image
                                src="https://res.cloudinary.com/destej60y/image/upload/v1766745807/Logo-transparent_icqnyx.svg"
                                alt="KeepPlay Engine"
                                width={500}
                                height={500}
                                className="w-full h-auto"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom wave decoration */}
            <div className="absolute bottom-0 left-0 right-0">
                <svg
                    className="w-full h-24 sm:h-32"
                    viewBox="0 0 1440 120"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
                        fill="white"
                        fillOpacity="0.3"
                    />
                </svg>
            </div>
        </section>
    );
}
