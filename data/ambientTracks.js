const AMBIENT_TRACKS = {
  "/": "/audio/home.mp3",
  "/archivo/hub": "/audio/hub.mp3",
  "/archivo/tienda": "/audio/tienda.mp3",
  "/archivo/carrusel": "/audio/carrusel.mp3",
  "/archivo/sombrero": "/audio/sombrero.mp3",
  "/archivo/final-a": "/audio/finalA.mp3",
};

export function getAmbientTrack(pathname) {
  return AMBIENT_TRACKS[pathname] || null;
}
