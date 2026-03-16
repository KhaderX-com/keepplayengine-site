import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';

// Route segment config
export const runtime = 'nodejs';

// Image metadata
export const size = {
    width: 48,
    height: 48,
};
export const contentType = 'image/png';

// Image generation — serves as /admin/icon.png (favicon for the admin route segment).
// Next.js picks up icon.tsx files automatically per the App Router file convention.
// This overrides the root favicon.ico for all pages under /admin.
export default function Icon() {
    const logoPath = join(process.cwd(), 'public', 'keepplay-logo2.png');
    const logoBuffer = readFileSync(logoPath);
    const logoBase64 = logoBuffer.toString('base64');
    const logoDataUri = `data:image/png;base64,${logoBase64}`;

    return new ImageResponse(
        (
            // eslint-disable-next-line @next/next/no-img-element -- ImageResponse requires raw <img>, not next/image
            <img
                src={logoDataUri}
                alt="KeepPlay Engine Admin"
                width="48"
                height="48"
                style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '8px',
                }}
            />
        ),
        {
            ...size,
        }
    );
}
