// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';

const GeneSearch = () => import('@/views/GeneSearch.vue');
const GeneInfo = () => import('@/views/GeneInfo.vue');
const FAQ = () => import('@/views/FAQ.vue');
const PageNotFound = () => import('@/views/PageNotFound.vue');
// Import our new VariantView page
const VariantView = () => import('@/views/VariantView.vue');

const routes = [
  {
    path: '/',
    name: 'GeneSearch',
    component: GeneSearch,
  },
  {
    path: '/symbols/:symbol',
    name: 'GeneInfo',
    component: GeneInfo,
    props: true,
  },
  {
    path: '/faq',
    name: 'FAQ',
    component: FAQ,
  },
  {
    path: '/variant/:variantInput',
    name: 'VariantView',
    component: VariantView,
    props: true,
  },
  {
    path: '/:catchAll(.*)',
    name: 'PageNotFound',
    component: PageNotFound,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
