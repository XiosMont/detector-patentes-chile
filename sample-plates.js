/**
 * ChilePlate Forensics — Sample Chilean License Plate Generator
 * Generates high-fidelity canvas plates representing authentic and adulterated Chilean plates.
 */

const SAMPLE_CASES = [
    {
        id: 'sample_authentic_new',
        name: 'GK · TL · 42',
        badge: 'Auténtica',
        badgeType: 'tag-authentic',
        desc: 'Placa oficial formato nuevo (2007+). Cumple tipografía, sello y consonantes.',
        expectedText: 'GKTL42',
        formatType: 'NEW_2007',
        isAuthentic: true,
        adulterationDetails: null,
        draw: (ctx, width, height) => drawChileanPlate(ctx, width, height, {
            letters1: 'GK',
            letters2: 'TL',
            numbers: '42',
            hasSeal: true,
            hasFlag: true,
            fontFamily: 'Chakra Petch',
            isEmbossed: true,
            tamper: null
        })
    },
    {
        id: 'sample_tampered_tape',
        name: 'RK · TL · 42 (Adulterada)',
        badge: 'Adulterada (Cinta)',
        badgeType: 'tag-alert',
        desc: 'Letra "P" adulterada con cinta aisladora negra para simular una "R" y evadir TAG.',
        expectedText: 'RKTL42',
        formatType: 'NEW_2007',
        isAuthentic: false,
        adulterationDetails: 'Caracter 1 "R": trazo diagonal añadido con cinta adhesiva no reflectante (anomalía de reflectancia y discontinuidad de borde detectada). Original era "PK·TL·42".',
        draw: (ctx, width, height) => drawChileanPlate(ctx, width, height, {
            letters1: 'PK', // Will be modified with tape on character 1
            letters2: 'TL',
            numbers: '42',
            hasSeal: true,
            hasFlag: true,
            fontFamily: 'Chakra Petch',
            isEmbossed: true,
            tamper: {
                type: 'tape_stroke',
                targetChar: 0,
                desc: 'Black tape diagonal patch converting P to R'
            }
        })
    },
    {
        id: 'sample_forbidden_vowels',
        name: 'FA · CE · 12 (Ilegal)',
        badge: 'Ilegal / Falsa',
        badgeType: 'tag-alert',
        desc: 'Uso de vocales prohibidas "A" y "E" en formato de 4 letras. Placa apócrifa.',
        expectedText: 'FACE12',
        formatType: 'NEW_2007',
        isAuthentic: false,
        adulterationDetails: 'Violación estricta a la Ley de Tránsito de Chile: el formato 2007+ prohíbe taxativamente el uso de vocales (A, E, I, O, U) para evitar combinaciones ofensivas.',
        draw: (ctx, width, height) => drawChileanPlate(ctx, width, height, {
            letters1: 'FA',
            letters2: 'CE',
            numbers: '12',
            hasSeal: false,
            hasFlag: true,
            fontFamily: 'Chakra Petch',
            isEmbossed: false,
            tamper: {
                type: 'forbidden_chars'
            }
        })
    },
    {
        id: 'sample_cloned_acrylic',
        name: 'SZ · VR · 88 (Clonada)',
        badge: 'Clonada / Acrílico',
        badgeType: 'tag-alert',
        desc: 'Placa clonada de plástico/acrílico. Fuente genérica, sin relieve ni sello láser oficial.',
        expectedText: 'SZVR88',
        formatType: 'NEW_2007',
        isAuthentic: false,
        adulterationDetails: 'Falsificación de soporte: material plano sin troquelado ni relieve reglamentario. Ausencia del holograma/sello del Registro Civil. Tipografía genérica no homologada.',
        draw: (ctx, width, height) => drawChileanPlate(ctx, width, height, {
            letters1: 'SZ',
            letters2: 'VR',
            numbers: '88',
            hasSeal: false,
            hasFlag: false,
            fontFamily: 'Arial',
            isEmbossed: false,
            tamper: {
                type: 'generic_font_no_seal'
            }
        })
    },
    {
        id: 'sample_authentic_old',
        name: 'CL · 89 · 43',
        badge: 'Histórica Válida',
        badgeType: 'tag-authentic',
        desc: 'Placa oficial formato antiguo (1985-2007). 2 letras y 4 números en regla.',
        expectedText: 'CL8943',
        formatType: 'OLD_1985',
        isAuthentic: true,
        adulterationDetails: null,
        draw: (ctx, width, height) => drawChileanPlate(ctx, width, height, {
            letters1: 'CL',
            letters2: '89',
            numbers: '43',
            hasSeal: true,
            hasFlag: true,
            isOldFormat: true,
            fontFamily: 'Chakra Petch',
            isEmbossed: true,
            tamper: null
        })
    },
    // ─── NUEVAS 2026 (D.S. Nº 53, Julio 2026) ────────────────────────────────
    {
        id: 'sample_2026_auto',
        name: 'BBBBB · 0',
        badge: 'Nueva 2026 ✅',
        badgeType: 'tag-new2026',
        desc: 'Placa NUEVA 2026 (D.S. Nº 53): 5 letras + 1 dígito. Vehículos de 4 o más ruedas.',
        expectedText: 'BBBBB0',
        formatType: 'FORMATO_2026_5L1D',
        isAuthentic: true,
        adulterationDetails: null,
        draw: (ctx, width, height) => drawChileanPlate2026(ctx, width, height, {
            letters: 'BBBBB',
            number: '0',
            hasSeal: true,
            hasFlag: true,
            fontFamily: 'Chakra Petch',
            isEmbossed: true,
            tamper: null
        })
    },
    {
        id: 'sample_current_auto',
        name: 'GK · SB · 78',
        badge: 'Actual 2007+',
        badgeType: 'tag-authentic',
        desc: 'Placa ACTUAL vigente (2007-2026): 4 letras + 2 dígitos. Vehículos de 4 o más ruedas.',
        expectedText: 'GKSB78',
        formatType: 'FORMATO_2007_NUEVO',
        isAuthentic: true,
        adulterationDetails: null,
        draw: (ctx, width, height) => drawChileanPlate(ctx, width, height, {
            letters1: 'GK',
            letters2: 'SB',
            numbers: '78',
            hasSeal: true,
            hasFlag: true,
            fontFamily: 'Chakra Petch',
            isEmbossed: true,
            tamper: null
        })
    },
    {
        id: 'sample_2026_moto',
        name: 'BBBB · 0',
        badge: 'Moto 2026 ✅',
        badgeType: 'tag-new2026',
        desc: 'Placa NUEVA 2026: 4 letras + 1 dígito para vehículos de 2 o 3 ruedas (motocicletas).',
        expectedText: 'BBBB0',
        formatType: 'FORMATO_2026_MOTO_4L1D',
        isAuthentic: true,
        adulterationDetails: null,
        draw: (ctx, width, height) => drawChileanMotorcyclePlate(ctx, width, height, {
            letters: 'BBBB',
            number: '0',
            isNew2026: true,
            hasSeal: true,
            hasFlag: true,
            fontFamily: 'Chakra Petch',
            isEmbossed: true,
            tamper: null
        })
    },
    {
        id: 'sample_current_moto',
        name: 'KDW · 13',
        badge: 'Moto Actual',
        badgeType: 'tag-authentic',
        desc: 'Placa de moto ACTUAL vigente (2007-2026): 3 letras + 2 dígitos para motocicletas.',
        expectedText: 'KDW13',
        formatType: 'FORMATO_MOTO_3L2D',
        isAuthentic: true,
        adulterationDetails: null,
        draw: (ctx, width, height) => drawChileanMotorcyclePlate(ctx, width, height, {
            letters: 'KDW',
            number: '13',
            isNew2026: false,
            hasSeal: true,
            hasFlag: true,
            fontFamily: 'Chakra Petch',
            isEmbossed: true,
            tamper: null
        })
    },
    {
        id: 'sample_2026_tampered',
        name: 'BBEBB · 0 (Adulterada)',
        badge: '2026 Ilegal ❌',
        badgeType: 'tag-alert',
        desc: 'Placa 2026 ADULTERADA: vocal "E" ilegal insertada en posición 3. Viola D.S. Nº 53.',
        expectedText: 'BBEBB0',
        formatType: 'FORMATO_2026_ILEGAL',
        isAuthentic: false,
        adulterationDetails: 'Vocal "E" insertada en posición 3 de la serie de 5 letras. Las nuevas placas 2026 mantienen estrictamente la prohibición de A, E, I, O, U y Ñ, Q. Placa APÓCRIFA.',
        draw: (ctx, width, height) => drawChileanPlate2026(ctx, width, height, {
            letters: 'BBEBB',
            number: '0',
            hasSeal: false,
            hasFlag: true,
            fontFamily: 'Chakra Petch',
            isEmbossed: false,
            tamper: { type: 'forbidden_chars_2026' }
        })
    }
];

