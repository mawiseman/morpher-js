/**
 * MorpherJS v2.0 Demos
 *
 * Converted from original demos to use ES6+ library
 */

import { Morpher, Image as MorpherImage } from 'morpher-js';

// Easing Functions
const easingFunctions = {
  easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  },

  easeOutElastic(t) {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },

  custom(v) {
    return Math.floor(v * 3) % 2 ? 1 - ((v * 3) % 1) : (v * 3) % 1;
  }
};

// Demo 1: Basic Setup
function initDemo1() {
  const json = {
    images: [
      {
        points: [
          { x: 139, y: 27 }, { x: 169, y: 46 }, { x: 177, y: 0 }, { x: 194, y: 34 },
          { x: 237, y: 3 }, { x: 237, y: 36 }, { x: 105, y: 112 }, { x: 219, y: 87 },
          { x: 206, y: 164 }, { x: 44, y: 208 }, { x: 18, y: 54 }, { x: 68, y: 22 },
          { x: 126, y: 220 }, { x: 0, y: 137 }, { x: 98, y: 14 }, { x: 88, y: 11 },
          { x: 130, y: 17 }, { x: 149, y: 22 }, { x: 174, y: 43 }, { x: 202, y: 61 }
        ],
        src: '../images/plum.png'
      },
      {
        points: [
          { x: 103, y: 85 }, { x: 125, y: 86 }, { x: 98, y: 15 }, { x: 130, y: 40 },
          { x: 145, y: 0 }, { x: 159, y: 23 }, { x: 108, y: 172 }, { x: 215, y: 122 },
          { x: 211, y: 209 }, { x: 126, y: 294 }, { x: 20, y: 212 }, { x: 23, y: 141 },
          { x: 187, y: 266 }, { x: 49, y: 274 }, { x: 29, y: 102 }, { x: 0, y: 135 },
          { x: 8, y: 69 }, { x: 96, y: 52 }, { x: 127, y: 68 }, { x: 229, y: 99 }
        ],
        src: '../images/raspberry.png'
      }
    ],
    triangles: [
      [5, 3, 2], [2, 4, 5], [6, 1, 0], [6, 1, 7], [8, 7, 6], [10, 11, 6],
      [8, 6, 12], [9, 6, 12], [9, 6, 13], [10, 6, 13], [11, 6, 14], [0, 6, 14],
      [15, 14, 11], [16, 14, 15], [0, 14, 16], [0, 3, 17], [2, 3, 17], [17, 16, 0],
      [1, 0, 18], [3, 0, 18], [19, 7, 1], [1, 18, 19]
    ]
  };

  const morpher = new Morpher(json);
  const demo = document.getElementById('demo1');
  const preview = demo.querySelector('.preview');

  morpher.on('load', () => {
    preview.insertBefore(morpher.canvas, preview.firstChild);
  });

  demo.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      morpher.set([1, 0]);
      if (btn.dataset.action === 'play') {
        morpher.animate([0, 1], 2000);
      }
    });
  });

  demo.querySelector('input').addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    morpher.set([1 - v, v]);
  });
}

