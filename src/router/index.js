// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';

// Performance-optimized lazy loading with named chunks for better caching
// This pattern helps Vite correctly bundle and cache route components

const SearchPage = () => import(/* webpackChunkName: "search" */ '@/views/SearchPage.vue');
const GeneView = () => import(/* webpackChunkName: "gene" */ '@/views/GeneView.vue');
const PageNotFound = () => import(/* webpackChunkName: "404" */ '@/views/PageNotFound.vue');
const VariantView = () => import(/* webpackChunkName: "variant" */ '@/views/VariantView.vue');
const ScoringView = () => import(/* webpackChunkName: "scoring" */ '@/views/ScoringView.vue');
const GeneScoresTableView = () => import(/* webpackChunkName: "gene-scores" */ '@/views/GeneScoresTableView.vue');
const BatchView = () => import(/* webpackChunkName: "batch" */ '@/views/BatchView.vue');

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
    path: '/variant/:variantInput/:assembly?',
    name: 'VariantView',
    component: VariantView,
    props: true,
  },
  {
    path: '/scoring/:variantInput/:inheritance?/:segregation?/:variantInput2?/:assembly?',
    name: 'ScoringView',
    component: ScoringView,
    props: true,
  },
  {
    path: '/genes',
    name: 'GeneScoresTableView',
    component: GeneScoresTableView,
  },
  {
    path: '/batch',
    name: 'BatchView',
    component: BatchView,
  },
  {
    path: '/about',
    name: 'AboutPage',
    component: () => import('@/views/AboutPage.vue'),
  },
  {
    path: '/methodology',
    name: 'MethodologyPage',
    component: () => import('@/views/MethodologyPage.vue'),
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
  // Add performance monitoring and scroll behavior
  scrollBehavior(to, from, savedPosition) {
    // If there's a saved position, use it
    if (savedPosition) {
      return savedPosition;
    }
    // If there's a hash, scroll to it
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' };
    }
    // Otherwise scroll to top
    return { top: 0, behavior: 'smooth' };
  },
});

export default router;
