import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import axios from 'axios';
import { createBootstrap } from 'bootstrap-vue-next';
import { HTTPS, HTTP_HOST, HTTP_PORT, HTTP_PATH } from '../../commons';

const URL = (HTTPS ? 'https://' : 'http://') + HTTP_HOST + (!HTTPS && HTTP_PORT != 80 ? ':' + HTTP_PORT : '') + HTTP_PATH;

const app = createApp(App);

app.config.globalProperties.$axios = axios.create({
  baseURL: URL,
  timeout: 10000,
});

app.use(createBootstrap());
app.use(router);

app.mount('body');