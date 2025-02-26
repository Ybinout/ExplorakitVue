<template>
    <div class="health-bar-container">
      <div class="health-bar" :style="healthBarStyle"></div>
    </div>
  </template>
  
  <script>
  export default {
    props: ['currentHp', 'hpMax'],
    computed: {
      healthBarStyle() {
        let percentage = (this.currentHp / this.hpMax) * 100;
        let color = this.getHealthBarColor(percentage);
  
        return {
          width: `${percentage}%`,
          backgroundColor: color,
        };
      },
    },
    methods: {
      getHealthBarColor(percentage) {
        if (percentage > 50) {
          return `rgb(0, 255, 0)`; // Vert
        } else if (percentage > 20) {
          return `rgb(255, 165, 0)`; // Orange
        } else {
          return `rgb(255, 0, 0)`; // Rouge
        }
      },
    },
  };
  </script>
  
  <style scoped>
  .health-bar-container {
    width: 100%;
    height: 20px;
    background-color: #eee;
  }
  
  .health-bar {
    height: 100%;
    transition: width 0.5s ease, background-color 0.5s ease;
  }
  </style>
  