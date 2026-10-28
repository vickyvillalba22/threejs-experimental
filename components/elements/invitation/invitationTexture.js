import * as THREE from "three";

function drawWrappedText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && line) {
      context.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = candidate;
    }
  });

  if (line) {
    context.fillText(line, x, currentY);
    currentY += lineHeight;
  }

  return currentY;
}

export function createLetterTexture(showContent) {
  const canvas = document.createElement("canvas");
  canvas.width = 1536;
  canvas.height = 2048;
  const context = canvas.getContext("2d");
  context.translate(canvas.width, 0);
  context.scale(-1, 1);
  const margin = 120;
  const textWidth = canvas.width - margin * 2;

  context.fillStyle = "#f4e9c7";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const paperGradient = context.createRadialGradient(768, 950, 100, 768, 950, 1400);
  paperGradient.addColorStop(0, "rgba(255, 252, 226, 0.28)");
  paperGradient.addColorStop(1, "rgba(120, 74, 36, 0.18)");
  context.fillStyle = paperGradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = "rgba(76, 39, 35, 0.35)";
  context.lineWidth = 5;
  context.strokeRect(70, 70, canvas.width - 140, canvas.height - 140);
  context.strokeStyle = "rgba(76, 39, 35, 0.12)";
  context.lineWidth = 2;
  context.strokeRect(94, 94, canvas.width - 188, canvas.height - 188);

  if (showContent) {
    context.textAlign = "center";
    context.fillStyle = "#4f2024";
    context.font = "600 44px Georgia, serif";
    context.fillText("DE LA OFICINA DEL MAESTRO DE CEREMONIAS", canvas.width / 2, 150);
    context.font = "700 100px Georgia, serif";
    context.fillText("Isla de los Sueños", canvas.width / 2, 255);

    context.strokeStyle = "rgba(115, 45, 43, 0.45)";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(margin + 120, 310);
    context.lineTo(canvas.width - margin - 120, 310);
    context.stroke();

    context.textAlign = "left";
    context.fillStyle = "#3f2926";
    context.font = "54px Georgia, serif";
    let currentY = 390;
    currentY = drawWrappedText(context, "Estimado participante:", margin, currentY, textWidth, 72) + 30;
    currentY = drawWrappedText(
      context,
      "Has sido invitado a cruzar las fronteras de Caraval, donde los deseos cobran vida y la ilusión se confunde con la realidad.",
      margin,
      currentY,
      textWidth,
      72,
    ) + 30;

    context.fillStyle = "#70252c";
    context.font = "700 42px Georgia, serif";
    context.fillText("Su Cometido:", margin, currentY);
    currentY += 76;
    context.fillStyle = "#3f2926";
    context.font = "54px Georgia, serif";
    currentY = drawWrappedText(
      context,
      "Recorre la feria y encuentra los objetos que guardan los fragmentos de Legend. Solo los correctos revelarán su verdadera identidad.",
      margin,
      currentY,
      textWidth,
      72,
    ) + 30;
    currentY = drawWrappedText(
      context,
      "La magia tiene un precio. No todo lo que brilla pertenece a Legend. Antes de comenzar, recuerda nuestra única advertencia:",
      margin,
      currentY,
      textWidth,
      72,
    ) + 32;

    context.textAlign = "center";
    context.fillStyle = "#70252c";
    context.font = "italic 700 54px Georgia, serif";
    context.fillText('“Recuerda, es solo un juego...”', canvas.width / 2, currentY);
    context.textAlign = "right";
    context.font = "italic 46px Georgia, serif";
    context.fillText("— Legend", canvas.width - margin, currentY + 70);

    context.textAlign = "center";
    context.fillStyle = "#70252c";
    context.font = "700 34px Georgia, serif";
    context.fillText("MANTENÉ PRESIONADO SOBRE EL SELLO PARA PINTARLO", canvas.width / 2, canvas.height - 120);
  } else {
    context.textAlign = "center";
    context.fillStyle = "rgba(79, 32, 36, 0.5)";
    context.font = "italic 42px Georgia, serif";
    context.fillText("La tinta espera una mano.", canvas.width / 2, canvas.height / 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.center.set(0.5, 0.5);
  texture.rotation = 0;
  texture.repeat.set(1, 1);
  texture.offset.set(0, 0);
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}
