<template>
  <div>
    <h2>简单的拖拽示例</h2>
    <draggable v-model="items" item-key="id">
      <template #item="{ element }">
        <div class="drag-item">{{ element.name }}</div>
      </template>
    </draggable>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import draggable from 'vuedraggable'

const items = ref([
  { id: 1, name: '任务1' },
  { id: 2, name: '任务2' },
  { id: 3, name: '任务3' },
])
</script>

<style scoped>
.drag-item {
  padding: 10px;
  margin: 5px;
  border: 1px solid #ccc;
  background: #f9f9f9;
  cursor: move;
}
</style>