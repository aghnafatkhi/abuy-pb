export interface DrawOptions {
  photos: string[]; // array of base64 images (in 2-player, combined, or we pass individual photos and combine them!)
  photos2?: string[]; // player 2 photos (if empty, we are in solo mode)
  overlayId: string;
  filterId: string;
  playerNames: string[];
  roomCode?: string;
}

export function applyCanvasFilter(ctx: CanvasRenderingContext2D, filterId: string) {
  switch (filterId) {
    case 'soft-pink':
    case 'rose':
      // Soft Romantic Pink Blush
      ctx.filter = 'sepia(18%) hue-rotate(320deg) saturate(135%) brightness(105%) contrast(102%)';
      break;
    case 'korean-white':
      // High brightness, smooth porcelain skin
      ctx.filter = 'brightness(112%) contrast(93%) saturate(106%)';
      break;
    case 'vintage':
    case 'vintage-warm':
      // Golden nostalgic warm film
      ctx.filter = 'sepia(45%) contrast(108%) saturate(115%) brightness(98%)';
      break;
    case 'rose-gold':
      // Rose gold metallic glow
      ctx.filter = 'sepia(25%) hue-rotate(335deg) saturate(140%) brightness(104%)';
      break;
    case 'retro-90s':
      // 90s Analog Polaroid
      ctx.filter = 'contrast(92%) saturate(112%) brightness(104%) hue-rotate(350deg)';
      break;
    case 'mono':
    case 'moody-mono':
      // Deep Classic B&W
      ctx.filter = 'grayscale(100%) contrast(130%) brightness(95%)';
      break;
    case 'peach-cream':
      // Soft peachy warmth
      ctx.filter = 'sepia(20%) hue-rotate(305deg) saturate(130%) brightness(106%)';
      break;
    case 'soft-cool':
      // Clean pastel cool blue-white
      ctx.filter = 'hue-rotate(185deg) saturate(85%) brightness(106%) contrast(98%)';
      break;
    case 'golden-hour':
      // Sunset golden glow
      ctx.filter = 'sepia(35%) saturate(145%) brightness(102%) contrast(105%)';
      break;
    case 'dreamy-fade':
      // Soft dreamy glow
      ctx.filter = 'brightness(108%) contrast(88%) saturate(95%)';
      break;
    case 'film-mono':
      // Soft vintage film mono
      ctx.filter = 'grayscale(100%) contrast(105%) brightness(102%)';
      break;
    case 'none':
    default:
      ctx.filter = 'none';
      break;
  }
}

