<template>
  <b-container class="content catalogs">
    <h1>Catalogs</h1>
    <p>A list of STAC APIs and Static Catalogs.</p>
    <b-spinner v-if="data === null" label="Loading..."></b-spinner>
    <b-alert v-else-if="typeof data === 'string'" variant="danger" show>{{ data }}</b-alert>
    <template v-else>
      <h6>Filter by Type</h6>
      <b-nav pills small>
        <b-nav-item :active="!type" :to="uri({type: null})">All</b-nav-item>
        <b-nav-item :active="type === 'api'" :to="uri({type: 'api'})">APIs</b-nav-item>
        <b-nav-item :active="type === 'static'" :to="uri({type: 'static'})">Static Catalogs</b-nav-item>
      </b-nav>
      <h6>Filter by Access Level</h6>
      <b-nav pills small>
        <b-nav-item :active="access === null" :to="uri({access: null})">All</b-nav-item>
        <b-nav-item :active="access === 'public'" :to="uri({access: 'public'})">Public only</b-nav-item>
        <b-nav-item :active="access === 'protected'" :to="uri({access: 'protected'})">Public &amp; Protected only</b-nav-item>
      </b-nav>
      <hr />
      <b-alert v-if="filtered.length === 0" show>No catalogs found.</b-alert>
      <b-list-group v-else>
        <DataItem v-for="item in filtered" :key="item._id" :data="item" />
      </b-list-group>
    </template>
  </b-container>
</template>

<script>
import DataItem from './DataItem.vue';

export default {
  name: 'Catalogs',
  components: {
    DataItem
  },
  props: {
    access: {
      type: String,
      default: null
    },
    type: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      data: null
    };
  },
  computed: {
    filtered() {
      if (!Array.isArray(this.data)) {
        return [];
      }

      return this.data.filter(col => {
        if (this.access === 'protected' && col.access === 'public') {
          return true; // Include public catalogs in list of protected catalogs
        }
        else if (this.access !== null && this.access !== col.access) {
          return false;
        }

        if (this.type === 'api' && !col.isApi) {
          return false;
        }
        else if (this.type === 'static' && col.isApi) {
          return false;
        }

        return true;
      });
    }
  },
  async created() {
    try {
      let response = await this.$axios.get('/catalogs');
      this.data = response.data;
    } catch (error) {
      this.data = "Can't load list of Catalogs from the server: " + error.message;
    }
  },
  methods: {
    uri(change) {
      // See also: Ecosystem.vue -> methods -> uri
      var params = [];
      for(var key in this.$props) {
        if (change[key] === null) {
          continue;
        }
        let val = this.$props[key];
        if (val || change[key]) {
          val = encodeURIComponent(change[key] || val);
          params.push(key + '=' + val);
        }
      }
      return "/catalogs?" + params.join('&');
    }
  }
}
</script>