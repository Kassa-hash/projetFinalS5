<template>
  <div>
    <button @click="synchroniser">Synchronisation</button>

    <ul>
      <li v-for="p in problemes" :key="p.id">
        {{ p.titre }} - {{ p.statut }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { recupererProblemes, envoyerProbleme } from './syncService.js';

const problemes = ref([]);

// Simulation : nouvelles données locales à envoyer
const nouveauxProblemes = [
  {
    titre: "Trottoir abîmé",
    description: "Trottoir près du marché cassé",
    statut: "nouveau",
    date_signalement: new Date(),
    type_probleme: "trottoir",
    type_route: "route secondaire"
  }
];

async function synchroniser() {
  // 1️⃣ Envoi des nouveaux problèmes locaux
  for (const p of nouveauxProblemes) {
    await envoyerProbleme(p);
  }

  // 2️⃣ Récupération des problèmes en ligne
  problemes.value = await recupererProblemes();
}
</script>
