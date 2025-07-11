import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import NotFound from '../views/NotFound.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    component: Home
  },
  {
    path: '/catalogs',
    name: 'Catalogs',
    component: () => import(/* webpackChunkName: "catalogs" */ '../views/Catalogs.vue'),
    props: route => ({ access: route.query.access, type: route.query.type })
  },
  {
    path: '/catalogs/:id',
    name: 'BrowseCatalog',
    component: () => import(/* webpackChunkName: "browse" */ '../views/Browse.vue'),
    props: route => ({ id: route.params.id })
  },
  {
    path: '/ecosystem',
    name: 'Ecosystem',
    component: () => import(/* webpackChunkName: "ecosystem" */ '../views/Ecosystem.vue'),
    props: route => (route.query)
  },
  {
    path: '/learn',
    name: 'Learn STAC',
    component: () => import(/* webpackChunkName: "tutorials" */ '../views/Tutorials.vue'),
    props: route => (route.query)
  },
  {
    path: '/add',
    name: 'Add',
    component: () => import(/* webpackChunkName: "add" */ '../views/Add.vue')
  },
  {
    path: '/contact',
    name: 'Contact',
    component: () => import(/* webpackChunkName: "contact" */ '../views/Contact.vue')
  },
  {
    path: '/privacy',
    name: 'Privacy Policy',
    component: () => import(/* webpackChunkName: "privacy" */ '../views/Privacy.vue')
  },
  {
    path: '*',
    component: NotFound
  }
]

const router = new VueRouter({
  mode: 'history',
  routes
})

router.beforeEach((to, from, next) => {
  if (to.name) {
    document.title = to.name + " - STAC Index"
  }
  else {
    document.title = "STAC Index"
  }
  next()
})

export default router
