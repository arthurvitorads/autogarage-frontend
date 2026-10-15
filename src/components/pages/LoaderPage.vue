
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUtilStore } from '../../stores/util.store';  

const utilStore = useUtilStore()
const { loading } = storeToRefs(utilStore)
</script>

<template>
    <div
      v-if="loading"
      class="fixed top-0 left-0 w-full h-full flex flex-col justify-center items-center owner-loader"
      role="status"
      aria-live="polite"
      aria-label="Carregando"
      >
        <div class="owner-loader-animation"></div>
  </div>
</template>

<style scoped lang="scss">
  .owner-loader {
    position: fixed;
    inset: 0;
    z-index: 99999;

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    width: 100%;
    height: 100dvh;

    background-color: rgb(245 245 245 / 10%);
    backdrop-filter: blur(3px);
  }

  .owner-loader-animation {
    width: 15px;
    aspect-ratio: 1;
    border-radius: 50%;
    background: #6b7280;
    animation: load 1.2s infinite linear alternate;
  }

  .loader-text {
    margin-top: 2.5rem;
    color: #4b5563;
    font-size: 0.95rem;
    font-weight: 500;
    letter-spacing: 0.02em;
  }

@keyframes load {
  0% {
    box-shadow:
      70px 0 #d1d5db,
      35px 0 #d1d5db,
      -35px 0 #d1d5db,
      -70px 0 #6b7280;
    background: #d1d5db;
  }

  25% {
    box-shadow:
      70px 0 #d1d5db,
      35px 0 #d1d5db,
      -35px 0 #6b7280,
      -70px 0 #d1d5db;
    background: #d1d5db;
  }

  50% {
    box-shadow:
      70px 0 #d1d5db,
      35px 0 #d1d5db,
      -35px 0 #d1d5db,
      -70px 0 #d1d5db;
    background: #6b7280;
  }

  75% {
    box-shadow:
      70px 0 #d1d5db,
      35px 0 #6b7280,
      -35px 0 #d1d5db,
      -70px 0 #d1d5db;
    background: #d1d5db;
  }

  100% {
    box-shadow:
      70px 0 #6b7280,
      35px 0 #d1d5db,
      -35px 0 #d1d5db,
      -70px 0 #d1d5db;
    background: #d1d5db;
  }
}
</style>