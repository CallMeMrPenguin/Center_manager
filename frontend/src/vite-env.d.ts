/// <reference types="vite/client" />

declare const __APP_BUILD_TIME__: string;

declare module 'mammoth' {
  const mammoth: any;
  export default mammoth;
  export function convertToHtml(input: { arrayBuffer: ArrayBuffer } | { path: string }, options?: any): Promise<{ value: string; messages: any[] }>;
}
