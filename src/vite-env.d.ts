/// <reference types="vite/client" />

// content/**/*.yaml is turned into a JS module by tools/vite/yaml-content.ts
declare module '*.yaml' {
  const data: unknown;
  export default data;
}

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
}
