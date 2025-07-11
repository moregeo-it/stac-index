<template>
  <b-container class="content ecosystem">
    <h1>Ecosystem</h1>
    <p>A list of software and tools for STAC.</p>
    <b-spinner v-if="ecosystem === null" label="Loading..."></b-spinner>
    <b-alert v-else-if="typeof ecosystem === 'string'" variant="danger" show>{{ ecosystem }}</b-alert>
    <template v-else>
      <h6>Filter by Category</h6>
      <b-nav pills small>
        <b-nav-item :active="!category" :to="uri({category: null})">All</b-nav-item>
        <b-nav-item v-for="cat in categories" :key="cat" :active="category === cat" :to="uri({category: cat})">{{ cat }}</b-nav-item>
      </b-nav>
      <h6>Filter by Programming Language</h6>
      <b-nav pills small>
        <b-nav-item :active="!language" :to="uri({language: null})">All</b-nav-item>
        <b-nav-item v-for="lang in languages" :key="lang" :active="language === lang" :to="uri({language: lang})">{{ lang }}</b-nav-item>
      </b-nav>
      <hr />
      <b-alert v-if="filtered.length === 0" show>No tool or software found.</b-alert>
      <b-list-group v-else>
        <EcosystemItem v-for="data in filtered" :key="data._id" :data="data" />
      </b-list-group>
    </template>
  </b-container>
</template>

<script>
import EcosystemItem from './EcosystemItem.vue';

export default {
  name: 'Ecosystem',
  components: {
    EcosystemItem
  },
  props: {
    language: {
      type: String,
      default: ""
    },
    category: {
      type: String,
      default: ""
    }
  },
  data() {
    return {
      ecosystem: null
    };
  },
  computed: {
    filtered() {
      if (!Array.isArray(this.ecosystem)) {
        return [];
      }

      return this.ecosystem.filter(eco => {
        if (this.category && !eco.categories.includes(this.category)) {
          return false;
        }
        if (this.language && eco.language !== this.language) {
          return false;
        }

        return true;
      });
    },
    languages() {
      return this.unique("language");
    },
    categories() {
      return this.unique("categories");
    }
  },
  async created() {
    try {
      let response = await this.$axios.get('/ecosystem');
      this.ecosystem = response.data;
    } catch (error) {
      this.ecosystem = "Can't load ecosystem list from server. Please try again.";
    }
  },
  methods: {
    unique(field, mapTo = null) {
      if (!Array.isArray(this.ecosystem)) {
        return [];
      }
      let set = new Set();
      for(let eco of this.ecosystem) {
        let val = eco[field];
        if (Array.isArray(val)) {
          val.forEach(element => set.add(element));
        }
        else if (typeof val === 'string') {
          set.add(val);
        }
      }
      let arr = Array.from(set);
      if (mapTo) {
        return arr.map(key => ({key: key, value: mapTo[key]})).sort((a,b) => a.value.localeCompare(b.value));
      }
      else {
        return arr.sort();
      }
    },
    uri(change) {
      // See also: Catalogs.vue -> methods -> uri
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
      return "/ecosystem?" + params.join('&');
    }
  }
}
</script>