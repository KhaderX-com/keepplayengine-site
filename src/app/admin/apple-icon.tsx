import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';

// Route segment config
export const runtime = 'nodejs';

// Apple touch icon dimensions
export const size = {
    width: 180,
    height: 180,
};
export const contentType = 'image/png';

// Generates the apple-touch-icon for the admin panel PWA.
// Next.js serves this as /admin/apple-icon.png automatically.
export default function AppleIcon() {
    const logoPath = join(process.cwd(), 'public', 'admin-icon-192.png');
    const logoBuffer = readFileSync(logoPath);
    const logoBase64 = logoBuffer.toString('base64');
    const logoDataUri = `data:image/png;base64,${logoBase64}`;

    return new ImageResponse(
        (
            // eslint-disable-next-line @next/next/no-img-element -- ImageResponse requires raw <img>
            <img
                src={logoDataUri}
                alt="KPE Admin"
                width="180"
                height="180"
                style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '20px',
                }}
            />
        ),
        {
            ...size,
        }
    );
}
