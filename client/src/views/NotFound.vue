<template>
  <b-container class="content error404">
    <h1>Page not found (404)</h1>
    <p>I can't find the page you're looking for.</p>
    <p><b-link to="/">Back to the homepage</b-link></p>
  </b-container>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'NotFound'
});
</script>

<style scoped>
.error404 {
  text-align: center;
}
</style>