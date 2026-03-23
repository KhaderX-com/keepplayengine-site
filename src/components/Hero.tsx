import { Lilita_One } from "next/font/google";

const lilitaOne = Lilita_One({
    weight: "400",
    subsets: ["latin"],
});

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage:
                        "url('https://res.cloudinary.com/destej60y/image/upload/v1774273405/21_stluj3.png')",
                }}
            />

            {/* Curved arc text + logo */}
            <div className={`relative z-10 w-full ${lilitaOne.className}`}>
                <svg
                    viewBox="0 0 1600 800"
                    className="w-full"
                    preserveAspectRatio="none"
                    aria-label="CLOSED-LOOP ECOSYSTEM"
                    role="img"
                    overflow="visible"
                >
                    {/* Logo centered, well above the text arc */}
                    <image
                        href="https://res.cloudinary.com/destej60y/image/upload/v1773809280/Bolt_1_jwgn1c.png"
                        x="650"
                        y="60"
                        width="300"
                        height="300"
                        preserveAspectRatio="xMidYMid meet"
                    />
                    <defs>
                        <path
                            id="heroArc"
                            d="M -100,440 Q 800,780 1700,440"
                            fill="none"
                        />
                    </defs>
                    <text
                        fill="#000000"
                        fontSize="110"
                        fontFamily="inherit"
                        letterSpacing="12"
                        fontWeight="400"
                    >
                        <textPath
                            href="#heroArc"
                            startOffset="50%"
                            textAnchor="middle"
                        >
                            CLOSED-LOOP ECOSYSTEM
                        </textPath>
                    </text>
                </svg>
            </div>


        </section>
    );
}
