/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module 'variant-linker';
declare module 'write-excel-file/browser';
declare module 'shepherd.js';
