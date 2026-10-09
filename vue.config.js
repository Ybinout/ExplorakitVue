const { defineConfig } = require('@vue/cli-service');
const path = require('path');

module.exports = defineConfig({
  transpileDependencies: true,
  outputDir: path.resolve(__dirname, '../dist'),  // Placez le dossier dist un niveau au-dessus du dossier actuel

  // Ajoutez la configuration de Webpack pour gérer les alias
  chainWebpack: (config) => {
    config.plugin('copy').tap(([options]) => {
      options.patterns.push(
        { from: path.resolve(__dirname, 'src/assets/dp2'), to: path.resolve(__dirname, '../dist/img/pokemon/front') },
        { from: path.resolve(__dirname, 'src/assets/back'), to: path.resolve(__dirname, '../dist/img/pokemon/back') }
      );
      return [options];
    });
  },

  configureWebpack: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),  // Définir l'alias '@' pour pointer vers 'src'
      },
    },
  },
});
