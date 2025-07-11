<template>
  <b-container class="content add">
    <h1>Add a new STAC Resource</h1>
    <b-alert v-if="typeof error === 'string'" variant="danger" show>{{ error }}</b-alert>
    <b-alert v-else-if="typeof confirmation === 'string'" :variant="urlHintType" show>{{ confirmation }}</b-alert>
    <b-alert v-else variant="warning" show>
      The data entered here will be stored in the STAC Index and made publicly available immediately after submission without further review.<br />
      Please make sure that the data you provide is correct and meaningful.
    </b-alert>
    <b-form @submit="onSubmit">
      <h5>What do you want to add?</h5>
      <b-form-group>
        <b-form-radio-group v-model="type" id="type" name="type" :options="typeList"></b-form-radio-group>
      </b-form-group>
      <template v-if="type">
        <h5>{{ formTitle }}</h5>
        <b-form-group v-if="fields.includes('url')" label="URL:" label-for="url">
          <b-form-input id="url" type="url" v-model="url" required></b-form-input>
          <b-form-text v-if="type !== 'ecosystem' && type !== 'tutorial'">
            HTTPS should be used instead of HTTP whenever available.
            This URL must be publicly accessible or you must select "private" below.
            It must be the URL of the root catalog / API landing page.
          </b-form-text>
          <b-alert v-if="urlHint" :variant="urlHintType" show>{{ urlHint }}</b-alert>
        </b-form-group>
        <b-form-group v-if="fields.includes('title')" :label="type === 'ecosystem' ? 'Name of the software or tool:' : 'Title:'" label-for="title">
          <b-form-input id="title" type="text" v-model="title" required minlength="3" :maxlength="maxTitleLength"></b-form-input>
          <b-form-text>Min. 3 chars, max. {{ maxTitleLength }} chars.</b-form-text>
        </b-form-group>
        <b-form-group v-if="fields.includes('slug')" label="Slug" label-for="title">
          <b-form-input id="slug" type="text" v-model="slug" required minlength="3" maxlength="50" @keydown="stopSlugGen" @mousedown="stopSlugGen"></b-form-input>
          <b-form-text>Short identifier for the URL. Min. 3 chars, max. 50 chars. Allowed chars: <code>a-z</code>, <code>0-9</code>, <code>-</code></b-form-text>
        </b-form-group>
        <b-form-group v-if="fields.includes('summary')" label="Summary:" label-for="summary">
          <b-form-textarea id="summary" v-model="summary" rows="3" required minlength="50" maxlength="300"></b-form-textarea>
          <b-form-text>
            Short summary about the {{ formTitle }}. Min. 50 chars, max. 300 chars, currently {{ summary ? summary.length : 0 }} chars.
            <template v-if="type !== 'tutorial'">
              One CommonMark (Markdown) style link allowed.
            </template>
          </b-form-text>
        </b-form-group>
        <b-form-group v-if="fields.includes('categories')" label="Categories:" label-for="categories">
          <multiselect v-model="categories" :options="categoryList" :multiple="true" :taggable="true"></multiselect>
        </b-form-group>
        <b-form-group v-if="fields.includes('tags')" label="Tags:" label-for="tags">
          <multiselect v-model="tags" :options="allTags" :multiple="true" :taggable="true" @tag="addTag"></multiselect>
          <b-form-text>At least one tag to categorize the learning resource. Either select existing tags or create new ones. Each tag requires min. 2 chars and max. 50 chars. Tags will be converted to lower-case.</b-form-text>
        </b-form-group>
        <template v-if="fields.includes('language')">
        <b-form-group v-if="type == 'tutorial'" label="Language:" label-for="language">
          <multiselect v-model="language" :options="spokenLanguageList" trackBy="code" label="name"></multiselect>
          <b-form-text>This should be the written/spoken language of the learning resource.</b-form-text>
        </b-form-group>
        <b-form-group v-else label="Programming Language:" label-for="language">
          <multiselect v-model="language" :options="languageList"></multiselect>
          <b-form-text>This should be the main programming language.</b-form-text>
        </b-form-group>
        </template>
        <b-form-group v-if="fields.includes('email')" label="Contact e-mail:" label-for="email">
          <b-form-input id="email" type="email" v-model="email"></b-form-input>
          <b-form-text>Optional. Not publicly displayed. Just used to contact you in case we have questions regarding your submission.</b-form-text>
        </b-form-group>
        <b-form-group v-if="fields.includes('access')" label="Access:" label-for="access">
          <b-form-radio v-model="access" name="access" value="public">
            Public
            <b-form-text>All data is publicly available, i.e. everything is accessible without authentication.</b-form-text>
          </b-form-radio>
          <b-form-radio v-model="access" name="access" value="protected">
            Protected
            <b-form-text>Parts of the catalog are not public, e.g. only some collections are publicly accessible.</b-form-text>
          </b-form-radio>
          <b-form-radio v-model="access" name="access" value="private">
            Private
            <b-form-text>No public access, i.e. at least one collection or item must be publicly accessible.</b-form-text>
          </b-form-radio>
          <template v-if="access !== 'public'">
            <b-form-text text-variant="black"><br />Please give information how interested parties can gain access to the {{ formTitle }} below:</b-form-text>
            <b-form-textarea id="accessInfo" v-model="accessInfo" rows="3" required minlength="100" maxlength="1000"></b-form-textarea>
            <b-form-text>CommonMark (Markdown) is supported. Min. 100 chars, max. 1000 chars.</b-form-text>
          </template>
        </b-form-group>
        <b-button type="submit" variant="primary">Submit</b-button>
      </template>
    </b-form>
  </b-container>
