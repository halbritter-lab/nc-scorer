// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';

const SearchPage = () => import('@/views/SearchPage.vue');
const GeneView = () => import('@/views/GeneView.vue');
const FAQ = () => import('@/views/FAQ.vue');
const PageNotFound = () => import('@/views/PageNotFound.vue');
const VariantView = () => import('@/views/VariantView.vue');
const ScoringView = () => import('@/views/ScoringView.vue');

const routes = [
  {
    path: '/',
    name: 'SearchPage',
    component: SearchPage,
  },
  {
    path: '/symbols/:symbol',
    name: 'GeneView',
    component: GeneView,
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
    // The ScoringView route now accepts additional optional parameters including a second variant for compound heterozygous variants.
    path: '/scoring/:variantInput/:inheritance?/:segregation?/:variantInput2?',
    name: 'ScoringView',
    component: ScoringView,
    props: true,
  },
  {
    path: '/:catchAll(.*)',
    name: 'PageNotFound',
    component: PageNotFound,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
