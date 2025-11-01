<template>
  <div id="stac-index">
    <header class="position-sticky top-0 shadow-sm z-3">
      <b-navbar toggleable="lg" type="dark" class="stac-nav" variant="info">
        <b-navbar-brand to="/">
          <img src="./assets/logo2.png" class="nav-logo d-inline-block align-top" alt="STAC Index">
          STAC Index
        </b-navbar-brand>

        <b-navbar-toggle target="nav-collapse" />

        <b-collapse id="nav-collapse" is-nav>
          <b-navbar-nav>
            <b-nav-item to="/catalogs" title="STAC APIs and catalogs"><BIconFolderFill /> Data</b-nav-item>
            <b-nav-item to="/ecosystem" title="STAC tools, libraries and other software"><BIconTools /> Software</b-nav-item>
            <b-nav-item to="/learn" title="STAC tutorials and more learning resources"><BIconInfoCircleFill /> Learning Resources</b-nav-item>
            <b-nav-item to="/add" title="Add a new STAC resource" class="submit"><BIconPlusCircleFill /> Submit</b-nav-item>
          </b-navbar-nav>

          <b-navbar-nav class="ms-auto">
            <b-nav-item href="https://bsky.app/profile/stacindex.org" target="_blank"><BIconShare /> BlueSky</b-nav-item>
            <b-nav-item to="/contact"><BIconEnvelopeFill /> Contact</b-nav-item>
            <b-nav-item to="/privacy"><BIconExclamationTriangleFill /> Privacy Policy</b-nav-item>
          </b-navbar-nav>
        </b-collapse>
      </b-navbar>
    </header>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'App'
});
</script>

<style lang="scss">
$primary: #144E63;

@import '~bootstrap/scss/bootstrap';
@import '~bootstrap-vue-next/dist/bootstrap-vue-next.css';

#stac-index {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: black;

  .content {
    padding-top: 30px;
    padding-bottom: 15px;
  }

  .bg-info {
    background-color: #144E63 !important;
  }

  h1, h2, h3, h4, h5, h6 {
    color: #144E63;
  }

  a:not(.btn):not(.nav-link):not(.navbar-brand),
  .list-group-item .styled-description a,
  a.list-group-item h5 {
    color: #09B3AD;
    text-decoration: none;
  }
  a:not(.btn):not(.nav-link):not(.navbar-brand):hover,
  .list-group-item .styled-description a:hover,
  a:hover.list-group-item h5 {
    color: #144E63;
  }
  .stac-nav a {
    color: white;
    font-weight: bold;
  }
  .stac-nav a.disabled,
  .nav a.disabled {
    opacity: 0.5;
  }
  .stac-nav a:hover {
    color: #09B3AD;
  }
  .stac-nav a.router-link-active {
    color: #09B3AD;
  }
  .stac-nav .nav-logo {
    height: 30px;
  }
  .stac-nav .nav-item {
    margin-left: 0.5em;
  }
  .stac-nav .submit {
    margin-left: 1em;
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25em;

    .btn {
      color: $primary;
      background: transparent;
      border-color: transparent;
      white-space: nowrap;

      &.active {
        color: white;
        background: $primary;
        border-color: $primary;
      }

      &:hover {
        border-color: $primary;
      }
    }
  }

  .list-group-item {
    padding: 1rem;
  }

  .list-group-item small, a.list-group-item  {
    color: black;
  }

  .badge {
    margin: 1px;
    font-size: 95%;
  }
  h6 {
    margin-top: 1em;
  }

  .styled-description h1 {
    font-size: 1.2em;
  }
  .styled-description h2 {
    font-size: 1.1em;
  }
  .styled-description h3, .styled-description h4, .styled-description h5, .styled-description h6 {
    font-size: 1em;
  }
  .styled-description,
  .styled-description p {
    line-height: 1.5em;
    margin-bottom: 0.5em;
  }
  .styled-description p:last-of-type {
    margin-bottom: 0;
  }
  }
</style>
