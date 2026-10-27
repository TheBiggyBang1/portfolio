/**
 * All site copy lives here. Headlines use *asterisks* around the italic key words.
 * Results and numbers come from the published model cards and repos linked below.
 * Anything in [BRACKETS] is a placeholder for you to fill in.
 */

export const PROFILE = {
  name: 'Mehdi Handous',
  email: 'mehdihandous1@gmail.com',
  linkedin: 'https://www.linkedin.com/in/mehdi-handous',
  github: 'https://github.com/TheBiggyBang1',
}

export interface ChapterLink {
  label: string
  href: string
}

export interface Chapter {
  id: string
  number: string
  label: string
  /** One line for the chapters menu. */
  line: string
  title: string
  body: string[]
  tags?: string[]
  /** The first link is the main button; any others render as quieter text links. */
  links?: ChapterLink[]
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'hello',
    number: '01',
    label: 'Hello',
    line: 'Who I am, in a nutshell.',
    title: 'Mehdi *Handous*',
    body: [
      "Hey, I'm Mehdi. I'm 25, I study AI engineering, and somewhere along the way I fell for web design too.",
      "This little site is the story of what I've been building. Scroll on, I'll walk you through it.",
    ],
  },
  {
    id: 'voice',
    number: '02',
    label: 'Voice',
    line: 'Teaching Whisper to understand Tunisian Darija.',
    title: 'Teaching machines to *listen* to Darija',
    body: [
      "Tunisian Darija is Arabic with French and a bit of English woven right in. It's how we actually talk, and most speech models simply don't get it.",
      "So I fine-tuned OpenAI's Whisper on Darija speech, teaching it to hear the language the way people here really speak it. On a held-out test set, the word error rate fell from 79.1% to 30.4%.",
    ],
    tags: ['OpenAI Whisper', 'Fine-tuning', 'CTranslate2'],
    links: [
      { label: 'View model', href: 'https://huggingface.co/TheBiggyBang/whisper-small-tunisian-derja' },
      { label: 'Fast version', href: 'https://huggingface.co/TheBiggyBang/whisper-small-tunisian-derja-ct2' },
    ],
  },
  {
    id: 'studio',
    number: '03',
    label: 'Autonomous Studio',
    line: 'A little team of agents making kids’ videos.',
    title: 'A studio that runs *itself*',
    body: [
      "I built a small team of AI agents that invents, writes, voices and animates kids' videos, then publishes them on YouTube. My only job is a thumbs-up before each one goes live.",
      "Each agent has one job and passes its work to the next. Picture a tiny production house that never takes a coffee break.",
    ],
    tags: ['Multi-agent systems', 'LangGraph', 'Remotion'],
    links: [
      { label: 'View code', href: 'https://github.com/TheBiggyBang1/KiddyAgents' },
      { label: 'Watch the channel', href: 'https://www.youtube.com/@Learnplaygrow-g2k' },
    ],
  },
  {
    id: 'vision',
    number: '04',
    label: 'Vision',
    line: 'Spotting 14 findings in chest X-rays.',
    title: 'Reading lungs, *one* X-ray at a time',
    body: [
      'I trained a CheXNet-style DenseNet-121 to read chest X-rays and flag 14 different findings, learning from more than 33,000 images.',
      "Medical imaging taught me patience: clean data, honest validation, and never forgetting there's a real person behind every scan. It reaches a mean AUROC of 0.77 across all 14, built for research, not diagnosis.",
    ],
    tags: ['Computer vision', 'Medical imaging', 'DenseNet-121'],
    links: [{ label: 'View model', href: 'https://huggingface.co/TheBiggyBang/chexnet-densenet121' }],
  },
  {
    id: 'toolkit',
    number: '05',
    label: 'Toolkit',
    line: 'The little tools that make my days lighter.',
    title: 'I build my own *shortcuts*',
    body: [
      "If something slows me down twice, I build a tool for it. That's pretty much the rule.",
      'Over time it grew into a small collection of plugins and agents. One of them, ScrollProof, scrolls through a site like a real visitor and tells me exactly which animation broke, and why.',
    ],
    tags: ['AI agents', 'Claude Code plugins', 'Playwright'],
    links: [{ label: 'See ScrollProof', href: 'https://github.com/TheBiggyBang1/ScrollProof' }],
  },
  {
    id: 'mindset',
    number: '06',
    label: 'Mindset',
    line: 'Curiosity, code reviews, and being part of a team.',
    title: 'Part of something *bigger*',
    body: [
      "I love anything new, especially the stuff that looks a bit scary at first. That first wall is usually where it gets interesting.",
      "I genuinely enjoy code reviews and untangling messy problems, and I'm at my best when I feel like one piece of something bigger than me.",
    ],
  },
  {
    id: 'craft',
    number: '07',
    label: 'Craft & Contact',
    line: 'Design, 3D, and how to say hi.',
    title: 'Craft in every *dimension*',
    body: [
      "When I'm not training models, you'll usually find me doing graphic design or modeling something in 3D.",
      "It keeps my eye sharp, and it reminds me that how something feels matters just as much as how it works.",
    ],
  },
]

export const MINDSET_POINTS = [
  { title: 'New over familiar', text: 'If it looks hard, I get curious.' },
  { title: 'Reviews make us better', text: 'I like reading code as much as writing it.' },
  { title: 'Bigger than me', text: 'Good work is almost always a team sport.' },
]

export interface GalleryItem {
  title: string
  kind: string
  href: string
  cta: string
  /** Image in public/gallery. */
  image: string
  alt: string
  /** 'cover' fills the tile (renders, photos); 'contain' floats it on the tile (logos, packshots). */
  fit: 'cover' | 'contain'
}

export const GALLERY: GalleryItem[] = [
  {
    title: '5Sens Advertising',
    kind: 'Advertising campaign',
    href: 'https://www.youtube.com/watch?v=np8BgdqZXBw',
    cta: 'Watch the ad',
    image: '/gallery/5sens.webp',
    alt: 'The 5Sens Advertising logo glowing above a rooftop pool at night',
    fit: 'cover',
  },
  {
    title: 'KillerGel',
    kind: 'Advertising campaign',
    href: 'https://www.youtube.com/watch?v=Rf80hWADEcg',
    cta: 'Watch the ad',
    image: '/gallery/killergel.webp',
    alt: 'KillerGel product packaging',
    fit: 'contain',
  },
  {
    title: 'DoctorCom',
    kind: 'Website',
    href: 'https://doctorcomtunis.com/',
    cta: 'Visit the site',
    image: '/gallery/doctorcom.webp',
    alt: 'DoctorCom logo, powered by 5 Sens Advertising',
    fit: 'contain',
  },
]

/** A real line from the model's held-out test set (its output matched the reference exactly). */
export const DARIJA_SAMPLE = {
  audioLabel: 'Darija audio',
  transcript: 'كيفاش أحنا on va changer le process',
  gloss: 'Darija and French in one sentence, transcribed word for word.',
  note: 'Real test-set output',
}

/** Placeholders render as inert links until you replace them. */
export const isPlaceholder = (href: string) => href.startsWith('[')
