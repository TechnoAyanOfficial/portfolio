const { mergeConfig } = require('vite');
const svgrPlugin = require('vite-plugin-svgr');
const path = require('path');

module.exports = {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: '@storybook/react',
  core: { builder: '@storybook/builder-vite' },
  async viteFinal(config, { configType }) {
    return mergeConfig(config, {
      resolve: {
        alias: [{ find: '@', replacement: path.resolve(__dirname, '../src') }],
      },
      assetsInclude: ['**/*.glb', '**/*.hdr'],
      plugins: [
        svgrPlugin({
          svgrOptions: {
            icon: false,
          },
        }),
      ],
      define: configType === 'PRODUCTION' ? config.define : { global: 'window' },
    });
  },
};