/**
 * Draws an ultra-realistic Chilean license plate with retroreflective texture,
 * metallic borders, stamped letters, official seals and optional tampering.
 */
function drawChileanPlate(ctx, width, height, config) {
    // Canvas background
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, width, height);

    // Plate Dimensions (Aspect ratio 360 x 130 mm => ~ 2.77)
    const plateWidth = Math.min(width * 0.92, 680);
    const plateHeight = plateWidth / 2.77;
    const x = (width - plateWidth) / 2;
    const y = (height - plateHeight) / 2;
    const cornerRadius = 14;

    // 1. Plate Metallic Shadow & Outer Bezel
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;

    // Outer metal border (aluminum/tin)
    ctx.fillStyle = '#1e293b';
    roundRect(ctx, x - 5, y - 5, plateWidth + 10, plateHeight + 10, cornerRadius + 2);
    ctx.fill();
    ctx.restore();

    // 2. White Retro-reflective Baseplate
    const plateGrad = ctx.createLinearGradient(x, y, x + plateWidth, y + plateHeight);
    plateGrad.addColorStop(0, '#f8fafc');
    plateGrad.addColorStop(0.3, '#f1f5f9');
    plateGrad.addColorStop(0.7, '#ffffff');
    plateGrad.addColorStop(1, '#e2e8f0');

    ctx.fillStyle = plateGrad;
    roundRect(ctx, x, y, plateWidth, plateHeight, cornerRadius);
    ctx.fill();

    // Subtle reflective honeycomb texture
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
    ctx.lineWidth = 1;
    for (let lx = x; lx < x + plateWidth; lx += 16) {
        ctx.beginPath();
        ctx.moveTo(lx, y);
        ctx.lineTo(lx + plateHeight, y + plateHeight);
        ctx.stroke();
    }
    ctx.restore();

    // 3. Stamped Plate Rim (Black Inner Border)
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    roundRect(ctx, x + 6, y + 6, plateWidth - 12, plateHeight - 12, cornerRadius - 4);
    ctx.stroke();

    // 4. Mounting bolt holes
    const holeRadius = 6;
    const holePositions = [
        { cx: x + 24, cy: y + 24 },
        { cx: x + plateWidth - 24, cy: y + 24 },
        { cx: x + 24, cy: y + plateHeight - 24 },
        { cx: x + plateWidth - 24, cy: y + plateHeight - 24 }
    ];

    holePositions.forEach(h => {
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(h.cx, h.cy, holeRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    });

    // 5. Header: CHILE & Flag Strip
    ctx.font = 'bold 15px Chakra Petch, sans-serif';
    ctx.fillStyle = '#1e3a8a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '5px';
    ctx.fillText('CHILE', x + plateWidth / 2, y + 22);

    if (config.hasFlag) {
        // Draw tiny Chilean Flag at top left
        drawChileFlagIcon(ctx, x + 50, y + 15, 22, 14);
    }

    // 6. Central Official Seal / Hologram of Registro Civil (between character groups)
    if (config.hasSeal) {
        const sealX = x + plateWidth * 0.49;
        const sealY = y + plateHeight * 0.58;
        drawNationalSeal(ctx, sealX, sealY, 18);
    }

    // 7. Characters Rendering (Letters & Numbers)
    const textY = y + plateHeight * 0.62;
    ctx.font = `bold ${Math.round(plateHeight * 0.52)}px ${config.fontFamily || 'Chakra Petch'}, monospace`;
    ctx.fillStyle = '#090d16';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const charGap = plateWidth * 0.11;
    const startX = x + plateWidth * 0.12;

    const chars = [
        config.letters1[0],
        config.letters1[1],
        config.letters2[0],
        config.letters2[1],
        config.numbers[0],
        config.numbers[1]
    ];

    chars.forEach((ch, idx) => {
        let posX = startX + idx * charGap;
        // Group separation spacing (pairs)
        if (idx >= 2) posX += plateWidth * 0.04;
        if (idx >= 4) posX += plateWidth * 0.04;

        // Embossing shadow effect
        if (config.isEmbossed) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillText(ch, posX + 1.5, textY + 1.5);
            ctx.fillStyle = '#090d16';
        }
        ctx.fillText(ch, posX, textY);
    });

    // 8. Separator Dots / Bullets between pairs
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.arc(startX + 2 * charGap + plateWidth * 0.015, textY, 4, 0, Math.PI * 2);
    ctx.arc(startX + 4 * charGap + plateWidth * 0.055, textY, 4, 0, Math.PI * 2);
    ctx.fill();

    // 9. Tampering & Adulteration Injections
    if (config.tamper && config.tamper.type === 'tape_stroke') {
        // Draw black masking tape on character 0 (P to R modification)
        // Adding a diagonal stroke with non-matching sheen, matte texture, and rough cut edges
        const char0X = startX;
        const tapeX = char0X + 16;
        const tapeY = textY + 2;

        ctx.save();
        ctx.fillStyle = '#05070a'; // matte synthetic black tape
        ctx.beginPath();
        ctx.moveTo(tapeX, tapeY);
        ctx.lineTo(tapeX + 16, tapeY + 36);
        ctx.lineTo(tapeX + 26, tapeY + 34);
        ctx.lineTo(tapeX + 8, tapeY - 2);
        ctx.closePath();
        ctx.fill();

        // Tape edges imperfection (discontinuity / residue)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Fingerprint smudge or slight adhesive shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(tapeX + 2, tapeY + 10, 8, 14);
        ctx.restore();
    }
}

