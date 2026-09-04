<script setup lang="ts">
const emit = defineEmits<{
  submit: [value: string]
}>()
</script>

<template>
  <button @click="emit('submit', 'ok')">
    Submit
  </button>
</template>
