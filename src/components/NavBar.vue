<template>
   <nav class="nav">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
  <input id="menu" type="checkbox">
  <label for="menu">Menu</label>
  <ul class="menu">
    <li>
      <a href="#0">
        <!-- <span>Option</span> -->
        <i class="fas fa-cog" aria-hidden="true"></i>
      </a>
    </li>
    <li>
      <a href="#0">
        <!-- <span>Projects</span> -->
        <i class="" aria-hidden="true"></i>
      </a>
    </li>
    <li>
      <a href="#0">
        <!-- <span>Clients</span> -->
        <i class="" aria-hidden="true"></i>
      </a>
    </li>
    <li>
      <a href="#0">
        <!-- <span>Contact</span> -->
        <i class="fas fa-user" aria-hidden="true"></i>
      </a>
    </li>
  </ul>
</nav>
  </template>
  
  <script>
//   import axios from 'axios';
  
  export default {
    data() {
      return {
        user: {
          nom: '',
          mdp: ''
        }
      };
    },
    methods: {
      
    }
  };
  </script>
  <style>
 /* RESET/BASIC STYLES
–––––––––––––––––––––––––––––––––––––––––––––––––– */
@import url('https://fonts.googleapis.com/css2?family=Inter&display=swap');

:root {
  --white: #47c2d8;
  --light-grey: #54b8da;
  --violet: #4e41e6;
  --dark-violet: #5146e1;
  --black: #2adce2;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

ul {
  list-style: none;
}

a {
  color: inherit;
  text-decoration: none;
}



.notification {
  position: absolute;
  top: 0;
  right: 0;
  padding: 10px;
  background: var(--violet);
}

/* MAIN STYLES
–––––––––––––––––––––––––––––––––––––––––––––––––– */
.nav {
  position: relative;
  display: flex;
  justify-content: center;
  max-width: 400px;
  padding-bottom: 20px;
  border-radius: 5px 5px 25px 25px;
  margin: 100px auto 0;
  color: white;
  /* background: var(--white); */
  /* box-shadow: rgb(50 50 93 / 10%) 0 30px 60px -12px,
    rgb(0 0 0 / 15%) 0 18px 36px -18px; */
}

.nav [type="checkbox"] {
  position: absolute;
  left: -9999px;
}

.nav [type="checkbox"] + label {
  position: relative;
  width: 75px;
  height: 75px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: pointer;
  z-index: 1;
  background: var(--violet);
  border-radius: 50%;
  transform: translateY(-50%);
  transition: all 0.2s;
}

.nav [type="checkbox"] + label:hover {
  background: var(--dark-violet);
}

.menu li {
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  transition: all 0.4s;
}

.menu li:nth-child(1) {
  transition-delay: 0.2s;
}

.menu li:nth-child(2) {
  transition-delay: 0.15s;
}

.menu li:nth-child(3) {
  transition-delay: 0.1s;
}

.menu li:nth-child(4) {
  transition-delay: 0.05s;
}

.menu li a {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--violet);
}

.menu li a span {
  position: absolute;
  top: 0;
  left: 0;
  transform: translateY(calc(-100% - 5px));
  width: 100%;
  font-size: 13px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s;
  color: var(--black);
  font-weight: bold;
}

.nav input:checked + label {
  background: var(--black);
  transform: translateY(calc(-50% + 4px));
}

.nav input:checked ~ .menu li:nth-child(1) {
  top: 140px;
  transition-delay: 0.1s;
}

.nav input:checked ~ .menu li:nth-child(2) {
  top: 90px;
  left: calc(50% - 75px);
  transition-delay: 0.2s;
}

.nav input:checked ~ .menu li:nth-child(3) {
  top: 90px;
  left: calc(50% + 75px);
  transition-delay: 0.3s;
}

.nav input:checked ~ .menu li:nth-child(4) {
  top: 70px;
  transition-delay: 0.4s;
}

.nav input:checked ~ .menu li a span {
  opacity: 1;
  transition-delay: 0.9s;
}

/* FOOTER STYLES
–––––––––––––––––––––––––––––––––––––––––––––––––– */
.page-footer {
  position: fixed;
  right: 0;
  bottom: 60px;
  display: flex;
  align-items: center;
  padding: 5px;
  color: var(--black);
}

.page-footer a {
  display: flex;
  margin-left: 4px;
}

  </style>