/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_MODE?: 'demo' | 'supabase';
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_DATA_MODE?: 'demo' | 'api';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ImportMetaEnv { readonly VITE_TALENT_TEST_URL?: string }
interface ImportMeta { readonly env: ImportMetaEnv }
