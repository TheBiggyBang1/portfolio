import { t } from './lang'

/**
 * All site copy lives here, in English and French side by side: `t(english, french)`.
 * Headlines use *asterisks* around the italic key words.
 * Results and numbers come from the published model cards and repos linked below.
 * Anything in [BRACKETS] is a placeholder for you to fill in.
 */

export const PROFILE = {
  name: 'Mehdi Handous',
  email: 'mehdihandous1@gmail.com',
  linkedin: 'https://www.linkedin.com/in/mehdi-handous/',
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
  body: readonly string[]
  tags?: readonly string[]
  /** The first link is the main button; any others render as quieter text links. */
  links?: ChapterLink[]
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'hello',
    number: '01',
    label: t('Hello', 'Bonjour'),
    line: t('Who I am, in a nutshell.', 'Qui je suis, en quelques mots.'),
    title: 'Mehdi *Handous*',
    body: t(
      [
        "Hey, I'm Mehdi. I'm 25, I study AI engineering, and somewhere along the way I fell for web design too.",
        "This little site is the story of what I've been building. Scroll on, I'll walk you through it.",
      ],
      [
        'Bonjour, moi c’est Mehdi. J’ai 25 ans, j’étudie l’ingénierie en intelligence artificielle, et en chemin je suis aussi tombé amoureux du web design.',
        'Ce petit site raconte ce que j’ai construit jusqu’ici. Faites défiler, je vous emmène.',
      ],
    ),
  },
  {
    id: 'voice',
    number: '02',
    label: t('Voice', 'Voix'),
    line: t('Teaching Whisper to understand Tunisian Derja.', 'Apprendre à Whisper à comprendre le derja tunisien.'),
    title: t('Teaching machines to *listen* to Derja', 'Apprendre aux machines à *écouter* le derja'),
    body: t(
      [
        "Tunisian Derja is Arabic with French and a bit of English woven right in. It's how we actually talk, and most speech models simply don't get it.",
        "So I fine-tuned OpenAI's Whisper on Derja speech, teaching it to hear the language the way people here really speak it. On a held-out test set, the word error rate fell from 79.1% to 30.4%.",
      ],
      [
        'Le derja tunisien, c’est de l’arabe mêlé de français et d’un peu d’anglais. C’est notre façon de parler au quotidien, et la plupart des modèles vocaux n’y comprennent tout simplement rien.',
        'J’ai donc affiné le modèle Whisper d’OpenAI sur de la parole en derja, pour qu’il entende la langue telle qu’on la parle vraiment ici. Sur un jeu de test indépendant, le taux d’erreur par mot est passé de 79,1 % à 30,4 %.',
      ],
    ),
    tags: ['OpenAI Whisper', 'Fine-tuning', 'CTranslate2'],
    links: [
      { label: t('View model', 'Voir le modèle'), href: 'https://huggingface.co/TheBiggyBang/whisper-small-tunisian-derja' },
      { label: t('Fast version', 'Version rapide'), href: 'https://huggingface.co/TheBiggyBang/whisper-small-tunisian-derja-ct2' },
    ],
  },
  {
    id: 'studio',
    number: '03',
    label: t('Autonomous Studio', 'Studio autonome'),
    line: t('A little team of agents making kids’ videos.', 'Une petite équipe d’agents qui crée des vidéos pour enfants.'),
    title: t('A studio that runs *itself*', 'Un studio qui tourne *tout seul*'),
    body: t(
      [
        "I built a small team of AI agents that invents, writes, voices and animates kids' videos, then publishes them on YouTube. My only job is a thumbs-up before each one goes live.",
        'Each agent has one job and passes its work to the next. Picture a tiny production house that never takes a coffee break.',
      ],
      [
        'J’ai construit une petite équipe d’agents IA qui imagine, écrit, double et anime des vidéos pour enfants, puis les publie sur YouTube. Mon seul rôle : donner mon feu vert avant chaque mise en ligne.',
        'Chaque agent a une seule mission et passe son travail au suivant. Imaginez une mini maison de production qui ne prend jamais de pause café.',
      ],
    ),
    tags: t(['Multi-agent systems', 'LangGraph', 'Remotion'], ['Systèmes multi-agents', 'LangGraph', 'Remotion']),
    links: [
      { label: t('View code', 'Voir le code'), href: 'https://github.com/TheBiggyBang1/KiddyAgents' },
      { label: t('Watch the channel', 'Voir la chaîne'), href: 'https://www.youtube.com/@Learnplaygrow-g2k' },
    ],
  },
  {
    id: 'vision',
    number: '04',
    label: 'Vision',
    line: t('Spotting 14 findings in chest X-rays.', 'Repérer 14 anomalies sur des radios du thorax.'),
    title: t('Scanning lungs, *one* X-ray at a time', 'Scanner les poumons, *une* radio à la fois'),
    body: t(
      [
        'I trained a CheXNet-style DenseNet-121 to read chest X-rays and flag 14 different findings, learning from more than 33,000 images.',
        "Medical imaging taught me patience: clean data, honest validation, and never forgetting there's a real person behind every scan. It reaches a mean AUROC of 0.77 across all 14, built for research, not diagnosis.",
      ],
      [
        'J’ai entraîné un DenseNet-121 de type CheXNet à lire des radiographies thoraciques et à signaler 14 anomalies différentes, en apprenant sur plus de 33 000 images.',
        'L’imagerie médicale m’a appris la patience : des données propres, une validation honnête, et ne jamais oublier qu’il y a une vraie personne derrière chaque cliché. Le modèle atteint une AUROC moyenne de 0,77 sur les 14 classes d’anomalies, et il est conçu pour la recherche, pas pour le diagnostic.',
      ],
    ),
    tags: t(
      ['Computer vision', 'Medical imaging', 'DenseNet-121'],
      ['Vision par ordinateur', 'Imagerie médicale', 'DenseNet-121'],
    ),
    links: [{ label: t('View model', 'Voir le modèle'), href: 'https://huggingface.co/TheBiggyBang/chexnet-densenet121' }],
  },
  {
    id: 'toolkit',
    number: '05',
    label: t('Toolkit', 'Boîte à outils'),
    line: t('The little tools that make my days lighter.', 'Les petits outils qui me simplifient la vie.'),
    title: t('I build my own *shortcuts*', 'Je crée mes propres *raccourcis*'),
    body: t(
      [
        "If something slows me down twice, I build a tool for it. That's pretty much the rule.",
        'Over time it grew into a small collection of plugins and agents. One of them, ScrollProof, scrolls through a site like a real visitor and tells me exactly which animation broke, and why.',
      ],
      [
        'Si quelque chose me ralentit, je construis un outil pour ça. C’est à peu près la règle.',
        'Avec le temps, c’est devenu une petite collection de plugins et d’agents. L’un d’eux, ScrollProof, parcourt un site comme un vrai visiteur et me dit exactement quelle animation a cassé, et pourquoi.',
      ],
    ),
    tags: t(['AI agents', 'Claude Code plugins', 'Playwright'], ['Agents IA', 'Plugins Claude Code', 'Playwright']),
    links: [{ label: t('See ScrollProof', 'Voir ScrollProof'), href: 'https://github.com/TheBiggyBang1/ScrollProof' }],
  },
  {
    id: 'mindset',
    number: '06',
    label: t('Mindset', 'État d’esprit'),
    line: t('Curiosity, code reviews, and being part of a team.', 'Curiosité, revues de code et esprit d’équipe.'),
    title: t('Part of something *bigger*', 'Faire partie de quelque chose de *plus grand*'),
    body: t(
      [
        'I love anything new, especially the stuff that looks a bit scary at first. That first wall is usually where it gets interesting.',
        "I genuinely enjoy code reviews and untangling messy problems, and I'm at my best when I feel like one piece of something bigger than me.",
      ],
      [
        'J’adore tout ce qui est nouveau, surtout ce qui fait un peu peur au début. Ce premier mur, c’est souvent là que ça devient intéressant.',
        'J’aime vraiment les revues de code et démêler les problèmes compliqués, et je donne le meilleur de moi-même quand je me sens comme une pièce de quelque chose qui me dépasse.',
      ],
    ),
  },
  {
    id: 'craft',
    number: '07',
    label: t('Craft & Contact', 'Création & contact'),
    line: t('Design, 3D, and how to say hi.', 'Design, 3D, et comment me dire bonjour.'),
    title: t('Craft in every *dimension*', 'Créer dans toutes les *dimensions*'),
    body: t(
      [
        "When I'm not training models, you'll usually find me doing graphic design or modeling something in 3D.",
        'It keeps my eye sharp, and it reminds me that how something feels matters just as much as how it works.',
      ],
      [
        'Quand je n’entraîne pas de modèles, vous me trouverez sûrement en train de faire du graphisme ou de modéliser quelque chose en 3D.',
        'Ça garde mon œil affûté, et ça me rappelle que ce qu’on ressent face à une création compte autant que la façon dont elle fonctionne.',
      ],
    ),
  },
]

