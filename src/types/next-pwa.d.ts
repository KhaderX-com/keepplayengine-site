declare module 'next-pwa' {
    import { NextConfig } from 'next';

    interface PWAConfig {
        dest?: string;
        disable?: boolean;
        register?: boolean;
        skipWaiting?: boolean;
        scope?: string;
        sw?: string;
        runtimeCaching?: Array<{
            urlPattern: RegExp | string;
            handler: 'CacheFirst' | 'CacheOnly' | 'NetworkFirst' | 'NetworkOnly' | 'StaleWhileRevalidate';
            method?: string;
            options?: {
                cacheName?: string;
                expiration?: {
                    maxEntries?: number;
                    maxAgeSeconds?: number;
                };
                cacheableResponse?: {
                    statuses?: number[];
                };
                backgroundSync?: {
                    name: string;
                    options?: {
                        maxRetentionTime?: number;
                    };
                };
                broadcastUpdate?: {
                    channelName?: string;
                };
                matchOptions?: {
                    ignoreSearch?: boolean;
                    ignoreMethod?: boolean;
                    ignoreVary?: boolean;
                };
                plugins?: any[];
                fetchOptions?: RequestInit;
                networkTimeoutSeconds?: number;
                rangeRequests?: boolean;
            };
        }>;
        buildExcludes?: Array<string | RegExp>;
        publicExcludes?: string[];
        cacheStartUrl?: boolean;
        dynamicStartUrl?: boolean;
        dynamicStartUrlRedirect?: string;
        fallbacks?: {
            document?: string;
            image?: string;
            audio?: string;
            video?: string;
            font?: string;
        };
        cacheOnFrontEndNav?: boolean;
        reloadOnOnline?: boolean;
        customWorkerDir?: string;
    }

    function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig;

    export default withPWA;
}
