<template>
  <b-list-group-item class="flex-column align-items-start">
    <div class="d-flex w-100 justify-content-between">
      <h5 class="mb-1"><b-link :href="data.url" target="_blank">{{ data.title }}</b-link></h5>
      <small><b-badge v-if="data.language">{{ data.language.toUpperCase() }}</b-badge></small>
      <!-- ToDo: Display full language name -->
    </div>
    <div class="styled-description summary">
      <p v-html="parseLink(data.summary)" />
    </div>
    <small>
      <b-badge class="tag" v-for="tag in tags" :key="tag">{{ tag }}</b-badge>
    </small>
  </b-list-group-item>
</template>

<script>
import { defineComponent } from 'vue';
import Utils from '../utils';

export default defineComponent({
  name: 'EcosystemItem',
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  computed: {
    tags() {
      return this.data.tags
        .map(tag => {
          return tag
            .split(/\s/)
            .map(part => part.trim())
            .map(part => {
              if (part.length <= 3) {
                part = part.toUpperCase();
              }
              else {
                part = part.charAt(0).toUpperCase() + part.slice(1);
              }
              return part.replaceAll(/stac(?![a-z])/ig, 'STAC');
            })
            .join(' ');
        })
        .sort();
    }
  },
  methods: {
    parseLink(text) {
      return Utils.parseLink(text);
    }
  }
});
</script>