export const MINDSET_POINTS = [
  {
    title: t('New over familiar', 'Le nouveau avant le connu'),
    text: t('If it looks hard, I get curious.', 'Si ça a l’air difficile, ça me rend curieux.'),
  },
  {
    title: t('Reviews make us better', 'Les revues nous font progresser'),
    text: t('I like reading code as much as writing it.', 'J’aime autant lire du code qu’en écrire.'),
  },
  {
    title: t('Bigger than me', 'Plus grand que moi'),
    text: t('Good work is almost always a team sport.', 'Le bon travail est presque toujours un sport d’équipe.'),
  },
]

/** The five agents of chapter 03, in order (one chip per 3D gate). */
export const STUDIO_AGENTS = t(
  ['Script', 'Visuals', 'Voice', 'Animate', 'Publish'],
  ['Script', 'Visuels', 'Voix', 'Animation', 'Publication'],
)

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
    title: '5 Sens Advertising',
    kind: t('Advertising campaign', 'Campagne publicitaire'),
    href: 'https://www.youtube.com/watch?v=np8BgdqZXBw',
    cta: t('Watch the ad', 'Voir la pub'),
    image: '/gallery/5sens.webp',
    alt: t(
      'The 5 Sens Advertising logo glowing above a rooftop pool at night',
      'Le logo de 5 Sens Advertising qui brille au-dessus d’une piscine sur un toit, la nuit',
    ),
    fit: 'cover',
  },
  {
    title: 'Killer Gel',
    kind: t('Advertising campaign', 'Campagne publicitaire'),
    href: 'https://www.youtube.com/watch?v=Rf80hWADEcg',
    cta: t('Watch the ad', 'Voir la pub'),
    image: '/gallery/killergel.webp',
    alt: t('KillerGel product packaging', 'L’emballage du produit KillerGel'),
    fit: 'contain',
  },
  {
    title: 'DoctorCom',
    kind: t('Website', 'Site web'),
    href: 'https://doctorcomtunis.com/',
    cta: t('Visit the site', 'Visiter le site'),
    image: '/gallery/doctorcom.webp',
    alt: t('DoctorCom logo, powered by 5 Sens Advertising', 'Logo DoctorCom, propulsé par 5 Sens Advertising'),
    fit: 'contain',
  },
]

