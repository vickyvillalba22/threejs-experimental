import * as THREE from "three";

function drawText(context, text, x, y, revealProgress, canvasHeight) {
  const revealY = revealProgress * (canvasHeight + 100);
  const revealStart = y - 48;
  const alpha = Math.max(0, Math.min(1, (revealY - revealStart) / 48));
  if (alpha <= 0) return;

  context.save();
  context.globalAlpha *= alpha;
  context.fillText(text, x, y);
  context.restore();
}

function drawWrappedText(context, text, x, y, maxWidth, lineHeight, revealProgress, canvasHeight) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && line) {
      drawText(context, line, x, currentY, revealProgress, canvasHeight);
      line = word;
      currentY += lineHeight;
    } else {
      line = candidate;
    }
  });

  if (line) {
    drawText(context, line, x, currentY, revealProgress, canvasHeight);
    currentY += lineHeight;
  }

  return currentY;
}

function drawLetterCanvas(canvas, showContent, revealProgress) {
  const context = canvas.getContext("2d");
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
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
    drawText(context, "DE LA OFICINA DEL MAESTRO DE CEREMONIAS", canvas.width / 2, 150, revealProgress, canvas.height);
    context.font = "700 100px Georgia, serif";
    drawText(context, "Isla de los Sueños", canvas.width / 2, 255, revealProgress, canvas.height);

    context.strokeStyle = "rgba(115, 45, 43, 0.45)";
    context.lineWidth = 3;
    const separatorAlpha = Math.max(0, Math.min(1, (revealProgress * (canvas.height + 100) - 262) / 48));
    context.globalAlpha = separatorAlpha;
    context.beginPath();
    context.moveTo(margin + 120, 310);
    context.lineTo(canvas.width - margin - 120, 310);
    context.stroke();
    context.globalAlpha = 1;

    context.textAlign = "left";
    context.fillStyle = "#3f2926";
    context.font = "54px Georgia, serif";
    let currentY = 390;
    currentY = drawWrappedText(context, "Estimado participante:", margin, currentY, textWidth, 72, revealProgress, canvas.height) + 30;
    currentY = drawWrappedText(
      context,
      "Has sido invitado a cruzar las fronteras de Caraval, donde los deseos cobran vida y la ilusión se confunde con la realidad.",
      margin,
      currentY,
      textWidth,
      72,
      revealProgress,
      canvas.height,
    ) + 30;

    context.fillStyle = "#70252c";
    context.font = "700 42px Georgia, serif";
    drawText(context, "Su Cometido:", margin, currentY, revealProgress, canvas.height);
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
      revealProgress,
      canvas.height,
    ) + 30;
    currentY = drawWrappedText(
      context,
      "La magia tiene un precio. No todo lo que brilla pertenece a Legend. Antes de comenzar, recuerda nuestra única advertencia:",
      margin,
      currentY,
      textWidth,
      72,
      revealProgress,
      canvas.height,
    ) + 32;

    context.textAlign = "center";
    context.fillStyle = "#70252c";
    context.font = "italic 700 54px Georgia, serif";
    drawText(context, '“Recuerda, es solo un juego...”', canvas.width / 2, currentY, revealProgress, canvas.height);
    context.textAlign = "right";
    context.font = "italic 46px Georgia, serif";
    drawText(context, "— Legend", canvas.width - margin, currentY + 70, revealProgress, canvas.height);

    context.textAlign = "center";
    context.fillStyle = "#70252c";
    context.font = "700 34px Georgia, serif";
    drawText(context, "MANTENÉ PRESIONADO SOBRE EL SELLO PARA PINTARLO", canvas.width / 2, canvas.height - 120, revealProgress, canvas.height);
  } else {
    context.textAlign = "center";
    context.fillStyle = "rgba(79, 32, 36, 0.5)";
    context.font = "italic 42px Georgia, serif";
    context.fillText("La tinta espera una mano.", canvas.width / 2, canvas.height / 2);
  }

}

export function createLetterTexture(showContent, revealProgress = 1) {
  const canvas = document.createElement("canvas");
  canvas.width = 1536;
  canvas.height = 2048;
  drawLetterCanvas(canvas, showContent, revealProgress);

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

export function updateLetterTexture(texture, showContent, revealProgress) {
  drawLetterCanvas(texture.image, showContent, revealProgress);
  texture.needsUpdate = true;
}
