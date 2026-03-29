import Image from "next/image";

export default function AppMockup() {
    return (
        <section className="w-full bg-white flex items-center justify-center h-screen">
            <div className="h-full flex items-center justify-center py-8">
                <Image
                    src="https://res.cloudinary.com/destej60y/image/upload/v1774216104/phone-mockup-keepplay-app-scr1_af4avl.png"
                    alt="KeepPlay Engine App Mockup"
                    width={900}
                    height={1200}
                    className="h-full w-auto object-contain"
                    priority
                />
            </div>
        </section>
    );
}
