/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_MODE?: 'demo' | 'api';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ImportMetaEnv { readonly VITE_TALENT_TEST_URL?: string }
interface ImportMeta { readonly env: ImportMetaEnv }
