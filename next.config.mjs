/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['clearbit.com', 'autocomplete.clearbit.com', 'uploadthing.com', 'utfs.io', 'logo.clearbit.com'],
    },
    webpack: (config) => {
        config.resolve.alias.canvas = false;
        return config;
    },
};

export default nextConfig;
