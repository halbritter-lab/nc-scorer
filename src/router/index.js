// router/index.js

import { createRouter, createWebHistory } from 'vue-router'
const GeneSearch = () => import('@/views/GeneSearch.vue'); // The GeneSearch view component
const GeneInfo = () => import('@/views/GeneInfo.vue'); // The GeneInfo view component
const PageNotFound = () => import('@/views/PageNotFound.vue'); // The PageNotFound view component
const FAQ = () => import('@/views/FAQ.vue');

const routes = [
  {
    path: '/',
    name: 'GeneSearch',
    component: GeneSearch
  },
  {
    path: '/symbols/:symbol',
    name: 'GeneInfo',
    component: GeneInfo,
    props: true // This allows the component to receive the `symbol` as a prop
  },
  {
    path: '/:catchAll(.*)', // Catch-all route
    name: 'PageNotFound',
    component: PageNotFound
  },
  {
    path: '/faq',
    name: 'FAQ',
    component: FAQ
  },
  {
    path: '/404',
    alias: '/:pathMatch(.*)*',
    name: 'PageNotFound',
    component: PageNotFound
  }
  // Add more routes here as you create other views
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
