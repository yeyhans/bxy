import vercel from '@astrojs/vercel';

// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://www.bxy.cl',
	integrations: [sitemap()],
	output: 'server',
	adapter: vercel(),
});
