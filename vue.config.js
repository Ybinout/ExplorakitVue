const { defineConfig } = require('@vue/cli-service');
const path = require('path');

module.exports = defineConfig({
  transpileDependencies: true,
  outputDir: path.resolve(__dirname, '../dist'),  // Placez le dossier dist un niveau au-dessus du dossier actuel

  // Ajoutez la configuration de Webpack pour gérer les alias
  configureWebpack: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),  // Définir l'alias '@' pour pointer vers 'src'
      },
    },
  },
});
