declare module 'yamljs' {
  interface LoadOptions {
    encoding?: string;
    schema?: any;
    onWarning?(warning: Error): void;
  }

  export function load(path: string, options?: LoadOptions): any;
}