/**
 * Draws a New 2026 Chilean license plate (5 Letters + 1 Digit, D.S. Nº 53)
 * Layout: [BBBBB · 0] with CHILE below. Green background for electric/PHEV Patente Verde.
 */
function drawChileanPlate2026(ctx, width, height, config) {
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, width, height);

    // Aspect ratio same as standard plate (360x130mm ~ 2.77)
    const plateWidth = Math.min(width * 0.92, 680);
    const plateHeight = plateWidth / 2.77;
    const x = (width - plateWidth) / 2;
    const y = (height - plateHeight) / 2;
    const cornerRadius = 14;
    const isTampered = config.tamper && config.tamper.type === 'forbidden_chars_2026';

    // Outer bezel
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = '#1e293b';
    roundRect(ctx, x - 5, y - 5, plateWidth + 10, plateHeight + 10, cornerRadius + 2);
    ctx.fill();
    ctx.restore();

    // White retroreflective background (standard) — red tint if tampered
    const plateGrad = ctx.createLinearGradient(x, y, x + plateWidth, y + plateHeight);
    if (isTampered) {
        plateGrad.addColorStop(0, '#fff0f0');
        plateGrad.addColorStop(1, '#ffe8e8');
    } else {
        plateGrad.addColorStop(0, '#f8fafc');
        plateGrad.addColorStop(0.5, '#ffffff');
        plateGrad.addColorStop(1, '#e2e8f0');
    }
    ctx.fillStyle = plateGrad;
    roundRect(ctx, x, y, plateWidth, plateHeight, cornerRadius);
    ctx.fill();

    // Reflective texture
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(148,163,184,0.12)';
    ctx.lineWidth = 1;
    for (let lx = x; lx < x + plateWidth; lx += 16) {
        ctx.beginPath();
        ctx.moveTo(lx, y);
        ctx.lineTo(lx + plateHeight, y + plateHeight);
        ctx.stroke();
    }
    ctx.restore();

    // Border
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    roundRect(ctx, x + 6, y + 6, plateWidth - 12, plateHeight - 12, cornerRadius - 4);
    ctx.stroke();

    // Bolt holes
    [[x + 24, y + 24],[x + plateWidth - 24, y + 24],[x + 24, y + plateHeight - 24],[x + plateWidth - 24, y + plateHeight - 24]].forEach(([cx, cy]) => {
        ctx.fillStyle = '#334155';
        ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5; ctx.stroke();
    });

    // Header: "CHILE" at top — red if tampered, blue if valid
    ctx.font = 'bold 15px Chakra Petch, sans-serif';
    ctx.fillStyle = isTampered ? '#dc2626' : '#1e3a8a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '5px';
    ctx.fillText('CHILE', x + plateWidth / 2, y + 22);

    // 2026 badge at top-right
    ctx.save();
    ctx.font = 'bold 10px Chakra Petch, sans-serif';
    ctx.fillStyle = isTampered ? 'rgba(220,38,38,0.8)' : 'rgba(16,185,129,0.85)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '1px';
    ctx.fillText('D.S. 53 · 2026', x + plateWidth - 20, y + 22);
    ctx.restore();

    if (config.hasFlag) drawChileFlagIcon(ctx, x + 50, y + 15, 22, 14);

    // Seal
    if (config.hasSeal) drawNationalSeal(ctx, x + plateWidth * 0.49, y + plateHeight * 0.58, 18);

    // Characters: 5 letters clustered, bullet, 1 digit
    const textY = y + plateHeight * 0.62;
    const fontSize = Math.round(plateHeight * 0.50);
    ctx.font = `bold ${fontSize}px ${config.fontFamily || 'Chakra Petch'}, monospace`;
    ctx.fillStyle = '#090d16';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const letters = config.letters || 'BBBBB';
    const numStr = String(config.number || '0');

    // Tighter per-char gap for 5 letters (narrower to fit on plate)
    const charGap = plateWidth * 0.085;
    const startX = x + plateWidth * 0.08;

    for (let i = 0; i < letters.length; i++) {
        const ch = letters[i];
        const posX = startX + i * charGap;
        const isIllegal = 'AEIOUÑQ'.includes(ch);
        if (isTampered && isIllegal) {
            // Highlight illegal character in red
            ctx.fillStyle = '#dc2626';
        } else if (config.isEmbossed) {
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fillText(ch, posX + 1.5, textY + 1.5);
            ctx.fillStyle = '#090d16';
        } else {
            ctx.fillStyle = '#090d16';
        }
        ctx.fillText(ch, posX, textY);
        if (isTampered && isIllegal) ctx.fillStyle = '#090d16'; // reset
    }

    // Separator bullet between letters and digit
    const bulletX = startX + letters.length * charGap + charGap * 0.1;
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.arc(bulletX, textY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Digit
    const digitX = bulletX + charGap * 0.5;
    if (config.isEmbossed) {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText(numStr, digitX + 1.5, textY + 1.5);
        ctx.fillStyle = '#090d16';
    }
    ctx.fillText(numStr, digitX, textY);
}

