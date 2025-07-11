<template>
  <b-list-group-item class="flex-column align-items-start">
    <div class="d-flex w-100 justify-content-between">
      <h5 class="mb-1"><b-link :href="data.url" target="_blank">{{ data.title }}</b-link></h5>
      <small><b-badge v-if="data.language">{{ data.language }}</b-badge></small>
    </div>
    <div class="styled-description summary">
      <p v-html="parseLink(data.summary)"></p>
    </div>
    <small>
      Categories:
      <b-badge v-for="cat in categories" :key="cat">{{ cat }}</b-badge>
    </small>
  </b-list-group-item>
</template>

<script>
import Utils from '../utils';

export default {
  name: 'EcosystemItem',
  props: {
    data: {
      type: Object
    }
  },
  computed: {
    categories() {
      return this.data.categories.sort();
    }
  },
  methods: {
    parseLink(text) {
      return Utils.parseLink(text);
    }
  }
};
</script>