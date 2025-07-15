<template>
  <b-container class="content tutorials">
    <h1>Learning Resources</h1>
    <p>A list of tutorials and workshops about STAC and its ecosystem.</p>
    <b-spinner v-if="tutorials === null" label="Loading..."></b-spinner>
    <b-alert v-else-if="typeof tutorials === 'string'" variant="danger" show>{{ tutorials }}</b-alert>
    <template v-else>
      <h6>Filter by Tags</h6>
      <b-nav pills small class="tags">
        <b-nav-item :active="!tag" :to="uri({tag: null})">All</b-nav-item>
        <b-nav-item v-for="t in tags" :key="t" :active="t === tag" :to="uri({tag: t})">{{ t }}</b-nav-item>
      </b-nav>
      <h6>Filter by Language</h6>
      <b-nav pills small>
        <b-nav-item :active="!language" :to="uri({language: null})">All</b-nav-item>
        <b-nav-item v-for="lang in languages" :key="lang.code" :active="language === lang.code" :to="uri({language: lang.code})">{{ lang.name }}</b-nav-item>
      </b-nav>
      <hr />
      <b-alert v-if="filtered.length === 0" show>No learning resource found.</b-alert>
      <b-list-group v-else>
        <TutorialsItem v-for="data in filtered" :key="data._id" :data="data" />
      </b-list-group>
    </template>
  </b-container>
</template>

<script>
import TutorialsItem from './TutorialsItem.vue';

export default {
  name: 'Tutorials',
  components: {
    TutorialsItem
  },
  props: {
    language: {
      type: String,
      default: ""
    },
    tag: {
      type: String,
      default: ""
    }
  },
  data() {
    return {
      tutorials: null,
      spokenLanguages: []
    };
  },
  computed: {
    filtered() {
      if (!Array.isArray(this.tutorials)) {
        return [];
      }

      return this.tutorials.filter(tutorial => {
        if (this.tag && !tutorial.tags.includes(this.tag)) {
          return false;
        }
        if (this.language && tutorial.language !== this.language) {
          return false;
        }

        return true;
      });
    },
    languages() {
      let usedLanguages = this.unique("language");
      return this.spokenLanguages.filter(lang => usedLanguages.includes(lang.code));
    },
    tags() {
      return this.unique("tags");
    }
  },
  async created() {
    try {
      let response = await this.$axios.get('/spoken_languages');
      if (!Array.isArray(response.data)) {
        throw new Error("Response data for spoken languages is not an array");
      }
      this.spokenLanguages = response.data;
    } catch (error) {
      console.error("Can't load list of spoken languages.");
    }
    try {
      let response = await this.$axios.get('/tutorials');
      this.tutorials = response.data;
    } catch (error) {
      this.tutorials = "Can't load learning resources from server. Please try again.";
    }
  },
  methods: {
    unique(field, mapTo = null) {
      if (!Array.isArray(this.tutorials)) {
        return [];
      }
      let set = new Set();
      for(let tutorial of this.tutorials) {
        let val = tutorial[field];
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
      return "/learn?" + params.join('&');
    }
  }
}
</script>

<style scoped>
.tags .nav-item {
  	text-transform: capitalize;
}
</style>