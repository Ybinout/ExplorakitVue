const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  outputDir: '../dist'  // Placez le dossier dist un niveau au-dessus du dossier actuel
})
