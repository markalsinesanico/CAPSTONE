import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from './components/Dashboard.vue';
import Borrowers from './components/Borrowers.vue';
import RoomsAppoint from './components/RoomsAppoint.vue';
import LoginForm from './components/LoginForm.vue';
import History from './components/History.vue';

const routes = [
  { path: '/', name: 'LoginForm', component: LoginForm },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard },
  { path: '/borrowers', name: 'Borrowers', component: Borrowers },
  { path: '/appointment', name: 'RoomsAppoint', component: RoomsAppoint},
  { path: '/history', name: 'History', component: History},
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
