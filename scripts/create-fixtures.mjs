import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib'
import { mkdir, writeFile } from 'node:fs/promises'

const palettes = [
  ['#153e35', '#dfe6c5'],
  ['#f4eadb', '#174b42'],
  ['#e7aa78', '#432d29'],
  ['#d9e2df', '#224b47'],
  ['#293f57', '#e9dec8'],
  ['#ece8dd', '#284d41'],
]
function color(hex) {
  return rgb(
    ...hex
      .slice(1)
      .match(/../g)
      .map((part) => parseInt(part, 16) / 255),
  )
}

async function makePdf(count, title, landscape = false) {
  const pdf = await PDFDocument.create()
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const serif = await pdf.embedFont(StandardFonts.TimesRoman)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  pdf.setTitle(title)
  pdf.setAuthor('MTowa / Vue Flipbook contributors')
  pdf.setSubject('Original demo artwork, distributed under the MIT license')
  pdf.setCreationDate(new Date('2026-11-11T00:00:00Z'))
  pdf.setModificationDate(new Date('2026-11-11T00:00:00Z'))
  for (let index = 0; index < count; index++) {
    const [width, height] = landscape ? [595, 420] : [420, 595]
    const page = pdf.addPage([width, height])
    const [background, ink] = palettes[index % palettes.length].map(color)
    page.drawRectangle({ width, height, color: background })
    const text = (value, x, y, size, font = regular) =>
      page.drawText(value, { x, y, size, font, color: ink })
    text('FIELDNOTES', 32, height - 42, 11, bold)
    text('A SMALL COLLECTION OF DISCOVERIES', 32, height - 60, 6.5)
    page.drawLine({
      start: { x: 32, y: height - 75 },
      end: { x: width - 32, y: height - 75 },
      thickness: 0.7,
      color: ink,
      opacity: 0.6,
    })
    if (index === 0) {
      page.drawCircle({ x: width * 0.73, y: height * 0.43, size: 128, color: ink, opacity: 0.13 })
      for (let n = 0; n < 6; n++)
        page.drawRectangle({
          x: width * 0.4 + n * 16,
          y: height * 0.22 + n * 8,
          width: 100,
          height: 170,
          rotate: degrees(-18 + n * 7),
          borderColor: ink,
          borderWidth: 1,
          opacity: 0.55,
        })
      text('A little', 32, height - 157, 52, serif)
      text('perspective.', 32, height - 212, 52, serif)
      text(title.toUpperCase(), 32, 78, 10, bold)
      text('Open a page. Find something new.', 32, 59, 10)
    } else {
      const titles = [
        '',
        'Take the slow road.',
        'Room to explore.',
        'A closer look.',
        'Between the lines.',
        'Keep discovering.',
      ]
      text(String(index).padStart(2, '0'), 32, height - 135, 16, bold)
      text(titles[index % 6] || 'A new perspective.', 32, height - 183, 31, serif)
      page.drawRectangle({
        x: 32,
        y: 124,
        width: width - 64,
        height: Math.max(70, height - 350),
        color: ink,
        opacity: 0.08,
      })
      for (let n = 0; n < 5; n++)
        page.drawCircle({
          x: width * 0.5,
          y: 140 + (height - 350) * 0.45,
          size: 22 + n * 17,
          borderColor: ink,
          borderWidth: 0.8,
          opacity: 0.7,
        })
      text('Spaces, stories, and the things we notice along the way.', 32, 94, 9)
      text('Made for the Vue Flipbook demo. No external assets.', 32, 77, 9)
    }
    page.drawLine({
      start: { x: 32, y: 40 },
      end: { x: width - 32, y: 40 },
      thickness: 0.6,
      color: ink,
      opacity: 0.5,
    })
    text('VUE FLIPBOOK / ORIGINAL SAMPLE', 32, 25, 7)
    text(String(index + 1).padStart(2, '0'), width - 48, 24, 9, bold)
  }
  return pdf.save({ useObjectStreams: false })
}

for (const directory of [
  'tests/fixtures',
  'playground/vue-app/public',
  'playground/nuxt-app/public',
]) {
  await mkdir(directory, { recursive: true })
  for (const [name, count, landscape] of [
    ['sample', 6, false],
    ['alternate', 3, true],
    ['long', 80, false],
    ['single', 1, false],
  ]) {
    await writeFile(
      `${directory}/${name}.pdf`,
      await makePdf(count, name === 'sample' ? 'The everyday issue' : `${name} edition`, landscape),
    )
  }
}
console.log('Created original 6-, 3-, 80-, and 1-page PDF fixtures for both playgrounds.')
