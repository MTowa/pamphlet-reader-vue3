import { mkdir, writeFile } from 'node:fs/promises'

// SVG counterparts of the original six-page PDF fixture. Text remains text;
// standard browser fonts are used, so font metrics can differ from the PDF.
const palettes = [
  ['#153e35', '#dfe6c5'],
  ['#f4eadb', '#174b42'],
  ['#e7aa78', '#432d29'],
  ['#d9e2df', '#224b47'],
  ['#293f57', '#e9dec8'],
  ['#ece8dd', '#284d41'],
]
const titles = [
  '',
  'Take the slow road.',
  'Room to explore.',
  'A closer look.',
  'Between the lines.',
  'Keep discovering.',
]
for (const directory of [
  'playground/vue-app/public/pamphlet',
  'playground/nuxt-app/public/pamphlet',
]) {
  await mkdir(directory, { recursive: true })
  for (let index = 0; index < 6; index++) {
    const [background, ink] = palettes[index]
    const parts = [
      `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="595" viewBox="0 0 420 595"><title>Fieldnotes — page ${index + 1}</title><rect width="420" height="595" fill="${background}"/><g fill="${ink}" stroke="${ink}">`,
    ]
    const text = (value, x, y, size, font = 'sans-serif', bold = false) =>
      parts.push(
        `<text x="${x}" y="${595 - y}" font-size="${size}" font-family="${font}" font-weight="${bold ? 700 : 400}" stroke="none">${value}</text>`,
      )
    const line = (y, width, opacity) =>
      parts.push(`<path d="M32 ${595 - y}H388" stroke-width="${width}" opacity="${opacity}"/>`)
    text('FIELDNOTES', 32, 553, 11, 'sans-serif', true)
    text('A SMALL COLLECTION OF DISCOVERIES', 32, 535, 6.5)
    line(520, 0.7, 0.6)
    if (index === 0) {
      parts.push('<circle cx="306.6" cy="339.15" r="128" opacity="0.13" stroke="none"/>')
      for (let n = 0; n < 6; n++)
        parts.push(
          `<rect x="0" y="-170" width="100" height="170" fill="none" stroke-width="1" opacity="0.55" transform="translate(${168 + n * 16} ${464.1 - n * 8}) rotate(${18 - n * 7})"/>`,
        )
      text('A little', 32, 438, 52, 'serif')
      text('perspective.', 32, 383, 52, 'serif')
      text('THE EVERYDAY ISSUE', 32, 78, 10, 'sans-serif', true)
      text('Open a page. Find something new.', 32, 59, 10)
    } else {
      text(String(index).padStart(2, '0'), 32, 460, 16, 'sans-serif', true)
      text(titles[index], 32, 412, 31, 'serif')
      parts.push('<rect x="32" y="226" width="356" height="245" opacity="0.08" stroke="none"/>')
      for (let n = 0; n < 5; n++)
        parts.push(
          `<circle cx="210" cy="344.75" r="${22 + n * 17}" fill="none" stroke-width="0.8" opacity="0.7"/>`,
        )
      text('Spaces, stories, and the things we notice along the way.', 32, 94, 9)
      text('Made for the Vue Flipbook demo. No external assets.', 32, 77, 9)
    }
    line(40, 0.6, 0.5)
    text('VUE FLIPBOOK / ORIGINAL SAMPLE', 32, 25, 7)
    text(String(index + 1).padStart(2, '0'), 372, 24, 9, 'sans-serif', true)
    parts.push('</g></svg>')
    await writeFile(
      `${directory}/${String(index + 1).padStart(3, '0')}.svg`,
      parts.join('\n') + '\n',
    )
  }
}
console.log('Created original SVG counterparts in both playground folders.')
