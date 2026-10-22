import fs from 'fs';
import PDFDocument from 'pdfkit';
import pptxgen from 'pptxgenjs';

// --- 1. GENERATE PPTX ---
async function generatePptx() {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Krishnajith KS';
  pptx.company = 'ECE Academic Project';
  pptx.title = 'Camera-Based PPG Heart Rate Monitor';

  const C_BG = 'F5F3EF';
  const C_CARD = 'FFFFFF';
  const C_INK = '111111';
  const C_SEC = '555555';
  const C_ACC = 'FF3B19';
  const C_BORDER = 'DCD7CC';

  const slidesData = [
    {
      tag: 'CLIENT-SIDE BIOPHOTONICS',
      title: 'Pulse from Pixels — Toss the Sensor',
      sub: 'Camera-Based Photoplethysmography (PPG) Vital Signs Monitor',
      points: [
        'Goal: Measure human heart rate accurately using only a smartphone camera and flashlight LED.',
        'Zero Wearables: Eliminates smartwatches, finger clips, and expensive pulse oximeter hardware.',
        '100% Private in Browser: Video frames stay in transient memory and are discarded immediately. Zero cloud upload.',
        'Modern Tech Stack: Built with React 19, TypeScript, and causal hand-crafted DSP algorithms.'
      ]
    },
    {
      tag: 'STAGE 01 / PRINCIPLE OF OPERATION',
      title: 'How Can a Camera See Your Heartbeat?',
      sub: 'Photoplethysmography (PPG) & The Beer-Lambert Law',
      points: [
        'Arterial Pulsation: Every heartbeat pumps blood into the microvascular capillary bed of your fingertip.',
        'Light Absorption: Hemoglobin in blood strongly absorbs green light (~540 nm wavelength).',
        'Microscopic Brightness Shifts: More blood in fingertip = darker frame. Less blood between beats = brighter frame.',
        'Optical Sensing: Phone camera records at 30 frames/second. Spatial averaging converts video frames into a 1D optical pulse wave.'
      ]
    },
    {
      tag: 'STAGE 02 / MATHEMATICAL PIPELINE',
      title: 'Step-by-Step Processing Pipeline',
      sub: 'From Raw Camera Pixels to Verified Heart Rate',
      points: [
        '1. Spatial Downsampling: Scales video to 64x64 ROI, extracting spatial mean to save battery and guarantee O(1) memory.',
        '2. Uniform Resampling: Linear interpolation maps jittered mobile timestamps onto an exact 30.0 Hz time grid.',
        '3. 4th-Order Butterworth Filter: Direct Form II SOS removes DC baseline drift, breathing sway, and high-frequency noise.',
        '4. Dual Consensus Engine: Time-domain peak detector cross-checks frequency-domain FFT peak within 3.0 BPM tolerance.'
      ]
    },
    {
      tag: 'STAGE 03 / NOISE REJECTION',
      title: 'Cleaning the Signal: Band-Pass Filter',
      sub: 'Why We Need a 4th-Order Butterworth Filter',
      points: [
        'The Noise Problem: Respiration creates slow 0.2 Hz baseline drift. Hand tremor and sensor noise add 10+ Hz spikes.',
        'Passband Window: 0.5 Hz to 4.0 Hz (corresponds to physiological range of 30 BPM to 240 BPM).',
        'Cascaded Biquad Sections: Two 2nd-order Direct Form II Transposed sections give steep 24 dB/octave rolloff.',
        'Maximally Flat: Zero passband ripple prevents false systolic peak distortion.'
      ]
    },
    {
      tag: 'STAGE 04 / DUAL ESTIMATION',
      title: 'Dual-Engine Consensus Cross-Check',
      sub: 'Preventing False Readings via Time & Frequency Agreement',
      points: [
        'Method A (Time Domain): Inter-Beat Interval (IBI). Detects systolic wave peaks and calculates BPM = 60 / Delta_t.',
        'Method B (Frequency Domain): 4,096-point Hann-windowed FFT. Finds the dominant spectral power peak frequency f_peak.',
        'Consensus Rule: If |BPM_Time - BPM_Freq| <= 3.0 BPM -> Status: Verified Clean.',
        'Robustness: If hands shake, the two methods disagree (>3.0 BPM) and the system automatically prompts user to steady finger.'
      ]
    },
    {
      tag: 'STAGE 05 / ARCHITECTURE & PRIVACY',
      title: 'System Architecture & Memory Discipline',
      sub: 'Why Client-Side Matters for Medical Signal Privacy',
      points: [
        'Zero Server Backend: Entire DSP chain runs locally in browser JavaScript thread and Web Worker. No backend server required.',
        'Strict O(1) Memory Rule: Raw video frames are discarded immediately after computing spatial mean. Zero memory leaks.',
        'Complete Data Privacy: No personal video, camera feed, or physiological data is ever transmitted over network.',
        'Universal Accessibility: Runs on any standard mobile phone or laptop browser via lightweight static web deployment.'
      ]
    },
    {
      tag: 'STAGE 06 / USER EXPERIENCE',
      title: 'Landing Page & Presenter Easter Egg',
      sub: 'Crumple Editorial Design + Secret Academic Inspection Lab',
      points: [
        'Public Landing Page: Monochromatic Crumple editorial aesthetic with arterial red pulse disc and AHA resting categories.',
        'Direct Action: "Start Camera" launches capture and transitions smoothly into the monitoring workspace.',
        'Secret Presenter Trigger: Clicking "Developed by Krishnajith KS" 6 times unlocks the Teacher Evaluation Workbench.',
        'Inspection Tools: Multi-channel optical viewport, live waveform stack, viva diagnostics, and synthetic benchmarks (54, 72, 108 BPM).'
      ]
    },
    {
      tag: 'STAGE 07 / VIVA DEFENSE CHEAT SHEET',
      title: 'Examiner Questions & Quick Answers',
      sub: 'Core ECE Viva Concepts in Plain Language',
      points: [
        'Q: Why green channel over red? A: Oxygenated hemoglobin absorbs green light (~540nm) 2.5x more strongly, giving superior SNR.',
        'Q: What if phone drops frames? A: Linear resampler maps irregular timestamps to an exact 30 Hz uniform grid so filter cutoffs do not drift.',
        'Q: Why use Direct Form II Biquads? A: Transposed Direct Form II minimizes floating-point roundoff error and state register overhead (flat O(1)).',
        'Q: Is this a clinical medical device? A: No, it is an educational biophotonic DSP monitor demonstrating optical plethysmography in browser.'
      ]
    }
  ];

  for (const s of slidesData) {
    const slide = pptx.addSlide();
    slide.background = { color: C_BG };

    // Tag
    slide.addText(s.tag, {
      x: 0.8,
      y: 0.6,
      w: 8.0,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: C_ACC,
      fontFace: 'Arial'
    });

    // Title
    slide.addText(s.title, {
      x: 0.8,
      y: 0.9,
      w: 11.5,
      h: 0.7,
      fontSize: 24,
      bold: true,
      color: C_INK,
      fontFace: 'Arial'
    });

    // Subtitle
    slide.addText(s.sub, {
      x: 0.8,
      y: 1.6,
      w: 11.5,
      h: 0.4,
      fontSize: 13,
      italic: true,
      color: C_SEC,
      fontFace: 'Arial'
    });

    // Content card
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0.8,
      y: 2.2,
      w: 11.7,
      h: 4.5,
      fill: { color: C_CARD },
      line: { color: C_BORDER, width: 1 }
    });

    // Bullet points
    const textItems = s.points.map((p) => ({
      text: p + '\n\n',
      options: {
        fontSize: 13,
        color: C_INK,
        bullet: true,
        fontFace: 'Arial'
      }
    }));

    slide.addText(textItems, {
      x: 1.2,
      y: 2.5,
      w: 10.9,
      h: 3.9,
      valign: 'top',
      lineSpacing: 22
    });

    // Footer
    slide.addText('Camera-Based PPG Vital Signs Monitor  •  Krishnajith KS  •  ECE Academic Defense', {
      x: 0.8,
      y: 7.0,
      w: 11.7,
      h: 0.3,
      fontSize: 9,
      color: C_SEC,
      align: 'center',
      fontFace: 'Arial'
    });
  }

  await pptx.writeFile({ fileName: '/home/jojo/Projects/ppg-heart-rate-monitor/PRESENTATION.pptx' });
  console.log('PRESENTATION.pptx generated successfully.');
}

