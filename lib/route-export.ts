import { RouteResult, LinesMap } from '@/types/metro';
import { getTransferGuide, getFirstStepGuide } from '@/lib/route-guides';
import { toast } from 'sonner';

type Language = 'en' | 'fa';
type ExportTheme = 'light' | 'dark';
type ExportDetailLevel = 'summary' | 'detailed';

interface ExportRouteImageParams {
  route: RouteResult;
  fromStation: string;
  toStation: string;
  theme: ExportTheme;
  detailLevel: ExportDetailLevel;
  lang: Language;
  getStationDisplay: (stationId: string) => string;
  lines: LinesMap;
}

// Helper to draw rounded rectangle
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
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

// Helper to check if device is mobile
function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= 768;
}

// Helper to check if color is light or dark
function isLightColor(hex: string): boolean {
  const rgb = parseInt(hex.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 150;
}

export const exportRouteImage = async ({
  route,
  fromStation,
  toStation,
  theme,
  detailLevel,
  lang,
  getStationDisplay,
  lines,
}: ExportRouteImageParams): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      // Enable high quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Layout constants
      const width = 640;
      const padding = 32;
      const cardRadius = 12;
      const stepCardRadius = 8;
      const headerHeight = 240;
      const badgeGap = 16;
      const stepHeight = detailLevel === 'detailed' ? 115 : 130;
      const stepGap = 16;
      const footerHeight = 40;
      const fontFa = 'fontVazir, Vazir, Tahoma, Arial, sans-serif';
      const fontEn = 'Geist, Arial, sans-serif';
      const fontFamily = lang === 'fa' ? fontFa : fontEn;
      const direction = lang === 'fa' ? 'rtl' : 'ltr';
      const align = lang === 'fa' ? 'right' : 'left';
      const isRTL = lang === 'fa';

      // Steps to render
      const filteredSteps = detailLevel === 'detailed'
        ? route.steps
        : route.steps.filter((step, idx) => {
          if (idx === 0 || idx === route.steps.length - 1) return true;
          const nextStep = route.steps[idx + 1];
          return nextStep && nextStep.line !== step.line;
        });
      const height = headerHeight + (filteredSteps.length * (stepHeight + stepGap)) + footerHeight + padding * 2;
      canvas.width = width;
      canvas.height = height;

      // Theme colors
      const isDark = theme === 'dark';
      const bgColor = isDark ? '#18181b' : '#f8fafc';
      const cardBg = isDark ? '#23272e' : '#ffffff';
      const textPrimary = isDark ? '#f3f4f6' : '#18181b';
      const textSecondary = isDark ? '#a1a1aa' : '#52525b';
      const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
      const accentColor = isDark ? '#10b981' : '#2563eb';

      // Fill background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);
      ctx.direction = direction;
      ctx.textAlign = align;

      // Header card
      let y = padding;
      ctx.save();
      ctx.beginPath();
      drawRoundedRect(ctx, padding, y, width - padding * 2, headerHeight, cardRadius);
      ctx.clip();
      const grad = ctx.createLinearGradient(0, y, 0, y + headerHeight);
      grad.addColorStop(0, isDark ? '#23272e' : '#e0e7ef');
      grad.addColorStop(1, isDark ? '#18181b' : '#f8fafc');
      ctx.fillStyle = grad;
      ctx.fillRect(padding, y, width - padding * 2, headerHeight);
      ctx.restore();
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2;
      drawRoundedRect(ctx, padding, y, width - padding * 2, headerHeight, cardRadius);
      ctx.stroke();

      // App title
      ctx.font = `bold 36px ${fontFamily}`;
      ctx.fillStyle = accentColor;
      const appTitle = isRTL ? 'مسیریاب مترو تهران' : 'Tehran Metro Navigator';
      const titleX = isRTL ? width - padding - 40 : padding + 40;
      ctx.fillText(appTitle, titleX, y + 60);

      // Route info
      ctx.font = `22px ${fontFamily}`;
      ctx.fillStyle = textSecondary;
      const fromLabel = isRTL ? 'از:' : 'From:';
      const toLabel = isRTL ? 'به:' : 'To:';
      const infoX = isRTL ? width - padding - 40 : padding + 40;
      ctx.fillText(fromLabel, infoX, y + 110);
      ctx.font = `bold 24px ${fontFamily}`;
      ctx.fillStyle = textPrimary;
      const fromStationText = getStationDisplay(fromStation);
      const fromStationX = isRTL ? infoX - ctx.measureText(fromLabel).width - 15 : infoX + ctx.measureText(fromLabel).width + 15;
      ctx.fillText(fromStationText, fromStationX, y + 110);
      ctx.font = `22px ${fontFamily}`;
      ctx.fillStyle = textSecondary;
      ctx.fillText(toLabel, infoX, y + 150);
      ctx.font = `bold 24px ${fontFamily}`;
      ctx.fillStyle = textPrimary;
      const toStationText = getStationDisplay(toStation);
      const toStationX = isRTL ? infoX - ctx.measureText(toLabel).width - 15 : infoX + ctx.measureText(toLabel).width + 15;
      ctx.fillText(toStationText, toStationX, y + 150);

      // Badges (moved below route info)
      ctx.font = `bold 20px ${fontFamily}`;
      ctx.fillStyle = accentColor;
      const stationsText = `${route.totalStations} ${isRTL ? 'ایستگاه' : 'stations'}`;
      const transfersText = `${route.totalTransfers} ${isRTL ? 'تعویض' : 'transfers'}`;
      const badgeX = isRTL ? width - padding - 40 : padding + 40;
      ctx.fillText(stationsText, badgeX, y + 200);
      ctx.fillStyle = isDark ? '#f59e42' : '#eab308';
      ctx.fillText(transfersText, badgeX + (isRTL ? -120 : 120), y + 200);

      // Steps section title
      y += headerHeight + badgeGap;

      // First pass: collect step positions
      const stepPositions: Array<{ y: number; lineColor: string; isLast: boolean; step: any; originalIdx: number }> = [];
      let tempY = y;
      filteredSteps.forEach((step, idx) => {
        const originalIdx = route.steps.findIndex(s => s === step);
        const lineKey = step.line;
        const lineColor = lines[lineKey]?.color || '#6b7280';
        const isLast = idx === filteredSteps.length - 1;
        stepPositions.push({ y: tempY, lineColor, isLast, step, originalIdx });
        tempY += stepHeight + stepGap;
      });

      // Draw connectors between circles
      stepPositions.forEach((pos, idx) => {
        if (idx > 0) {
          const prevPos = stepPositions[idx - 1];
          const prevCircleY = prevPos.y + stepHeight / 2 - 25;
          const currCircleY = pos.y + stepHeight / 2 - 25;
          ctx.strokeStyle = pos.lineColor;
          ctx.lineWidth = 4;
          ctx.beginPath();
          const connectorX = isRTL ? width - padding - 40 : padding + 40;
          ctx.moveTo(connectorX, prevCircleY);
          ctx.lineTo(connectorX, currCircleY);
          ctx.stroke();
        }
      });

      // Second pass: draw all steps
      stepPositions.forEach(({ y: stepY, lineColor, step, originalIdx }, idx) => {
        const isLast = idx === stepPositions.length - 1;
        const nextStep = !isLast ? stepPositions[idx + 1].step : null;
        const isTransfer = nextStep && nextStep.line !== step.line;

        // Step number circle
        const circleRadius = 22;
        const circleX = isRTL ? width - padding - 40 : padding + 40;
        const circleY = stepY + stepHeight / 2 - 25;
        ctx.fillStyle = lineColor;
        ctx.beginPath();
        ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = `bold 20px ${fontFamily}`;
        ctx.fillStyle = isLightColor(lineColor) ? '#000' : '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((originalIdx + 1).toString(), circleX, circleY);
        ctx.textBaseline = 'top';
        ctx.textAlign = align;

        // Line badge
        const badgeStartX = isRTL ? width - padding - 80 : padding + 80;
        const badgeY = stepY + 20;
        const lineName = lines[step.line]?.name[lang] || step.line;
        const isFirstStep = originalIdx === 0;
        const guideText = isFirstStep
          ? getFirstStepGuide(route, lines, lang, getStationDisplay)
          : isTransfer
            ? getTransferGuide(route, originalIdx, lines, lang, getStationDisplay)
            : '';
        const hasGuide = guideText.length > 0;
        const badgeHeight = hasGuide ? 48 : 32;
        ctx.font = `bold 16px ${fontFamily}`;
        const lineBadgeWidth = Math.max(ctx.measureText(lineName).width + 32, hasGuide ? (ctx.font = `12px ${fontFamily}`, ctx.measureText(guideText).width + 32) : 0);
        ctx.font = `bold 16px ${fontFamily}`;
        ctx.fillStyle = lineColor;
        drawRoundedRect(
          ctx,
          isRTL ? badgeStartX - lineBadgeWidth : badgeStartX,
          badgeY,
          lineBadgeWidth,
          badgeHeight,
          16
        );
        ctx.fill();
        ctx.fillStyle = isLightColor(lineColor) ? '#000' : '#fff';
        const lineTextX = isRTL ? badgeStartX - 16 : badgeStartX + 16;
        ctx.fillText(lineName, lineTextX, badgeY + 8);
        if (hasGuide) {
          ctx.font = `12px ${fontFamily}`;
          ctx.fillText(guideText, lineTextX, badgeY + 28);
        }

        // Station name
        ctx.font = `bold 22px ${fontFamily}`;
        ctx.fillStyle = textPrimary;
        const stationNameY = stepY + (hasGuide ? 85 : 65);
        const stationName = isRTL ? step.station.translations.fa : step.station.name;
        ctx.fillText(stationName, lineTextX, stationNameY);
      });

      // Footer
      ctx.font = `16px ${fontFamily}`;
      ctx.fillStyle = textSecondary;
      ctx.textAlign = 'center';
      const footerText = isRTL
        ? 'ساخته شده با ❤️ برای مسافران مترو تهران'
        : 'Made with ❤️ for Tehran Metro passengers';
      ctx.fillText(footerText, width / 2, height - 30);

      // Convert to blob and handle export
      canvas.toBlob(async (blob) => {
        if (blob) {
          const isMobile = isMobileDevice();

          if (isMobile) {
            // On mobile, open the image in a new tab using blob URL
            const blobUrl = URL.createObjectURL(blob);
            window.open(blobUrl, '_blank');

            // Cleanup blob URL after a delay
            setTimeout(() => {
              URL.revokeObjectURL(blobUrl);
            }, 10000); // Keep URL alive for 10 seconds

            toast.success(lang === 'fa' ? 'تصویر در تب جدید باز شد' : 'Image opened in new tab');
            resolve();
            return;
          }

          const filename = `tehran-metro-route-${Date.now()}.jpg`;

          // Copy image to clipboard (desktop only)
          let clipboardSuccess = false;
          try {
            // Check if ClipboardItem is supported
            if (window.ClipboardItem && navigator.clipboard.write) {
              await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
              ]);
              clipboardSuccess = true;
            }
          } catch (clipboardError) {
            console.warn('Clipboard API with images not supported:', clipboardError);
          }

          // Fallback: always try to copy data URL as text
          if (!clipboardSuccess) {
            try {
              const dataUrl = canvas.toDataURL('image/png');
              await navigator.clipboard.writeText(dataUrl);
              clipboardSuccess = true;
            } catch (textError) {
              console.warn('Failed to copy data URL to clipboard:', textError);
            }
          }

          // Always download the image regardless of clipboard success
          const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = filename;
          link.style.display = 'none';
          document.body.appendChild(link);

          try {
            link.click();
          } catch (e) {
            // If programmatic click fails, try opening in new window
            window.open(dataUrl, '_blank');
          }

          document.body.removeChild(link);

          // Show appropriate toast message
          if (clipboardSuccess) {
            toast.success(lang === 'fa' ? 'تصویر دانلود و به کلیپ‌بورد کپی شد' : 'Image downloaded and copied to clipboard');
          } else {
            toast.info(lang === 'fa' ? 'تصویر دانلود شد' : 'Image downloaded');
          }

          resolve();
        } else {
          reject(new Error('Failed to create image blob'));
        }
      }, 'image/png');
    } catch (error) {
      reject(error);
    }
  });
};
