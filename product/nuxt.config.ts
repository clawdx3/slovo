export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  srcDir: 'app/',
  runtimeConfig: {
    groqApiKey: process.env.GROQ_API_KEY || '',
    googleTranslateApiKey: process.env.GOOGLE_TRANSLATE_API_KEY || '',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379/0',
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '',
    },
  },
  nitro: {
    experimental: {
      wasm: true,
    },
    storage: {
      uploads: {
        driver: 'fs',
        base: './.data/uploads',
      },
    },
  },
});
