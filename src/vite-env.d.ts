/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Domyślny layout (build-time); parametr URL ?layout= ma pierwszeństwo. */
  readonly VITE_LAYOUT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