/** A real line from the model's held-out test set (its output matched the reference exactly). */
export const DERJA_SAMPLE = {
  audioLabel: t('Derja audio', 'Audio en derja'),
  textLabel: t('text', 'texte'),
  transcript: 'كيفاش أحنا on va changer le process',
  gloss: t(
    'Derja and French in one sentence, transcribed word for word.',
    'Derja et français dans une même phrase, transcrits mot à mot.',
  ),
  note: t('Real test-set output', 'Vraie sortie du jeu de test'),
}

/** Contact block at the end of chapter 07. */
export const CONTACT = {
  label: t('Say hello', 'Dites bonjour'),
  title: t('Let’s make something *together*.', 'Créons quelque chose *ensemble*.'),
  text: t(
    'Got a project, a tricky problem, or just want to talk AI and design? I’d genuinely love to hear from you.',
    'Un projet, un problème épineux, ou juste envie de parler IA et design ?Parlons-en!',
  ),
  write: t('Write to me', 'Écrivez-moi'),
}

/** Interface words: nav, menu, labels, preloader, footer. */
export const UI = {
  skipIntro: t('Skip the intro', 'Passer l’intro'),
  home: t('Mehdi Handous, back to the beginning', 'Mehdi Handous, retour au début'),
  primaryNav: t('Primary', 'Principale'),
  chapters: t('Chapters', 'Chapitres'),
  close: t('Close', 'Fermer'),
  contact: 'Contact',
  /** The language switch shows the *other* language. */
  switchLabel: t('FR', 'EN'),
  switchName: t('Voir le site en français', 'View the site in English'),
  chapter: t('Chapter', 'Chapitre'),
  scroll: t('Scroll', 'Défiler'),
  technologies: t('Technologies', 'Technologies'),
  pipeline: t('Agent pipeline', 'Chaîne d’agents'),
  gallery: t('Selected craft work', 'Sélection de créations'),
  loading: t('Loading the story', 'Chargement de l’histoire'),
  tagline: t('a story in seven chapters', 'une histoire en sept chapitres'),
  logo: t('Mehdi Handous logo', 'Logo de Mehdi Handous'),
  backToTop: t('Back to the beginning ↑', 'Retour au début ↑'),
}

/** Placeholders render as inert links until you replace them. */
export const isPlaceholder = (href: string) => href.startsWith('[')
