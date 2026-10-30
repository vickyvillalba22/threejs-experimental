export const chapters = {
  // --- EL HUB ---
  "hub": {
    id: "hub",
    title: "Las Puertas de Caraval",
    description: "Bienvenido a la Isla de los Sueños. Recuerda, es solo un juego.",
    // Aquí el botón apuntará a: router.push('/escena/tienda')
  },

  // --- CAPÍTULO 1 ---
  "tienda": {
    id: "tienda",
    title: "La Tienda de Ilusiones",
    description: "Todo tiene un precio. Entre estos objetos se esconde un fragmento de la figura de Legend. Elige cómo pagar para descubrir qué parte de él lograrás revelar.",
    // Aquí habrá dos botones:
    // Pagar con Secreto -> router.push('/escena/carrusel')
    // Pagar con Sangre -> router.push('/escena/tuneles')
  },

  // --- CAPÍTULO 2 (LAS RAMIFICACIONES) ---
  "carrusel": {
    id: "carrusel",
    title: "El Carrusel Mágico",
    description: "El secreto sincero te ha conducido hasta el carrusel. Sus luces revelan otro objeto que podría completar la figura verdadera de Legend. Observa con cuidado: no todo lo que aparece aquí pertenece a él.",
    // Aquí habrá dos botones:
    // Confiar en Julian -> router.push('/escena/final-a')
    // Desconfiar de Julian -> router.push('/escena/final-b')
  },
  "sombrero": {
    id: "sombrero",
    title: "El Sombrero de Copa",
    description: "El último objeto espera frente a ti. Dentro del sombrero se esconde una pregunta decisiva.",
  },
  "tuneles": {
    id: "tuneles",
    title: "Los Túneles Subterráneos",
    description: "La sangre abrió los túneles bajo la feria. Allí encontrarás objetos que imitan la presencia de Legend, aunque no todos revelan su verdadera figura. Cada elección puede acercarte a una identidad distinta.",
    // Aquí habrá dos botones:
    // Enfrentarse y firmar -> router.push('/escena/final-c')
    // Huir del contrato -> router.push('/escena/final-d')
  },

  // --- LOS 4 FINALES ---
  "final-a": {
    id: "final-a",
    title: "Final A: El Triunfo",
    description: "La figura está completa y cada fragmento pertenece al mismo Legend. En el balcón del castillo, el maestro de ceremonias aparece ante ti. Has descubierto quién es y, como recompensa, te concede un deseo."
  },
  "final-b": {
    id: "final-b",
    title: "Final B: La Locura",
    description: "La figura está casi completa, pero falta el fragmento decisivo. Estuviste muy cerca de descubrir quién es Legend. Como recompensa por haber llegado tan lejos, recibes un pequeño frasco lleno de magia."
  },
  "final-c": {
    id: "final-c",
    title: "Final C: El Contrato",
    description: "La figura está completa, pero algo no encaja. Los fragmentos forman una identidad distinta: una versión falsa, una presencia que imita a Legend. Frente a ti se revela una identidad fantasma."
  },
  "final-d": {
    id: "final-d",
    title: "Final D: La Muerte",
    description: "Apenas quedan unos pocos fragmentos visibles. La figura de Legend permanece casi vacía y la feria ya no tiene nada más que mostrarte. Has sido eliminado de Caraval."
  }
};
