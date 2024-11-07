declare module 'latex2pdf' {
  interface ConvertOptions {
    output: string;
    timeout?: number;
    debug?: boolean;
  }

  export function convert(
    input: string,
    options: ConvertOptions,
    callback: (error: Error | null, result?: any) => void
  ): void;
} 