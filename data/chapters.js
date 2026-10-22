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
    description: "Todo tiene un precio. ¿Cómo vas a pagar por la información sobre Legend?",
    // Aquí habrá dos botones:
    // Pagar con Secreto -> router.push('/escena/carrusel')
    // Pagar con Sangre -> router.push('/escena/tuneles')
  },

  // --- CAPÍTULO 2 (LAS RAMIFICACIONES) ---
  "carrusel": {
    id: "carrusel",
    title: "El Carrusel Mágico",
    description: "Ruta A: Pagaste con un secreto sincero. Te encuentras con algo.",
    // Aquí habrá dos botones:
    // Confiar en Julian -> router.push('/escena/final-a')
    // Desconfiar de Julian -> router.push('/escena/final-b')
  },
  "tuneles": {
    id: "tuneles",
    title: "Los Túneles Subterráneos",
    description: "Ruta B: Pagaste con sangre. Recibes una carta directa de Legend.",
    // Aquí habrá dos botones:
    // Enfrentarse y firmar -> router.push('/escena/final-c')
    // Huir del contrato -> router.push('/escena/final-d')
  },

  // --- LOS 4 FINALES ---
  "final-a": {
    id: "final-a",
    title: "Final A: El Triunfo",
    description: "El Balcón del Castillo. Encontraste a Legend y obtuviste el deseo."
  },
  "final-b": {
    id: "final-b",
    title: "Final B: La Locura",
    description: "El Caos. Al desconfiar a destiempo, perdiste el control de la realidad."
  },
  "final-c": {
    id: "final-c",
    title: "Final C: El Contrato",
    description: "Escritorio Privado. Pagaste tu deuda firmando el contrato con Legend."
  },
  "final-d": {
    id: "final-d",
    title: "Final D: La Muerte",
    description: "El Abismo. Intentaste huir y caíste en la trampa mortal de la ilusión."
  }
};
