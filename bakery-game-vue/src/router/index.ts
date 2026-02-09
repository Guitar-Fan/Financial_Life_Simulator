import { createRouter, createWebHistory } from 'vue-router';
import MenuView from '@/views/MenuView.vue';
import BuyingPhase from '@/views/BuyingPhase.vue';
import BakingPhase from '@/views/BakingPhase.vue';
import SellingPhase from '@/views/SellingPhase.vue';
import SummaryPhase from '@/views/SummaryPhase.vue';
import DashboardView from '@/views/DashboardView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'menu',
      component: MenuView,
    },
    {
      path: '/setup',
      name: 'setup',
      component: () => import('@/views/SetupPhase.vue'),
    },
    {
      path: '/buying',
      name: 'buying',
      component: BuyingPhase,
    },
    {
      path: '/baking',
      name: 'baking',
      component: BakingPhase,
    },
    {
      path: '/selling',
      name: 'selling',
      component: SellingPhase,
    },
    {
      path: '/summary',
      name: 'summary',
      component: SummaryPhase,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
    },
  ],
});

export default router;
