/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['clearbit.com', 'autocomplete.clearbit.com', 'uploadthing.com', 'utfs.io', 'logo.clearbit.com'],
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
