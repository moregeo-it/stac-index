<template>
  <b-container class="content home">
    <b-jumbotron>
      <template v-slot:header>
        <img alt="STAC logo" class="logo" src="../assets/logo.png"><br />
        Welcome to the STAC Index!
      </template>
      <template v-slot:lead>
        Here you can find STAC Catalogs, APIs, Software and Tools.<br />
        You can also add your own data and tools to the list.
      </template>
      <hr class="my-4">
      <p>You don't know STAC yet? Check it out at <a href="https://stacspec.org" target="_blank">stacspec.org</a>.</p>

      <b-button to="/catalogs">Catalogs</b-button>
      <b-button to="/ecosystem">Ecosystem</b-button>
      <b-button to="/learn">Learning Resources</b-button>
    </b-jumbotron>

    <div class="recently" v-if="newest.data.length > 0 || newest.ecosystem.length > 0">
      <h2>Recently added</h2>
      <b-card-group columns>
        <b-card header="Catalogs" v-if="newest.data.length > 0">
          <b-list-group flush>
            <DataItem v-for="data in newest.data" :key="data._id" :data="data" />
          </b-list-group>
        </b-card>

        <b-card header="Ecosystem" v-if="newest.ecosystem.length > 0">
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
import DataItem from './DataItem.vue';
import EcosystemItem from './EcosystemItem.vue';
import TutorialsItem from './TutorialsItem.vue';

export default {
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
}
</script>

<style scoped>
.jumbotron {
  text-align: center;
  padding: 2rem;
}
#stac-index .jumbotron a.btn {
  margin: 0 0.25em;
  background-color: #144E63;
  color: white;
}
#stac-index .jumbotron a.btn:hover {
  background-color: #09B3AD;
}
.recently .card-body {
  padding: 0;
}
.recently .text-muted {
  margin: 0.5em 0;
  font-size: 1.1rem;
  float: right;
}
.recently .card-columns {
  clear: right;
}
.logo {
  padding-bottom: 30px;
  max-width: 100%;
}
</style>