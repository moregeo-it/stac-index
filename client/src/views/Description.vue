<template>
  <div class="styled-description" :class="{compact: compact}" v-html="formatted" />
</template>

<script>
import * as commonmark from 'commonmark';

export default {
	name: 'Description',
	props: {
		description: {
			type: String,
			default: ''
		},
		preprocessor: {
			type: Function,
			default: null
		},
		processor: {
			type: Function,
			default: null
		},
		processUrl: {
			type: String,
			default: null
		},
		compact: {
			type: Boolean,
			default: false
		}
	},
  computed: {
    formatted() {
      return this.markup(this.description);
    }
  },
	methods: {
		markup(text) {
			if (typeof text !== 'string') {
				return '';
			}

			// Parse CommonMark
			var reader = new commonmark.Parser();
			var writer = new commonmark.HtmlRenderer({safe: true, smart: true});
			if (typeof this.preprocessor === 'function') {
				text = this.preprocessor(text);
			}
			var parsed = reader.parse(text);
			var rendered = writer.render(parsed);
			if (typeof this.processor === 'function') {
				rendered = this.processor(rendered);
			}

			return rendered;
		}
	}
};
</script>

<style lang="scss">
.styled-description {
	line-height: 1.25em;

	code {
		color: maroon;
		display: inline-block;
		padding: 0 0.1em;
	}
	pre {
		background-color: #eee;
		width: 100%;
		border: 1px solid #ccc;
		max-height: 15em;
		overflow-y: auto;
		
		code {
			background-color: transparent; 
			display: block;
			margin: 0.5em;
		}
	}
	&.compact {
		pre {
			max-height: 7em;
			width: auto;
			max-width: 100%;
		}
		p {
			margin: 0.5em 0;

			&:first-child {
				margin-top: 0;
			}
			&:last-child {
				margin-bottom: 0;
			}
		}
	}
}
</style>
