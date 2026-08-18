<template>
  <b-list-group-item class="flex-column align-items-start">
    <div class="d-flex w-100 justify-content-between">
      <h5 class="mb-1"><b-link :to="'/catalogs/' + data.slug">{{ data.title }}</b-link></h5>
      <small class="header-badges">
        <b-badge v-if="data.isApi" variant="secondary">API</b-badge>
        <b-badge v-else variant="secondary" title="Static Catalog">Catalog</b-badge>
        
        <b-badge v-if="data.access === 'private'" variant="danger">Private</b-badge>
        <b-badge v-else-if="data.access === 'protected'" variant="warning">Protected</b-badge>
        <b-badge v-else variant="success">Public</b-badge>
      </small>
    </div>
    <div class="styled-description summary">
      <p v-html="parseLink(data.summary)" />
    </div>
    <small class="url">
      <BIconLink />
      <code><b-link :href="data.url" target="_blank">{{ data.url }}</b-link></code>
      <CopyButton :copyText="data.url" />
    </small>
  </b-list-group-item>
</template>

<script>
import { defineComponent } from 'vue';
import CopyButton from "./DataActionButtons.vue";
import Utils from '../utils';

export default defineComponent({
  name: 'DataItem',
  components: {
    CopyButton
  },
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  methods: {
    parseLink(text) {
      return Utils.parseLink(text);
    }
  }
});
</script>

<style lang="scss" scoped>
.header-badges {
  white-space: nowrap;
  margin-left: 0.5em;
}
small {
  display: flex;
  align-items: center;
  gap: 0.25em;

  &.url {
    flex: 1;

    code {
      font-size: 100%;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }
  }
}
</style>