/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['clearbit.com', 'autocomplete.clearbit.com', 'uploadthing.com', 'utfs.io', 'logo.clearbit.com'],
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        minimumCacheTTL: 60,
    },
    experimental: {
        optimizeCss: true,
        optimizePackageImports: ['lucide-react', 'react-icons'],
    },
    webpack: (config, { isServer }) => {
        config.resolve.alias.canvas = false;
        
        config.optimization.minimizer.forEach((minimizer) => {
            if (minimizer.constructor.name === 'TerserPlugin') {
                minimizer.options.terserOptions = {
                    ...minimizer.options.terserOptions,
                    output: {
                        ...minimizer.options.terserOptions.output,
                        ascii_only: true
                    }
                };
            }
        });
        
        return config;
    },
};

export default nextConfig;