// Demo 2: Multiple Images
function initDemo2() {
  const json = {
    images: [
      {
        points: [
          { x: 22, y: 55 }, { x: 30, y: 8 }, { x: 88, y: 8 }, { x: 42, y: 59 },
          { x: 115, y: 70 }, { x: 32, y: 114 }, { x: 74, y: 160 }, { x: 174, y: 118 },
          { x: 223, y: 190 }, { x: 235, y: 265 }, { x: 198, y: 280 }, { x: 119, y: 209 },
          { x: 208, y: 203 }, { x: 55, y: 30 }, { x: 70, y: 195 }, { x: 75, y: 210 },
          { x: 152, y: 244 }, { x: 103, y: 275 }, { x: 161, y: 305 }, { x: 86, y: 309 },
          { x: 87, y: 167 }, { x: 75, y: 179 }, { x: 75, y: 239 }, { x: 138, y: 200 },
          { x: 130, y: 226 }, { x: 75, y: 224.5 }
        ],
        src: '../images/parrot-1.jpg',
        x: 0,
        y: 0
      },
      {
        points: [
          { x: 11, y: 46 }, { x: 19, y: 12 }, { x: 62, y: 8 }, { x: 31, y: 53 },
          { x: 89, y: 54 }, { x: 28, y: 97 }, { x: 60, y: 130 }, { x: 134, y: 90 },
          { x: 209, y: 143 }, { x: 191, y: 203 }, { x: 157, y: 186 }, { x: 115, y: 160 },
          { x: 163, y: 154 }, { x: 44, y: 24 }, { x: 65, y: 154 }, { x: 81, y: 179 },
          { x: 153, y: 215 }, { x: 112, y: 247 }, { x: 130, y: 300 }, { x: 89, y: 304 },
          { x: 74, y: 131 }, { x: 65, y: 143 }, { x: 102, y: 210 }, { x: 134, y: 149 },
          { x: 135, y: 177 }, { x: 101, y: 196 }
        ],
        src: '../images/parrot-2.jpg',
        x: 0,
        y: 0
      },
      {
        points: [
          { x: 24, y: 34 }, { x: 42, y: 10 }, { x: 91, y: 15 }, { x: 51, y: 68 },
          { x: 113, y: 52 }, { x: 48, y: 104 }, { x: 90, y: 149 }, { x: 174.84, y: 99.99 },
          { x: 240, y: 205 }, { x: 238, y: 238 }, { x: 184, y: 236 }, { x: 155, y: 200 },
          { x: 219, y: 202 }, { x: 60, y: 28 }, { x: 100, y: 221 }, { x: 126, y: 229 },
          { x: 174, y: 246 }, { x: 122, y: 269 }, { x: 143, y: 325 }, { x: 96, y: 327 },
          { x: 122, y: 169 }, { x: 68, y: 178 }, { x: 124.5, y: 250.5 }, { x: 171, y: 190 },
          { x: 164.5, y: 223 }, { x: 125.25, y: 239.75 }
        ],
        src: '../images/parrot-3.jpg',
        x: 0,
        y: 0
      }
    ],
    triangles: [
      [4, 2, 3], [5, 3, 4], [6, 4, 5], [7, 4, 6], [7, 8, 12], [9, 8, 12],
      [7, 10, 12], [9, 10, 12], [0, 1, 13], [2, 1, 13], [0, 3, 13], [2, 3, 13],
      [11, 7, 15], [18, 16, 17], [19, 17, 18], [7, 15, 20], [14, 15, 20],
      [20, 6, 7], [6, 21, 20], [21, 14, 20], [17, 16, 22], [11, 7, 23],
      [10, 7, 23], [11, 15, 24], [16, 15, 24], [22, 16, 25], [15, 16, 25]
    ]
  };

  const morpher = new Morpher(json);
  const demo = document.getElementById('demo2');
  const preview = demo.querySelector('.preview');

  morpher.on('load', () => {
    preview.insertBefore(morpher.canvas, preview.firstChild);
  });

  const inputs = demo.querySelectorAll('input[type=range]');
  const checkbox = demo.querySelector('input[type=checkbox]');
  let factors = [1, 0, 0];

  const normalizeFactors = () => {
    const total = factors.reduce((a, b) => a + b);
    const gain = (1 - Math.min(total, 1)) / factors.length;
    return factors.map(f => f / Math.max(total, 1) + gain);
  };

  inputs.forEach((input, i) => {
    input.addEventListener('input', (e) => {
      factors[i] = parseFloat(e.target.value);
      if (checkbox.checked) {
        morpher.set(normalizeFactors());
      } else {
        morpher.set(factors);
      }
    });
  });

  checkbox.addEventListener('change', () => {
    morpher.set(checkbox.checked ? normalizeFactors() : factors);
  });
}

