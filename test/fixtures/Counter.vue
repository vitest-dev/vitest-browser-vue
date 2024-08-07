<script setup>
import { ref } from 'vue'

const props = defineProps({
  initialCount: {
    type: Number,
    default: 0
  }
})

const count = ref(props.initialCount)

const increment = () => {
  count.value++
}
</script>

<template>
  <div>Count is {{ count }}</div>
  <button @click="increment">Increment</button>
</template>
