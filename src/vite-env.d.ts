/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ROI_SIMULATOR_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
