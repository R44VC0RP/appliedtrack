export function getVersion(): string {
    return process.env.NEXT_PUBLIC_VERSION || '1.0.0';
} 