</template>

<script>
import Multiselect from 'vue-multiselect';
import slugify from 'slugify';
import isPlainObject from 'lodash/isPlainObject';
import { CATEGORIES } from '../../../commons';

export default {
  name: 'Add',
  components: {
    Multiselect
  },
  data() {
    return {
      typeList: [
          { text: 'Static Catalog', value: 'catalog' },
          { text: 'API', value: 'api' },
          { text: 'Tool / Software', value: 'ecosystem' },
          { text: 'Learning resource', value: 'tutorial' }
      ],
      languageList: [],
      spokenLanguageList: [],
      categoryList: CATEGORIES,
      allTags: [],
      error: null,
      confirmation: null,
      type: null,
      url: null,
      slug: '',
      title: null,
      summary: null,
      language: null,
      categories: [],
      tags: [],
      access: 'public',
      accessInfo: null,
      email: null,
      customSlug: false,
      urlHint: "",
      urlHintType: "info"
    };
  },
  watch: {
    async url(newUrl) {
      if ((this.type === 'catalog' || this.type === 'api') && typeof newUrl === 'string' && newUrl.startsWith('https://') && newUrl.length > 10) {
        this.urlHint = "Trying to read the URL...";
        this.urlHintType = "info";
        let catalog;
        try {
          catalog = await this.$axios.get(newUrl);
        } catch (error) {
          try {
            catalog = await this.$axios.get(this.proxyUrl + encodeURIComponent(newUrl));
          } catch (error) {
            this.access = 'private';
            this.urlHint = "Can't read the specified URL. Is the catalog private? Setting the API as 'private' for you...";
            this.urlHintType = "warning";
            return;
          }
        }

        if (catalog.conformsTo && this.type === 'catalog') {
            this.urlHint = "The link provided seems to be a STAC API, but you have selected 'Static Catalog'. Changed the selection to 'API'. Please ensure to pick the correct type.";
            this.urlHintType = "warning";
            this.type = 'api';
        }
        else if (!catalog.conformsTo && this.type === 'api') {
            this.urlHint = "The link provided seems to be a static STAC catalog, but you have selected 'API'. Changed the selection to 'Static Catalog'. Please ensure to pick the correct type.";
            this.urlHintType = "warning";
            this.type = 'catalog';
        }

        if (isPlainObject(catalog.data) && typeof catalog.data.id === 'string' && typeof catalog.data.description === 'string' && Array.isArray(catalog.data.links)) {
          if (this.access === 'private') {
            this.access = 'protected';
          }
          if (typeof catalog.data.title === 'string' && !this.title && catalog.data.title !== 'stac-fastapi') {
            this.title = catalog.data.title;
          }
          if (typeof catalog.data.description === 'string' && !this.summary) {
            this.summary = catalog.data.description;
          }
          if (this.urlHintType === 'info') {
            this.urlHint = "Catalog found. Inserting some data from the catalog for you...";
            this.urlHintType = "success";
          }
        }
        else {
          this.urlHint = "The link provided doesn't seem to be a valid catalog. Are you sure the URL is correct? Is the catalog private? Setting the API as 'private' for you...";
          this.urlHintType = "danger";
        }
      }
    },
    type(newVal) {
      if (newVal) {
        this.confirmation = null;
        this.error = null;
        if (newVal === 'tutorial') {
          this.language = this.spokenLanguageList.find(lang => lang.code === 'en') || null;
        }
        else {
          this.langauge = null;
        }
      }
    },
    title(val) {
      if (!this.customSlug) {
        this.slug = slugify(val, {
          lower: true,
          strict: true
        });
      }
    }
  },
  computed: {
    proxyUrl() {
      return this.$axios.defaults.baseURL + '/proxy?';
    },
    formTitle() {
      let type = this.typeList.find(t => t.value === this.type);
      if (type) {
        return type.text;
      }
      else {
        return null;
      }
    },
    maxTitleLength() {
      return this.type === 'tutorial' ? 200 : 50;
    },
    fields() {
      let fields = ['url', 'title', 'summary', 'email'];
      if (this.type === 'catalog' || this.type === 'api') {
        fields.push('slug');
        fields.push('access');
      }
      else if (this.type === 'ecosystem') {
        fields.push('language');
        fields.push('categories');
      }
      else if (this.type === 'tutorial') {
        fields.push('language');
        fields.push('tags');
      }
      return fields;
    }
  },
  async created() {
    try {
      let response = await this.$axios.get('/languages');
      if (!Array.isArray(response.data)) {
        throw new Error("Response data for programming languages is not an array");
      }
      this.languageList = response.data;
    } catch (error) {
      console.error("Can't load list of programming languages.");
    }
    try {
      let response = await this.$axios.get('/spoken_languages');
      if (!Array.isArray(response.data)) {
        throw new Error("Response data for spoken languages is not an array");
      }
      this.spokenLanguageList = response.data;
    } catch (error) {
      console.error("Can't load list of spoken languages.");
    }
    try {
      let response = await this.$axios.get('/tags');
      if (!Array.isArray(response.data)) {
        throw new Error("Response data for tags is not an array");
      }
      this.allTags = response.data;
    } catch (error) {
      console.error("Can't load list of tags.");
    }
  },
  methods: {
    addTag(tag) {
      this.allTags.push(tag);
      this.tags.push(tag);
    },
    prepareMultiselect(obj) {
      let arr = [];
      for(let key in obj) {
        arr.push({id: key, label: obj[key]});
      }
      return arr;
    },
    stopSlugGen() {
      this.customSlug = true;
    },
    reset() {
      this.type = null;
      this.url = null;
      this.title = null;
      this.summary = null;
      this.language = null,
      this.categories = [];
      this.tags = [];
      this.access = 'public';
      this.accessInfo = null;
      this.email = null;
      this.customSlug = false;
    },
    async onSubmit(evt) {
      evt.preventDefault();
      try {
        await this.$axios.post('/add', this.getData());
        this.error = null;
        this.confirmation = "Thank you for your contribution. The data was stored successfully and should be available in the index within a day.";
        this.reset();
      } catch (error) {
        this.confirmation = null;
        this.error = error.response.data;
      }
    },
    getData() {
      let language = null;
      if (this.type === 'tutorial') {
        if (isPlainObject(this.language)) {
          language = this.language.code;
        }
      } else {
        language = this.language;
      }
      return {
        type: this.type,
        url: this.url,
        slug: this.slug,
        title: this.title,
        summary: this.summary,
        language,
        categories: this.categories,
        tags: this.tags,
        access: this.access,
        accessInfo: this.accessInfo,
        email: this.email,
      };
    }
  }
}
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>