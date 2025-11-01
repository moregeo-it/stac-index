<template>
  <b-container class="content home">
    <div class="jumbotron p-1 mb-4 bg-body-tertiary rounded-3">
      <div class="container-fluid py-4 text-center">
        <h1 class="display-5">
          <img alt="STAC logo" class="logo" src="../assets/logo.png"><br>
          Welcome to the STAC Index!
        </h1>
        <p class="fs-5">
          Here you can find STAC Catalogs, APIs, Software and Tools.<br>
          You can also add your own data and tools to the list.
        </p>
        <hr class="my-4">
        <p class="fs-6">
          You don't know what STAC is? Check it out at <a href="https://stacspec.org" target="_blank">stacspec.org</a>.
        </p>
        <b-button size="md" to="/catalogs">Catalogs</b-button>
        <b-button size="md" to="/ecosystem">Ecosystem</b-button>
        <b-button size="md" to="/learn">Learning Resources</b-button>
      </div>
    </div>
    <div class="recently" v-if="newest.data.length > 0 || newest.ecosystem.length > 0">
      <h2>Recently Added</h2>
      <b-card-group columns>
        <b-card header="Data" v-if="newest.data.length > 0">
          <b-list-group flush>
            <DataItem v-for="data in newest.data" :key="data._id" :data="data" />
          </b-list-group>
        </b-card>

        <b-card header="Software" v-if="newest.ecosystem.length > 0">
          <b-list-group flush>
            <EcosystemItem v-for="data in newest.ecosystem" :key="data._id" :data="data" />
          </b-list-group>
        </b-card>

        <b-card header="Learning Resources" v-if="newest.tutorials.length > 0">
          <b-list-group flush>
            <TutorialsItem v-for="data in newest.tutorials" :key="data._id" :data="data" />
          </b-list-group>
        </b-card>
      </b-card-group>
    </div>
  </b-container>
</template>

<script>
import { defineComponent } from 'vue';
import DataItem from './DataItem.vue';
import EcosystemItem from './EcosystemItem.vue';
import TutorialsItem from './TutorialsItem.vue';

export default defineComponent({
  name: 'Home',
  components: {
    DataItem,
    EcosystemItem,
    TutorialsItem
  },
  data() {
    return {
      newest: {
        data: [],
        ecosystem: []
      }
    };
  },
  async created() {
    try {
      let response = await this.$axios.get('/newest');
      this.newest = response.data;
    } catch (error) {
      console.error(error);
    }
  }
});
</script>

<style lang="scss" scoped>
.jumbotron {
  h1 {
    font-size: 4rem;
  }

  a.btn {
    margin: 0 0.25em;
    background-color: #144E63;
    color: white;

    &:hover {
      background-color: #09B3AD;
    }
  }
}

.recently {
  .card-body {
    padding: 0;
  }
  .text-muted {
    margin: 0.5em 0;
    font-size: 1.1rem;
    float: right;
  }
  .card-columns {
    clear: right;
  }
}

.logo {
  padding-bottom: 30px;
  max-width: 100%;
  max-height: 200px;
}
</style>