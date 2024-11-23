/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'clearbit.com',
            },
            {
                protocol: 'https',
                hostname: 'autocomplete.clearbit.com',
            },
            {
                protocol: 'https',
                hostname: 'uploadthing.com',
            },
            {
                protocol: 'https',
                hostname: 'utfs.io',
            },
            {
                protocol: 'https',
                hostname: 'logo.clearbit.com',
            },
        ],
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        minimumCacheTTL: 60,
    },
    experimental: {
        optimizePackageImports: ['lucide-react', 'react-icons'],
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                punycode: false,
            };
        }

        config.resolve.alias.canvas = false;
        
        // Suppress deprecation warnings
        config.ignoreWarnings = [
            { message: /\[DEP0040\] DeprecationWarning: The `punycode` module is deprecated/ }
        ];
        
        // Update Terser configuration to handle unicode properly
        config.optimization.minimizer = config.optimization.minimizer.map((minimizer) => {
            if (minimizer.constructor.name === 'TerserPlugin') {
                minimizer.options.terserOptions = {
                    ...minimizer.options.terserOptions,
                    output: {
                        ...minimizer.options.terserOptions?.output,
                        comments: false,
                        ascii_only: false  // Changed to false to properly handle unicode
                    }
                };
            }
            return minimizer;
        });
        
        return config;
    },
};

if (process.env.NODE_ENV === 'production') {
    nextConfig.experimental = {
        ...nextConfig.experimental,
        optimizeCss: {
            cssModules: true,
            minify: true,
            inlineThreshold: 4096,
        },
    };
}

export default nextConfig;