/**
 * Draws a motorcycle Chilean license plate (square-ish aspect ratio)
 * - New 2026: 4 letters + 1 digit (BBBB · 0)
 * - Current:  3 letters + 2 digits (KDW · 13)
 */
function drawChileanMotorcyclePlate(ctx, width, height, config) {
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, width, height);

    // Motorcycle plates are more square: ~220x220mm → aspect ~1.0
    const plateSize = Math.min(width * 0.55, height * 0.92, 240);
    const plateWidth = plateSize;
    const plateHeight = plateSize;
    const x = (width - plateWidth) / 2;
    const y = (height - plateHeight) / 2;
    const cornerRadius = 10;

    // Outer bezel
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#1e293b';
    roundRect(ctx, x - 4, y - 4, plateWidth + 8, plateHeight + 8, cornerRadius + 2);
    ctx.fill();
    ctx.restore();

    // White retroreflective background
    const plateGrad = ctx.createLinearGradient(x, y, x + plateWidth, y + plateHeight);
    plateGrad.addColorStop(0, '#f8fafc');
    plateGrad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = plateGrad;
    roundRect(ctx, x, y, plateWidth, plateHeight, cornerRadius);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    roundRect(ctx, x + 5, y + 5, plateWidth - 10, plateHeight - 10, cornerRadius - 3);
    ctx.stroke();

    // Bolt holes (two at top)
    [[x + 18, y + 18],[x + plateWidth - 18, y + 18]].forEach(([cx, cy]) => {
        ctx.fillStyle = '#334155';
        ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1; ctx.stroke();
    });

    // "CHILE" header at top
    ctx.font = 'bold 13px Chakra Petch, sans-serif';
    ctx.fillStyle = '#1e3a8a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '4px';
    ctx.fillText('CHILE', x + plateWidth / 2, y + 26);

    // 2026 or current badge
    ctx.save();
    ctx.font = 'bold 8px Chakra Petch, sans-serif';
    ctx.fillStyle = config.isNew2026 ? 'rgba(16,185,129,0.85)' : 'rgba(99,102,241,0.8)';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '1px';
    ctx.fillText(config.isNew2026 ? 'NUEVA 2026' : 'VIGENTE', x + plateWidth / 2, y + plateHeight - 16);
    ctx.restore();

    if (config.hasSeal) drawNationalSeal(ctx, x + plateWidth / 2, y + plateHeight * 0.45, 14);

    // Characters rendering
    const textY = y + plateHeight * 0.62;
    const fontSize = Math.round(plateHeight * 0.26);
    ctx.font = `bold ${fontSize}px ${config.fontFamily || 'Chakra Petch'}, monospace`;
    ctx.fillStyle = '#090d16';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const letters = config.letters || 'KDW';
    const numStr = String(config.number || '13');
    const displayStr = `${letters} · ${numStr}`;

    if (config.isEmbossed) {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText(displayStr, x + plateWidth / 2 + 1.5, textY + 1.5);
        ctx.fillStyle = '#090d16';
    }
    ctx.fillText(displayStr, x + plateWidth / 2, textY);
}

/**
 * Renders miniature Chilean Coat of Arms / Registro Civil seal
 */
function drawNationalSeal(ctx, x, y, radius) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(30, 41, 59, 0.12)';
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Star in center
    ctx.fillStyle = '#475569';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', x, y);
    ctx.restore();
}

/**
 * Draws miniature flag of Chile
 */
function drawChileFlagIcon(ctx, x, y, w, h) {
    ctx.save();
    // Top blue square
    ctx.fillStyle = '#0039a6';
    ctx.fillRect(x, y, w * 0.4, h * 0.5);
    // Star inside blue
    ctx.fillStyle = '#ffffff';
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', x + (w * 0.4) / 2, y + (h * 0.5) / 2);

    // Top white strip
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + w * 0.4, y, w * 0.6, h * 0.5);

    // Bottom red strip
    ctx.fillStyle = '#d52b1e';
    ctx.fillRect(x, y + h * 0.5, w, h * 0.5);

    // Outline
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
}

/**
 * Utility for drawing rounded rectangles
 */
function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}
