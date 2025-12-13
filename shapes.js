export function heartShape(count) {
  return Array.from({ length: count }, () => {
    const t = Math.random() * Math.PI * 2;
    return {
      x: 0.16 * Math.pow(Math.sin(t), 3),
      y: 0.13 * Math.cos(t) - 0.05 * Math.cos(2*t),
      z: (Math.random() - 0.5) * 0.2
    };
  });
}

export function saturnShape(count) {
  return Array.from({ length: count }, () => {
    const a = Math.random() * Math.PI * 2;
    const r = 1.5 + Math.random() * 0.2;
    return {
      x: Math.cos(a) * r,
      y: (Math.random() - 0.5) * 0.1,
      z: Math.sin(a) * r
    };
  });
}

export function fireworksShape(count) {
  return Array.from({ length: count }, () => {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 2;
    return {
      x: Math.cos(a) * r,
      y: Math.sin(a) * r,
      z: (Math.random() - 0.5) * r
    };
  });
}