// Draw a helper 4-pointed sparkle star for Y2K style
function drawSparkle(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save();
  ctx.fillStyle = '#fff963';
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.quadraticCurveTo(cx, cy, cx + size, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + size);
  ctx.quadraticCurveTo(cx, cy, cx - size, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - size);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Draw cute small heart
function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.fillStyle = '#ff7ea5';
  ctx.beginPath();
  ctx.moveTo(x, y + size / 4);
  ctx.quadraticCurveTo(x, y - size / 2, x + size / 2, y - size / 2);
  ctx.quadraticCurveTo(x + size, y - size / 2, x + size, y + size / 4);
  ctx.quadraticCurveTo(x + size, y + size * 0.75, x, y + size * 1.2);
  ctx.quadraticCurveTo(x - size, y + size * 0.75, x - size, y + size / 4);
  ctx.quadraticCurveTo(x - size, y - size / 2, x - size / 2, y - size / 2);
  ctx.quadraticCurveTo(x, y - size / 2, x, y + size / 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export async function draw2RStrip(options: DrawOptions): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context');

  // Standard high-quality 2R strip dimensions: 400px width x 1400px height
  canvas.width = 400;
  canvas.height = 1400;

  const { photos, photos2, overlayId, filterId, playerNames, roomCode } = options;
  const isSolo = !photos2 || photos2.length === 0;

  // 1. Draw Frame Background
  ctx.fillStyle = '#ffffff'; // Default classic white
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (overlayId === 'retro-cinema') {
    ctx.fillStyle = '#0a0a0b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw sprocket holes on left and right columns
    ctx.fillStyle = '#1e1e20';
    for (let y = 20; y < canvas.height; y += 45) {
      // Left sprocket
      ctx.beginPath();
      ctx.roundRect(12, y, 10, 18, 2);
      ctx.fill();
      // Right sprocket
      ctx.beginPath();
      ctx.roundRect(378, y, 10, 18, 2);
      ctx.fill();
    }
  } else if (overlayId === 'cyber-grid') {
    ctx.fillStyle = '#0f1013';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw tech background grid
    ctx.strokeStyle = 'rgba(0, 255, 128, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Outer cyber-glowing thin border
    ctx.strokeStyle = '#00ff80';
    ctx.lineWidth = 2;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
  } else if (overlayId === 'y2k-sparkle') {
    // Diagonal pink/violet gradient
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#ff9ebb');
    grad.addColorStop(0.5, '#e294fe');
    grad.addColorStop(1, '#a69eff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw little decorative sparkle stars in padding spaces
    drawSparkle(ctx, 35, 20, 8);
    drawSparkle(ctx, 365, 300, 12);
    drawSparkle(ctx, 40, 600, 10);
    drawSparkle(ctx, 360, 900, 14);
    drawSparkle(ctx, 50, 1200, 9);
    drawSparkle(ctx, 350, 1370, 10);
  } else if (overlayId === 'kawaii-sweet') {
    ctx.fillStyle = '#f6f0ff'; // Pastel sweet lavender
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw soft hearts and yellow stars around the edges
    drawHeart(ctx, 30, 25, 10);
    drawHeart(ctx, 360, 580, 12);
    drawHeart(ctx, 40, 1150, 8);

    ctx.fillStyle = '#fff280'; // soft stars
    ctx.font = '16px serif';
    ctx.fillText('★', 360, 40);
    ctx.fillText('☆', 35, 550);
    ctx.fillText('★', 355, 1100);
    ctx.fillText('☆', 50, 1350);
  } else if (overlayId === 'funky-meme') {
    ctx.fillStyle = '#ffde00'; // Vibrant comic yellow
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw comic half-tone dots pattern
    ctx.fillStyle = '#e6c800';
    for (let x = 10; x < canvas.width; x += 25) {
      for (let y = 10; y < canvas.height; y += 25) {
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 2. Load and draw the photos in the 4 slots
  // Photo slots geometry: 4 slots centered horizontally
  // Slot width = 340px (left offset = 30px), Slot height = 250px
  // In cinema-mode: width = 320px (offset = 40px)
  const slotW = overlayId === 'retro-cinema' ? 320 : 340;
  const slotH = 250;
  const leftX = overlayId === 'retro-cinema' ? 40 : 30;
  const spacing = 28;
  const topY = 40;

  for (let i = 0; i < 4; i++) {
    const slotY = topY + i * (slotH + spacing);

    // Fill placeholder if photo doesn't exist
    const photo1 = photos[i];
    const photo2 = isSolo ? null : photos2[i];

    if (!photo1 && !photo2) {
      // Draw dynamic placeholder
      ctx.fillStyle = '#efeff3';
      ctx.fillRect(leftX, slotY, slotW, slotH);
      ctx.fillStyle = '#8e8e93';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Shot ${i + 1}`, leftX + slotW / 2, slotY + slotH / 2);
      continue;
    }

    // Helper to load image asynchronously
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    try {
      if (isSolo) {
        // Draw Solo Photo
        if (photo1) {
          const img = await loadImage(photo1);
          
          ctx.save();
          // Set filter on context
          applyCanvasFilter(ctx, filterId);
          
          // Draw centered-cropped
          const imgRatio = img.width / img.height;
          const slotRatio = slotW / slotH;
          let sx = 0, sy = 0, sw = img.width, sh = img.height;
          if (imgRatio > slotRatio) {
            sw = img.height * slotRatio;
            sx = (img.width - sw) / 2;
          } else {
            sh = img.width / slotRatio;
            sy = (img.height - sh) / 2;
          }

          ctx.drawImage(img, sx, sy, sw, sh, leftX, slotY, slotW, slotH);
          ctx.restore();
        }
      } else {
        // Draw Online 2-Player Side-by-Side Photo
        // Left half is Player 1, Right half is Player 2
        const halfW = slotW / 2;
        const halfRatio = halfW / slotH;
        
        // Player 1 image (Left)
        if (photo1) {
          const img1 = await loadImage(photo1);
          ctx.save();
          applyCanvasFilter(ctx, filterId);
          let sx1 = 0, sy1 = 0, sw1 = img1.width, sh1 = img1.height;
          if (img1.width / img1.height > halfRatio) {
            sw1 = img1.height * halfRatio;
            sx1 = (img1.width - sw1) / 2;
          } else {
            sh1 = img1.width / halfRatio;
            sy1 = (img1.height - sh1) / 2;
          }
          ctx.drawImage(img1, sx1, sy1, sw1, sh1, leftX, slotY, halfW, slotH);
          ctx.restore();
        } else {
          ctx.fillStyle = '#fdf2f8';
          ctx.fillRect(leftX, slotY, halfW, slotH);
          ctx.fillStyle = '#db2777';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`P1 Pending`, leftX + halfW / 2, slotY + slotH / 2);
        }

        // Player 2 image (Right)
        if (photo2) {
          const img2 = await loadImage(photo2);
          ctx.save();
          applyCanvasFilter(ctx, filterId);
          let sx2 = 0, sy2 = 0, sw2 = img2.width, sh2 = img2.height;
          if (img2.width / img2.height > halfRatio) {
            sw2 = img2.height * halfRatio;
            sx2 = (img2.width - sw2) / 2;
          } else {
            sh2 = img2.width / halfRatio;
            sy2 = (img2.height - sh2) / 2;
          }
          ctx.drawImage(img2, sx2, sy2, sw2, sh2, leftX + halfW, slotY, halfW, slotH);
          ctx.restore();
        } else {
          ctx.fillStyle = '#f5f3ff';
          ctx.fillRect(leftX + halfW, slotY, halfW, slotH);
          ctx.fillStyle = '#7c3aed';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`P2 Pending`, leftX + halfW + halfW / 2, slotY + slotH / 2);
        }

        // Draw a crisp white vertical split line between them
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(leftX + halfW, slotY);
        ctx.lineTo(leftX + halfW, slotY + slotH);
        ctx.stroke();
      }

      // Draw Photo Borders / Frames depending on overlayId
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      
      if (overlayId === 'classic-white') {
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(leftX, slotY, slotW, slotH);
      } else if (overlayId === 'cyber-grid') {
        ctx.strokeStyle = '#00ff80';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(leftX, slotY, slotW, slotH);
        
        // Tech ticks in corners
        ctx.fillStyle = '#00ff80';
        ctx.fillRect(leftX - 3, slotY - 3, 10, 3);
        ctx.fillRect(leftX - 3, slotY - 3, 3, 10);
        ctx.fillRect(leftX + slotW - 7, slotY - 3, 10, 3);
        ctx.fillRect(leftX + slotW, slotY - 3, 3, 10);
      } else if (overlayId === 'y2k-sparkle') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(leftX, slotY, slotW, slotH);
      } else if (overlayId === 'kawaii-sweet') {
        ctx.strokeStyle = '#ffb3c6';
        ctx.lineWidth = 4;
        ctx.strokeRect(leftX, slotY, slotW, slotH);
      } else if (overlayId === 'funky-meme') {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeRect(leftX, slotY, slotW, slotH);

        // Draw a funny comic text overlay for the meme zone
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.font = 'bold 16px Impact, sans-serif';
        ctx.textAlign = 'left';
        
        const textOverlays = ['SAY CHEESE!', 'NICE POSE!', 'OMG WHAT?!', 'CRUSHED IT!'];
        const overlayText = textOverlays[i];
        
        // Draw speech bubble background
        ctx.beginPath();
        ctx.roundRect(leftX + 10, slotY + slotH - 40, ctx.measureText(overlayText).width + 20, 28, 4);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#000000';
        ctx.fillText(overlayText, leftX + 20, slotY + slotH - 21);
        ctx.restore();
      }
    } catch (err) {
      console.error('Failed to draw photo frame:', err);
    }
  }

  // 3. Draw Branding & Footer (y = 1180px to 1400px)
  const footerY = 1200;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#1d1d1f';

  const dateString = new Date().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '.');

  if (overlayId === 'classic-white') {
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 18px "Inter", sans-serif';
    ctx.fillText('W E B   P H O T O B O O T H', canvas.width / 2, footerY + 50);
    
    ctx.fillStyle = '#86868b';
    ctx.font = '12px monospace';
    const playersLabel = isSolo ? 'SOLO SESSION' : `ROOM ${roomCode || 'ONLINE'}`;
    ctx.fillText(`${dateString} • ${playersLabel}`, canvas.width / 2, footerY + 80);
    ctx.fillText('DESIGNED IN CLOUD STUDIO', canvas.width / 2, footerY + 105);
  } else if (overlayId === 'retro-cinema') {
    ctx.fillStyle = '#ffcc00'; // Cinema gold
    ctx.font = 'bold 19px Georgia, serif';
    ctx.fillText('★ KODAK FILM MEMORY ★', canvas.width / 2, footerY + 50);
    
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '12px "Courier New", monospace';
    ctx.fillText(`CINE-STRIP ID: ${roomCode || 'SOLO'}-${dateString}`, canvas.width / 2, footerY + 80);
    ctx.fillText('ISO 400 • F/2.8 • FRAME #04', canvas.width / 2, footerY + 105);
  } else if (overlayId === 'cyber-grid') {
    ctx.fillStyle = '#00ff80';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('SYS_OK // PHOTO_LOG_v4.0', canvas.width / 2, footerY + 45);

    // Draw stylized fake barcode
    ctx.fillStyle = '#00ff80';
    const startX = canvas.width / 2 - 100;
    const barY = footerY + 65;
    const barHeight = 25;
    for (let xOffset = 0; xOffset < 200; xOffset += 4) {
      const randWidth = (xOffset % 12 === 0 || xOffset % 28 === 0) ? 3 : 1;
      ctx.fillRect(startX + xOffset, barY, randWidth, barHeight);
    }
    ctx.font = '9px monospace';
    ctx.fillText(`UID-${roomCode || 'SOLO'}-${Date.now().toString().slice(-8)}`, canvas.width / 2, footerY + 105);
  } else if (overlayId === 'y2k-sparkle') {
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.font = 'bold 24px "Comic Sans MS", cursive, sans-serif';
    ctx.fillText('★ P r i n c e s s ★', canvas.width / 2, footerY + 50);
    ctx.shadowBlur = 0; // reset
    
    ctx.fillStyle = '#331a66';
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.fillText(`★ SWEET MEMORIES ★ ${dateString}`, canvas.width / 2, footerY + 85);
    ctx.fillText('Y2K GLAMOUR CAMERA', canvas.width / 2, footerY + 105);
  } else if (overlayId === 'kawaii-sweet') {
    ctx.fillStyle = '#ff7ea5';
    ctx.font = 'italic bold 21px sans-serif';
    ctx.fillText('sweet happy day ♡', canvas.width / 2, footerY + 50);
    
    ctx.fillStyle = '#a680ff';
    ctx.font = '12px sans-serif';
    ctx.fillText(`memory log • ${dateString}`, canvas.width / 2, footerY + 80);
    ctx.fillText('cute friendship story ☆', canvas.width / 2, footerY + 105);
  } else if (overlayId === 'funky-meme') {
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 26px "Impact", sans-serif';
    ctx.fillText('M E M E   Z O N E', canvas.width / 2, footerY + 50);
    
    ctx.font = '14px Impact, sans-serif';
    ctx.fillText(`RATED S FOR SILLY // ROOM: ${roomCode || 'SOLO'}`, canvas.width / 2, footerY + 80);
    ctx.fillText(`TAKEN ON: ${dateString}`, canvas.width / 2, footerY + 105);
  }

  return canvas;
}

export async function draw4RLayout(options: DrawOptions): Promise<HTMLCanvasElement> {
  // Borderless 4R layout: two 2R strips (400x1400 each) placed seamlessly side-by-side
  // Total dimensions: 800px width x 1400px height (Borderless full bleed)
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context');

  canvas.width = 800;
  canvas.height = 1400;

  // Generate the 2R strip canvas
  const stripCanvas = await draw2RStrip(options);

  // Draw Left Strip (borderless x=0, y=0)
  ctx.drawImage(stripCanvas, 0, 0, 400, 1400);

  // Draw Right Strip duplicate (borderless x=400, y=0)
  ctx.drawImage(stripCanvas, 400, 0, 400, 1400);

  return canvas;
}