// Demo 3: Easing
function initDemo3() {
  const json = {
    images: [
      {
        points: [
          { x: 139, y: 27 }, { x: 169, y: 46 }, { x: 177, y: 0 }, { x: 194, y: 34 },
          { x: 237, y: 3 }, { x: 237, y: 36 }, { x: 105, y: 112 }, { x: 219, y: 87 },
          { x: 206, y: 164 }, { x: 44, y: 208 }, { x: 18, y: 54 }, { x: 68, y: 22 },
          { x: 126, y: 220 }, { x: 0, y: 137 }, { x: 98, y: 14 }, { x: 88, y: 11 },
          { x: 130, y: 17 }, { x: 149, y: 22 }, { x: 174, y: 43 }, { x: 202, y: 61 }
        ],
        src: '../images/plum.png'
      },
      {
        points: [
          { x: 103, y: 85 }, { x: 125, y: 86 }, { x: 98, y: 15 }, { x: 130, y: 40 },
          { x: 145, y: 0 }, { x: 159, y: 23 }, { x: 108, y: 172 }, { x: 215, y: 122 },
          { x: 211, y: 209 }, { x: 126, y: 294 }, { x: 20, y: 212 }, { x: 23, y: 141 },
          { x: 187, y: 266 }, { x: 49, y: 274 }, { x: 29, y: 102 }, { x: 0, y: 135 },
          { x: 8, y: 69 }, { x: 96, y: 52 }, { x: 127, y: 68 }, { x: 229, y: 99 }
        ],
        src: '../images/raspberry.png'
      }
    ],
    triangles: [
      [5, 3, 2], [2, 4, 5], [6, 1, 0], [6, 1, 7], [8, 7, 6], [10, 11, 6],
      [8, 6, 12], [9, 6, 12], [9, 6, 13], [10, 6, 13], [11, 6, 14], [0, 6, 14],
      [15, 14, 11], [16, 14, 15], [0, 14, 16], [0, 3, 17], [2, 3, 17], [17, 16, 0],
      [1, 0, 18], [3, 0, 18], [19, 7, 1], [1, 18, 19]
    ]
  };

  const morpher = new Morpher(json);
  const demo = document.getElementById('demo3');
  const preview = demo.querySelector('.preview');

  morpher.on('load', () => {
    preview.insertBefore(morpher.canvas, preview.firstChild);
  });

  demo.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      morpher.set([1, 0]);

      if (action !== 'reset') {
        const easingFunc = easingFunctions[action];
        morpher.animate([0, 1], 2000, easingFunc);
      }
    });
  });
}

// Demo 4: Blend & Final Touch
function initDemo4() {
  const json = {
    images: [
      {
        points: [
          { x: 139, y: 27 }, { x: 169, y: 46 }, { x: 177, y: 0 }, { x: 194, y: 34 },
          { x: 237, y: 3 }, { x: 237, y: 36 }, { x: 105, y: 112 }, { x: 219, y: 87 },
          { x: 206, y: 164 }, { x: 44, y: 208 }, { x: 18, y: 54 }, { x: 68, y: 22 },
          { x: 126, y: 220 }, { x: 0, y: 137 }, { x: 98, y: 14 }, { x: 88, y: 11 },
          { x: 130, y: 17 }, { x: 149, y: 22 }, { x: 174, y: 43 }, { x: 202, y: 61 }
        ],
        src: '../images/plum-contour.png'
      },
      {
        points: [
          { x: 103, y: 85 }, { x: 125, y: 86 }, { x: 98, y: 15 }, { x: 130, y: 40 },
          { x: 145, y: 0 }, { x: 159, y: 23 }, { x: 108, y: 172 }, { x: 215, y: 122 },
          { x: 211, y: 209 }, { x: 126, y: 294 }, { x: 20, y: 212 }, { x: 23, y: 141 },
          { x: 187, y: 266 }, { x: 49, y: 274 }, { x: 29, y: 102 }, { x: 0, y: 135 },
          { x: 8, y: 69 }, { x: 96, y: 52 }, { x: 127, y: 68 }, { x: 229, y: 99 }
        ],
        src: '../images/raspberry-contour.png'
      }
    ],
    triangles: [
      [5, 3, 2], [2, 4, 5], [6, 1, 0], [6, 1, 7], [8, 7, 6], [10, 11, 6],
      [8, 6, 12], [9, 6, 12], [9, 6, 13], [10, 6, 13], [11, 6, 14], [0, 6, 14],
      [15, 14, 11], [16, 14, 15], [0, 14, 16], [0, 3, 17], [2, 3, 17], [17, 16, 0],
      [1, 0, 18], [3, 0, 18], [19, 7, 1], [1, 18, 19]
    ]
  };

  const morpher = new Morpher(json);
  const demo = document.getElementById('demo4');
  const preview = demo.querySelector('.preview');

  morpher.on('load', () => {
    preview.insertBefore(morpher.canvas, preview.firstChild);
  });

  // Custom blend function (creates glow effect)
  const customBlendFunction = (destination, source, weight) => {
    const dCtx = destination.getContext('2d');
    const sCtx = source.getContext('2d');
    const dData = dCtx.getImageData(0, 0, source.width, source.height);
    const sData = sCtx.getImageData(0, 0, source.width, source.height);

    const distance = Math.round((1 - weight) * 3);
    const factor = Math.sin(weight * Math.PI / 2) * 255;

    for (let x = 0; x < source.width; x++) {
      for (let y = 0; y < source.height; y++) {
        if (sData.data[(y * source.width + x) * 4 + 3] >= 128) {
          const minX = Math.max(0, x - distance);
          const maxX = Math.min(source.width - 1, x + distance);
          const minY = Math.max(0, y - distance);
          const maxY = Math.min(source.height - 1, y + distance);
          const strength = factor / ((maxX - minX) * (maxY - minY));

          for (let x1 = minX; x1 <= maxX; x1++) {
            for (let y1 = minY; y1 <= maxY; y1++) {
              dData.data[(y1 * source.width + x1) * 4 + 3] += strength;
            }
          }
        }
      }
    }
    dCtx.putImageData(dData, 0, 0);
  };

  // Custom final touch function (threshold alpha channel)
  const customFinalTouchFunction = (canvas) => {
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);

    for (let i = 3; i < data.data.length; i += 4) {
      data.data[i] = data.data[i] > 128 ? 255 : 0;
    }

    ctx.putImageData(data, 0, 0);
  };

  demo.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      morpher.set([1, 0]);
      if (btn.dataset.action === 'play') {
        morpher.animate([0, 1], 2000, easingFunctions.easeInOutCubic);
      }
    });
  });

  demo.querySelector('input[type=range]').addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    morpher.set([1 - v, v]);
  });

  demo.querySelectorAll('input[type=checkbox]').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const name = checkbox.name + 'Function';
      if (name === 'blendFunction') {
        morpher.blendFunction = checkbox.checked ? customBlendFunction : null;
      } else if (name === 'finalTouchFunction') {
        morpher.finalTouchFunction = checkbox.checked ? customFinalTouchFunction : null;
      }
      morpher.draw();
    });
  });
}

