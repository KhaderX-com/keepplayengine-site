export default function ComingSoon() {
    return (
        <section className="flex items-center justify-center min-h-[calc(100vh-20rem)] bg-gradient-to-br from-gray-50 to-blue-50 py-8">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="space-y-4 sm:space-y-6">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900">
                        Coming Soon
                    </h1>
                    <div className="w-16 sm:w-24 h-1 bg-[#00E5FF] mx-auto"></div>
                    <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 max-w-xl mx-auto leading-relaxed">
                        We&apos;re working hard to bring you something amazing. Stay tuned!
                    </p>
                </div>
            </div>
        </section>
    );
}
