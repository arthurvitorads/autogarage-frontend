
<script setup lang="ts">
import Card from 'primevue/card'
import Button from 'primevue/button'
</script>

<template>
  <section class="flex flex-column gap-3">
    <div>
      <h1>Home</h1>
      <p>Bem-vindo ao AutoGarage.</p>
    </div>

    <Card>
      <template #title>
        Bem-vindo ao AutoGarage!
      </template>

      <template #content>
        <p>
          Gerencie ordens de serviço, pessoas e estoque em um único lugar.
        </p>

        <div class="flex flex-wrap gap-2 mt-3">
          <Button
            label="Pessoas"
            icon="pi pi-users"
            @click="$router.push('/pessoas')"
          />

          <Button
            label="Ordens de serviço"
            icon="pi pi-wrench"
            severity="secondary"
            outlined
          />
        </div>
      </template>
    </Card>
  </section>
</template>