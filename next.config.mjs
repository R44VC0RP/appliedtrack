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
        // Warning: This allows production builds to successfully complete even if
        // your project has ESLint errors.
        ignoreDuringBuilds: true,
    },
    typescript: {
        // Warning: This allows production builds to successfully complete even if
        // your project has type errors.
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

        // Needed for html2canvas and other canvas-related dependencies
        config.resolve.alias.canvas = false;
        
        // Suppress deprecation warnings
        config.ignoreWarnings = [
            { message: /\[DEP0040\] DeprecationWarning: The `punycode` module is deprecated/ }
        ];

        // Disable Terser
        config.optimization = {
            ...config.optimization,
            minimize: false
        };

        // Configure Terser to handle unicode properly
        const terserOptions = {
            parse: {
                // Enable parsing of unicode escape sequences
                unicode: true
            },
            compress: {
                // Preserve unicode literals
                unicode: true
            },
            mangle: {
                // Keep variable names readable
                keep_classnames: true,
                keep_fnames: true
            },
            format: {
                // Preserve unicode characters
                ascii_only: false,
                comments: false,
                // Ensure proper unicode escaping
                quote_style: 1
            },
            sourceMap: false
        };

        // Find and update the Terser plugin configuration
        if (config.optimization && config.optimization.minimizer) {
            const terserPlugin = config.optimization.minimizer.find(
                plugin => plugin.constructor.name === 'TerserPlugin'
            );
            if (terserPlugin) {
                terserPlugin.options.terserOptions = {
                    ...terserPlugin.options.terserOptions,
                    ...terserOptions
                };
            }
        }
        
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
