<template>
  <b-button-group class="actions">
    <b-button class="copy-button" @click.prevent.stop="copy" :variant="copyColor" size="sm" title="Copy URL">
      <b-icon :icon="copyIcon" />
    </b-button>
    <b-button v-if="browserUrl" class="stac-browser-button" :href="browserUrl" :variant="variant" target="blank" size="sm" title="Open in STAC Browser">
      <b-icon icon="box-arrow-up-right" />
    </b-button>
  </b-button-group>
</template>

<script>
import { Clipboard } from "v-clipboard";

export default {
    name: "DataActionButtons",
    props: {
        copyText: {
            type: String,
            required: true
        },
        variant: {
            type: String,
            default: 'light'
        }
    },
    data() {
        return {
            status: null
        };
    },
    computed: {
        copyColor() {
            let variant = this.variant;
            if (this.status === true) {
                variant = 'success';
            }
            else if (this.status === false) {
                variant = 'danger';
            }
            if (this.variant.startsWith('outline-')) {
                variant = 'outline-' + variant;
            }
            return variant;
        },
        copyIcon() {
            if (this.status === true) {
                return 'clipboard-check';
            }
            else if (this.status === false) {
                return 'clipboard-x';
            }
            else {
                return 'clipboard';
            }
        },
        browserUrl() {
            try {
                const url = new URL(this.copyText);
                const parts = [];
                if (url.protocol !== 'https') {
                    parts.push(url.protocol + ':');
                }
                parts.push(url.host);
                parts.push(url.pathname.replace(/^\//, ''));
                const path = parts.join('/');
                if (url.search) {
                    path += url.search;
                }
                return 'https://radiantearth.github.io/stac-browser/#/external/' + path;
            } catch (error) {
                return null;
            }
        }
    },
    methods: {
        async copy() {
            try {
                // We need to store the focus and restore it again as the clipboard 
                // may steal the focus
                let focus = document.activeElement;
                await Clipboard.copy(this.copyText);
                focus.focus();
                this.status = true;
            } catch(error) {
                console.error(error);
                this.status = false;
            }
            setTimeout(() => this.status = null, 2500);
        }
    }
};
</script>

<style>
.actions .btn-sm {
  padding: 0.1rem 0.25rem;
}
</style>