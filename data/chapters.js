export const chapters = {
  // --- EL HUB ---
  "hub": {
    id: "hub",
    title: "Las Puertas de Caraval",
    description: "Bienvenido a la Isla de los Sueños. El aire pesa con la promesa de la magia y la sombra de un juego imponente.",
    instructions: "Mantén presionado el arco de entrada para despertarlo y revelar la rosa.",
    // Aquí el botón apuntará a: router.push('/escena/tienda')
  },

  // --- CAPÍTULO 1 ---
  "tienda": {
    id: "tienda",
    title: "La Tienda de Ilusiones",
    description: "Todo tiene un precio.",
    instructions: "Explora la tienda y haz clic en el frasco para encontrar la máscara. Después, elige cómo pagar para continuar.",
    // Aquí habrá dos botones:
    // Pagar con Secreto -> router.push('/escena/carrusel')
    // Pagar con Sangre -> router.push('/escena/tuneles')
  },

  // --- CAPÍTULO 2 (LAS RAMIFICACIONES) ---
  "carrusel": {
    id: "carrusel",
    title: "El Carrusel Mágico",
    description: "El pago con tu verdad sincera te ha guiado hasta un torbellino de luces. Entre la bruma emerge un nuevo objeto de Legend. Observa con cautela: en Caraval, incluso las revelaciones visten el disfraz de la ilusión.",
    instructions: "Encuentra las siete cartas ocultas en el carrusel y ordénalas de menor a mayor.",
    // Aquí habrá dos botones:
    // Confiar en Julian -> router.push('/escena/final-a')
    // Desconfiar de Julian -> router.push('/escena/final-b')
  },
  "sombrero": {
    id: "sombrero",
    title: "El Sombrero de Copa",
    description: "El artefacto del Maestro de Ceremonias aguarda suspendido en la penumbra. En su interior se oculta la última pregunta decisiva para revelar el rostro tras la máscara.",
    instructions: "Arrastra el sombrero hacia arriba para darle la vuelta. Luego responde la adivinanza para descubrir su secreto.",
  },
  "tuneles": {
    id: "tuneles",
    title: "Los Túneles Subterráneos",
    description: "La sangre abrió los túneles bajo la feria. Allí encontrarás objetos que imitan la presencia de Legend, aunque no todos revelan su verdadera figura. Cada elección puede acercarte a una identidad distinta.",
    instructions: "Explora los túneles y decide si te enfrentas al contrato o si huyes antes de quedar atrapado.",
    // Aquí habrá dos botones:
    // Enfrentarse y firmar -> router.push('/escena/final-c')
    // Huir del contrato -> router.push('/escena/final-d')
  },

  // --- LOS 4 FINALES ---
  "final-a": {
    id: "final-a",
    title: "Final A: El Triunfo",
    description: "La figura está completa y cada fragmento pertenece al verdadero Legend. En el balcón del castillo, bajo un firmamento de estrellas eternas, el Maestro de Ceremonias te concede tu ansiado deseo.",
    instructions: "Espera a que aparezca el balcón y escribe un deseo para entregárselo a Legend."
  },
  "final-b": {
    id: "final-b",
    title: "Final B: La Locura",
    description: "La figura está casi completa, pero falta el fragmento decisivo. Estuviste muy cerca de descubrir quién es Legend. Como recompensa por haber llegado tan lejos, recibes un pequeño frasco lleno de magia.",
    instructions: "Lee el resultado de tu recorrido y vuelve al inicio cuando estés listo para comenzar otra partida."
  },
  "final-c": {
    id: "final-c",
    title: "Final C: El Contrato",
    description: "La figura está completa, pero algo no encaja. Los fragmentos forman una identidad distinta: una versión falsa, una presencia que imita a Legend. Frente a ti se revela una identidad fantasma.",
    instructions: "Observa la identidad revelada por el contrato y vuelve al inicio para intentar descubrir al verdadero Legend."
  },
  "final-d": {
    id: "final-d",
    title: "Final D: La Muerte",
    description: "Apenas quedan unos pocos fragmentos visibles. La figura de Legend permanece casi vacía y la feria ya no tiene nada más que mostrarte. Has sido eliminado de Caraval.",
    instructions: "Acepta el resultado de la partida y vuelve al inicio para intentarlo nuevamente."
  }
};
