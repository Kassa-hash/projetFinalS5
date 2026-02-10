<!-- src/views/SyncFirebaseView.vue -->
<template>
  <div class="sync-view">
    <h1>🔄 Synchronisation Firebase → PostgreSQL</h1>
    <FirebaseDataViewer />
  </div>
</template>

<script setup lang="ts">
import FirebaseDataViewer from '@/components/FirebaseDataViewer.vue'
</script>

<style scoped>
.sync-view {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}
</style>