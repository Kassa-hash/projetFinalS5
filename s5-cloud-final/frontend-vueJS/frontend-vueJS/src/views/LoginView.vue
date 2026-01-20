<template>
  <div class="page-wrapper">
    <LoginForm />
  </div>
</template>

<script setup lang="ts">
import LoginForm from '@/components/LoginForm.vue'
</script>

<style scoped>
.page-wrapper {
  width: 100%;
  min-height: calc(100vh - 60px);
  margin: 0;
  padding: 0;
}
</style>
