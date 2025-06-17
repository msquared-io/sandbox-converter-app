declare module "../converter/main.js" {
  export default function converter(options: {
    file: string;
    output: string;
    merge: boolean;
  }): Promise<void>;
}

declare module "../converter/includes/utils.js" {
  export function parseArgs(): Promise<{
    file: string;
    output: string;
    merge: boolean;
  }>;
}
