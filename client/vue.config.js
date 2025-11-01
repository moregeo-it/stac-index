const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const Icons = require('unplugin-icons/webpack');
const { FileSystemIconLoader } = require('unplugin-icons/loaders');
const Components = require('unplugin-vue-components/webpack');
const IconsResolver = require('unplugin-icons/resolver');
const { BootstrapVueNextResolver } = require('bootstrap-vue-next/resolvers');

module.exports = {
  chainWebpack: webpackConfig => {
    webpackConfig.module
      .rule('vue')
      .use('vue-loader')
      .tap(options => {
        if (!options.compilerOptions) {
          options.compilerOptions = {};
        }
        options.compilerOptions.whitespace = 'preserve';
        return options;
      });
  },
  configureWebpack: {
    resolve: {
      fallback: {
        'fs/promises': false
      }
    },
    plugins: [
      new NodePolyfillPlugin({
        includeAliases: ['url', 'Buffer', 'path']
      }),
      Components({
        dirs: [
          './src',
          './node-modules/stac-browser/src',
        ],
        resolvers: [
          BootstrapVueNextResolver({
            'BContainer': true,
            'BRow': true,
            'BCol': true,
            'BAlert': true,
            'BButton': true,
            'BButtonGroup': true,
            'BBadge': true,
            'BDropdown': true,
            'BDropdownItem': true,
            'BDropdownItemButton': true,
            'BForm': true,
            'BFormGroup': true,
            'BFormInput': true,
            'BFormSelect': true,
            'BFormCheckbox': true,
            'BFormRadio': true,
            'BFormRadioGroup': true,
            'BInputGroup': true,
            'BListGroup': true,
            'BListGroupItem': true,
            'BPopover': true,
            'BSpinner': true,
          }),
          IconsResolver({ 
            prefix: false,
            enabledCollections: ['bi'],
            alias: {
              'b-icon': 'bi'
            },
            customCollections: ['share'],
          })
        ]
      }),
      Icons({
        compiler: 'vue3',
        customCollections: {
          'share': FileSystemIconLoader('./node-modules/stac-browser/src/media/'),
        },
      }),
    ]
  },
}