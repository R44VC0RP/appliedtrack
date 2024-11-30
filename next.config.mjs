import fs from 'fs';
import path from 'path';

const version = fs.readFileSync(path.join(process.cwd(), 'src', 'app', 'version.txt'), 'utf8').trim();

/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        NEXT_PUBLIC_VERSION: version,
    },
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
            {
                protocol: 'https',
                hostname: 't3.gstatic.com',
                pathname: '/faviconV2**',
            }
        ],
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        minimumCacheTTL: 60,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    output: 'standalone',
    experimental: {
        optimizePackageImports: ['lucide-react', 'react-icons']
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                punycode: false,
            };
        }

        config.resolve.alias.canvas = false;
        
        config.ignoreWarnings = [
            { message: /\[DEP0040\] DeprecationWarning: The `punycode` module is deprecated/ }
        ];

        config.optimization = {
            ...config.optimization,
            minimize: false
        };

        if (config.optimization && config.optimization.minimizer) {
            const terserPlugin = config.optimization.minimizer.find(
                plugin => plugin.constructor.name === 'TerserPlugin'
            );
            if (terserPlugin) {
                terserPlugin.options.terserOptions = {
                    parse: {
                        unicode: true
                    },
                    compress: {
                        unicode: true
                    },
                    mangle: {
                        keep_classnames: true,
                        keep_fnames: true
                    },
                    format: {
                        ascii_only: false,
                        comments: false,
                        quote_style: 1
                    },
                    sourceMap: false
                };
            }
        }
        
        return config;
    },
};



export default nextConfig