// --- 2. GENERATE PDF ---
async function generatePdf() {
  return new Promise((resolve, reject) => {
    // 16:9 widescreen PDF: 842 x 474 pt (approx 297mm x 167mm)
    const doc = new PDFDocument({
      size: [842, 474],
      autoFirstPage: false,
      bufferPages: true
    });

    const stream = fs.createWriteStream('/home/jojo/Projects/ppg-heart-rate-monitor/PRESENTATION.pdf');
    doc.pipe(stream);

    const slides = [
      {
        tag: 'CLIENT-SIDE BIOPHOTONICS',
        title: 'Pulse from Pixels — Toss the Sensor',
        sub: 'Camera-Based Photoplethysmography (PPG) Vital Signs Monitor',
        bullets: [
          'Goal: Measure human heart rate accurately using only a smartphone camera and flashlight LED.',
          'Zero Wearables: Eliminates smartwatches, finger clips, and expensive pulse oximeter hardware.',
          '100% Private in Browser: Video frames stay in transient memory and are discarded immediately. Zero cloud upload.',
          'Modern Tech Stack: Built with React 19, TypeScript, and causal hand-crafted DSP algorithms.'
        ]
      },
      {
        tag: 'STAGE 01 / PRINCIPLE OF OPERATION',
        title: 'How Can a Camera See Your Heartbeat?',
        sub: 'Photoplethysmography (PPG) & The Beer-Lambert Law',
        bullets: [
          'Arterial Pulsation: Every heartbeat pumps blood into the microvascular capillary bed of your fingertip.',
          'Light Absorption: Hemoglobin in blood strongly absorbs green light (~540 nm wavelength).',
          'Microscopic Brightness Shifts: More blood in fingertip = darker frame. Less blood between beats = brighter frame.',
          'Optical Sensing: Phone camera records at 30 frames/second. Spatial averaging converts video frames into a 1D optical pulse wave.'
        ]
      },
      {
        tag: 'STAGE 02 / MATHEMATICAL PIPELINE',
        title: 'Step-by-Step Processing Pipeline',
        sub: 'From Raw Camera Pixels to Verified Heart Rate',
        bullets: [
          '1. Spatial Downsampling: Scales video to 64x64 ROI, extracting spatial mean to save battery and guarantee O(1) memory.',
          '2. Uniform Resampling: Linear interpolation maps jittered mobile timestamps onto an exact 30.0 Hz time grid.',
          '3. 4th-Order Butterworth Filter: Direct Form II SOS removes DC baseline drift, breathing sway, and high-frequency noise.',
          '4. Dual Consensus Engine: Time-domain peak detector cross-checks frequency-domain FFT peak within 3.0 BPM tolerance.'
        ]
      },
      {
        tag: 'STAGE 03 / NOISE REJECTION',
        title: 'Cleaning the Signal: Band-Pass Filter',
        sub: 'Why We Need a 4th-Order Butterworth Filter',
        bullets: [
          'The Noise Problem: Respiration creates slow 0.2 Hz baseline drift. Hand tremor and sensor noise add 10+ Hz spikes.',
          'Passband Window: 0.5 Hz to 4.0 Hz (corresponds to physiological range of 30 BPM to 240 BPM).',
          'Cascaded Biquad Sections: Two 2nd-order Direct Form II Transposed sections give steep 24 dB/octave rolloff.',
          'Maximally Flat: Zero passband ripple prevents false systolic peak distortion.'
        ]
      },
      {
        tag: 'STAGE 04 / DUAL ESTIMATION',
        title: 'Dual-Engine Consensus Cross-Check',
        sub: 'Preventing False Readings via Time & Frequency Agreement',
        bullets: [
          'Method A (Time Domain): Inter-Beat Interval (IBI). Detects systolic wave peaks and calculates BPM = 60 / Delta_t.',
          'Method B (Frequency Domain): 4,096-point Hann-windowed FFT. Finds the dominant spectral power peak frequency f_peak.',
          'Consensus Rule: If |BPM_Time - BPM_Freq| <= 3.0 BPM -> Status: Verified Clean.',
          'Robustness: If hands shake, the two methods disagree (>3.0 BPM) and the system automatically prompts user to steady finger.'
        ]
      },
      {
        tag: 'STAGE 05 / ARCHITECTURE & PRIVACY',
        title: 'System Architecture & Memory Discipline',
        sub: 'Why Client-Side Matters for Medical Signal Privacy',
        bullets: [
          'Zero Server Backend: Entire DSP chain runs locally in browser JavaScript thread and Web Worker. No backend server required.',
          'Strict O(1) Memory Rule: Raw video frames are discarded immediately after computing spatial mean. Zero memory leaks.',
          'Complete Data Privacy: No personal video, camera feed, or physiological data is ever transmitted over network.',
          'Universal Accessibility: Runs on any standard mobile phone or laptop browser via lightweight static web deployment.'
        ]
      },
      {
        tag: 'STAGE 06 / USER EXPERIENCE',
        title: 'Landing Page & Presenter Easter Egg',
        sub: 'Crumple Editorial Design + Secret Academic Inspection Lab',
        bullets: [
          'Public Landing Page: Monochromatic Crumple editorial aesthetic with arterial red pulse disc and AHA resting categories.',
          'Direct Action: "Start Camera" launches capture and transitions smoothly into the monitoring workspace.',
          'Secret Presenter Trigger: Clicking "Developed by Krishnajith KS" 6 times unlocks the Teacher Evaluation Workbench.',
          'Inspection Tools: Multi-channel optical viewport, live waveform stack, viva diagnostics, and synthetic benchmarks (54, 72, 108 BPM).'
        ]
      },
      {
        tag: 'STAGE 07 / VIVA DEFENSE CHEAT SHEET',
        title: 'Examiner Questions & Quick Answers',
        sub: 'Core ECE Viva Concepts in Plain Language',
        bullets: [
          'Q: Why green channel over red? A: Oxygenated hemoglobin absorbs green light (~540nm) 2.5x more strongly, giving superior SNR.',
          'Q: What if phone drops frames? A: Linear resampler maps irregular timestamps to an exact 30 Hz uniform grid so filter cutoffs do not drift.',
          'Q: Why use Direct Form II Biquads? A: Transposed Direct Form II minimizes floating-point roundoff error and state register overhead (flat O(1)).',
          'Q: Is this a clinical medical device? A: No, it is an educational biophotonic DSP monitor demonstrating optical plethysmography in browser.'
        ]
      }
    ];

    slides.forEach((s, idx) => {
      doc.addPage({
        size: [842, 474],
        margins: { top: 0, bottom: 0, left: 0, right: 0 }
      });

      // Background ecru
      doc.rect(0, 0, 842, 474).fill('#f5f3ef');

      // Top Tag
      doc.fillColor('#ff3b19')
         .fontSize(9)
         .font('Helvetica-Bold')
         .text(s.tag, 50, 36);

      // Title
      doc.fillColor('#111111')
         .fontSize(22)
         .font('Helvetica-Bold')
         .text(s.title, 50, 52);

      // Subtitle
      doc.fillColor('#555555')
         .fontSize(11)
         .font('Helvetica-Oblique')
         .text(s.sub, 50, 84);

      // Card Background
      doc.roundedRect(50, 110, 742, 290, 4)
         .fillAndStroke('#ffffff', '#dcd7cc');

      // Bullets
      let yPos = 132;
      doc.font('Helvetica').fontSize(11);

      s.bullets.forEach((b) => {
        // Red bullet dot
        doc.circle(75, yPos + 6, 3).fill('#ff3b19');

        doc.fillColor('#111111')
           .text(b, 90, yPos, {
             width: 675,
             lineGap: 3
           });
        yPos += 64;
      });

      // Footer
      doc.fillColor('#888888')
         .fontSize(8.5)
         .font('Helvetica')
         .text('Camera-Based PPG Vital Signs Monitor  •  Krishnajith KS  •  ECE Academic Defense  •  Slide ' + (idx + 1) + ' of ' + slides.length, 50, 435, {
           width: 742,
           align: 'center'
         });
    });

    doc.end();
    stream.on('finish', () => {
      console.log('PRESENTATION.pdf generated successfully.');
      resolve(true);
    });
    stream.on('error', reject);
  });
}

async function main() {
  await generatePptx();
  await generatePdf();
}

main().catch(console.error);