// Demo 5: API Usage
function initDemo5() {
  const morpher = new Morpher();
  const demo = document.getElementById('demo5');
  const preview = demo.querySelector('.preview');

  // Add first image using JSON
  morpher.addImage({ src: '/images/parrot-1.jpg' });

  // Add second image using Image class
  const image2 = new MorpherImage();
  const img = new window.Image();
  img.src = '/images/parrot-2.jpg';
  image2.setImage(img);
  morpher.addImage(image2);

  // Add third image using canvas
  const image3 = new MorpherImage();
  const canvas = document.createElement('canvas');
  canvas.width = 234;
  canvas.height = 317;
  const ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.arc(117, 159, 50, 0, 2 * Math.PI);
  ctx.fill();
  image3.setImage(canvas);
  morpher.addImage(image3);

  // Define mesh
  morpher.addPoint(0, 0);
  morpher.addPoint(234, 317);
  morpher.addPoint(0, 317);

  morpher.addTriangle(0, 1, 2);

  // Modify points for different images
  image2.points[0].setX(117).setY(50);
  image3.points[0].setX(234).setY(0);

  morpher.set([1, 0, 0]);

  morpher.on('load', () => {
    preview.insertBefore(morpher.canvas, preview.firstChild);
  });

  const inputs = demo.querySelectorAll('input[type=range]');
  let factors = [1, 0, 0];

  const normalizeFactors = () => {
    const total = factors.reduce((a, b) => a + b);
    const gain = (1 - Math.min(total, 1)) / factors.length;
    return factors.map(f => f / Math.max(total, 1) + gain);
  };

  inputs.forEach((input, i) => {
    input.addEventListener('input', (e) => {
      factors[i] = parseFloat(e.target.value);
      morpher.set(normalizeFactors());
    });
  });
}

// Initialize all demos
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing MorpherJS v2.0 Demos...');

  initDemo1();
  initDemo2();
  initDemo3();
  initDemo4();
  initDemo5();

  console.log('All demos initialized!');
});
