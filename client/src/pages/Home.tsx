/*
 * Style reminder: Editorial Tech d'Impact — Swiss editorial structure, midnight navy,
 * warm ivory, Safran Rise accents, clear B2B copy, asymmetric rhythm, and no dead-end CTA.
 */
import { FormEvent, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ExternalLink,
  FileText,
  Globe2,
  Layers3,
  Mail,
  Menu,
  MessageCircle,
  MoveUpRight,
  Rocket,
  Send,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

const officialLogo = "/assets/official-logo.jpg";
const riseupMark = "/assets/riseup-mark.png";

type Lang = "fr" | "en";

type Product = {
  id: string;
  index: string;
  eyebrow: string;
  title: string;
  description: string;
  capabilities: string[];
  image?: string;
  imageAlt?: string;
  icon?: boolean;
};

type TeamMember = {
  code: string;
  variant: "team-card-dark" | "team-card-saffron" | "team-card-outline";
  role: string;
  name: string;
  description: string;
  photo?: string;
};

type LegalKey = "legal" | "privacy" | "terms" | null;

const content: Record<
  Lang,
  {
    nav: { vision: string; products: string; team: string; impact: string; contact: string; cta: string };
    hero: {
      eyebrow: string;
      titleBefore: string;
      titleEm: string;
      lead: string;
      ctaPrimary: string;
      ctaSecondary: string;
      signal1Label: string;
      signal1Value: string;
      signal2Label: string;
      signal2Value: string;
      footerLine: string[];
    };
    vision: {
      eyebrow: string;
      titleBefore: string;
      titleEm: string;
      statement: string;
      paragraph: string;
      cta: string;
      focus: { title: string; text: string }[];
    };
    position: {
      startLabel: string;
      startValue: string;
      startNote: string;
      eyebrow: string;
      eyebrowCode: string;
      titleBefore: string;
      titleEm: string;
      paragraph: string;
      list: { label: string; title: string; text: string }[];
    };
    products: {
      eyebrow: string;
      titleBefore: string;
      titleEm: string;
      paragraph: string;
      items: Product[];
      cta: string;
    };
    team: {
      eyebrow: string;
      titleBefore: string;
      titleEm: string;
      paragraph: string;
      members: TeamMember[];
    };
    impact: {
      eyebrow: string;
      titleBefore: string;
      titleEm: string;
      principles: { title: string; text: string }[];
    };
    contact: {
      eyebrow: string;
      titleBefore: string;
      titleEm: string;
      paragraph: string;
      nameLabel: string;
      namePlaceholder: string;
      emailLabel: string;
      emailPlaceholder: string;
      topicLabel: string;
      topicOptions: string[];
      messageLabel: string;
      messagePlaceholder: string;
      submit: string;
      formNote: string;
      errorMessage: string;
      successMessage: string;
    };
    footer: {
      tagline: string;
      backToTop: string;
      company: string;
      location: string;
      contactLabel: string;
      idLabel: string;
      navLabel: string;
      rights: string;
      legal: string;
      privacy: string;
      terms: string;
    };
    legal: Record<Exclude<LegalKey, null>, { title: string; kicker: string; paragraphs: string[] }>;
    legalClose: string;
    marquee: string;
  }
> = {
  fr: {
    nav: { vision: "Vision", products: "Activités", team: "Team", impact: "Impact", contact: "Contact", cta: "Nous contacter" },
    hero: {
      eyebrow: "Rise Up Tech Mobile",
      titleBefore: "Des produits digitaux pensés ici, ",
      titleEm: "prêts à changer d'échelle.",
      lead: "Nous concevons des produits digitaux et représentons des entreprises technologiques internationales au Sénégal et en Afrique de l'Ouest.",
      ctaPrimary: "Découvrir nos activités",
      ctaSecondary: "Notre façon de faire",
      signal1Label: "base opérationnelle",
      signal1Value: "Dakar",
      signal2Label: "terrain d'action",
      signal2Value: "Afrique de l'Ouest",
      footerLine: ["Innovation appliquée", "Contexte local", "Ambition régionale"],
    },
    vision: {
      eyebrow: "Notre vision",
      titleBefore: "L'innovation n'a de valeur que lorsqu'elle ",
      titleEm: "améliore le réel.",
      statement: "Nous ne sommes pas des développeurs : nous sommes des porteurs de projet. Nous concevons des produits qui s'insèrent dans la vie quotidienne, les habitudes et les ambitions de celles et ceux qui les utilisent, et nous mobilisons les bons partenaires et les bons contacts pour les réaliser.",
      paragraph: "Notre rôle est de comprendre le contexte, de choisir la bonne réponse technologique et de livrer une expérience fiable. Cette approche nous permet de parler avec des utilisateurs locaux comme avec des partenaires internationaux.",
      cta: "Voir nos principes",
      focus: [
        { title: "Construire utile", text: "Partir d'un problème concret avant de choisir une technologie." },
        { title: "Penser à l'échelle", text: "Concevoir une base solide pour le Sénégal et les marchés voisins." },
        { title: "Gagner la confiance", text: "Privilégier la clarté, la sécurité et la responsabilité produit." },
      ],
    },
    position: {
      startLabel: "Point de départ",
      startValue: "Sénégal",
      startNote: "Ouvert sur la région",
      eyebrow: "Notre terrain",
      eyebrowCode: "/ Dakar → région",
      titleBefore: "Une compréhension locale, une ambition ",
      titleEm: "sans frontière.",
      paragraph: "Basés au Sénégal, nous travaillons à la rencontre des usages, des infrastructures et des opportunités de l'Afrique de l'Ouest. Notre ambition est régionale, notre méthode commence par le terrain.",
      list: [
        { label: "01", title: "Contexte", text: "Des produits ancrés dans les réalités d'usage." },
        { label: "02", title: "Technologie", text: "Des choix modernes, utiles et maintenables." },
        { label: "03", title: "Partenariat", text: "Un dialogue clair avec les équipes qui avancent avec nous." },
      ],
    },
    products: {
      eyebrow: "Ce que nous portons",
      titleBefore: "Des idées que nous pilotons de bout en ",
      titleEm: "bout.",
      paragraph: "Nous identifions les opportunités, concevons le produit et pilotons sa réalisation avec des partenaires techniques de confiance — au Sénégal comme pour nos partenaires internationaux.",
      cta: "Parler de ce sujet",
      items: [
        {
          id: "mobile",
          index: "01",
          eyebrow: "Produit mobile",
          title: "Applications mobiles",
          description: "Nous concevons le projet — usage, parcours, marché visé — et en pilotons la réalisation auprès de partenaires de développement, pour des expériences pensées pour le contexte africain.",
          image: "/assets/product-mobile.jpg",
          imageAlt: "Illustration d'une application mobile Rise Up Tech",
          capabilities: ["Cadrage du besoin", "Pilotage de la réalisation", "Partenaires de développement"],
        },
        {
          id: "representation",
          index: "02",
          eyebrow: "Développement international",
          title: "Représentation & partenariats internationaux",
          description: "Nous représentons des entreprises technologiques étrangères qui disposent déjà de leurs propres produits — SaaS, AgriTech, FinTech, IA — pour leur mise en marché au Sénégal et en Afrique de l'Ouest.",
          icon: true,
          capabilities: ["Mise en marché locale", "Développement commercial", "Gestion de partenariat"],
        },
        {
          id: "platform",
          index: "03",
          eyebrow: "Infrastructure produit",
          title: "Plateformes digitales",
          description: "Nous définissons les besoins des plateformes web et SaaS qui structurent les opérations de nos clients, et coordonnons leur développement avec nos partenaires techniques.",
          image: "/assets/product-platform.jpg",
          imageAlt: "Illustration d'une plateforme digitale et d'un tableau de bord",
          capabilities: ["Cahier des charges clair", "Coordination technique", "Suivi qualité"],
        },
        {
          id: "finance",
          index: "04",
          eyebrow: "Confiance & conformité",
          title: "Technologies financières",
          description: "Nous concevons des produits fintech pensés autour de la confiance et de la conformité locale, et en supervisons la réalisation avec des partenaires techniques spécialisés.",
          image: "/assets/product-fintech.jpg",
          imageAlt: "Illustration abstraite d'un produit de technologie financière",
          capabilities: ["Conformité locale", "Supervision technique", "KYC / paiements"],
        },
      ],
    },
    team: {
      eyebrow: "Direction",
      titleBefore: "Une équipe resserrée, ",
      titleEm: "des responsabilités claires.",
      paragraph: "La direction de Rise Up Tech Mobile réunit les fonctions qui protègent la vision produit, la solidité financière et la capacité d'exécution.",
      members: [
        {
          code: "A / 01",
          variant: "team-card-dark",
          role: "CEO · Direction générale",
          name: "Arouna Sow",
          description: "Vision, stratégie et développement des partenariats qui permettent aux produits de prendre leur place.",
          photo: "/team/ceo-arouna-sow.png",
        },
        {
          code: "A / 02",
          variant: "team-card-saffron",
          role: "CFO · Finance & conformité",
          name: "Mamour Ndiaye",
          description: "Pilotage financier, structuration et attention portée à la conformité pour grandir avec méthode.",
          photo: "/team/cfo-mamour-ndiaye.jpeg",
        },
        {
          code: "A / 03",
          variant: "team-card-outline",
          role: "CTO · Produit & technologie",
          name: "Absa So",
          description: "Cadrage technique, exigence qualité et supervision des projets digitaux auprès de nos partenaires de développement.",
        },
        {
          code: "A / 04",
          variant: "team-card-dark",
          role: "CAO · Administration & opérations",
          name: "Mamadou Gaye",
          description: "Organisation administrative et structuration des opérations nécessaires à une croissance fiable.",
          photo: "/team/cao-mouhamadou-gaye.jpg",
        },
      ],
    },
    impact: {
      eyebrow: "Ce qui nous définit",
      titleBefore: "La confiance se construit dans ",
      titleEm: "chaque détail.",
      principles: [
        { title: "Innovation utile", text: "Explorer sans perdre de vue le problème que le produit doit résoudre." },
        { title: "Exigence", text: "Créer des expériences nettes, fiables et respectueuses du temps de l'utilisateur." },
        { title: "Durabilité", text: "Construire avec une vision long terme, pour le produit comme pour la relation." },
      ],
    },
    contact: {
      eyebrow: "Parlons produit",
      titleBefore: "Échangeons sur le prochain produit à ",
      titleEm: "construire.",
      paragraph: "Vous représentez une entreprise, un fonds, une institution ou une équipe produit ? Écrivez-nous directement. Nous vous répondrons depuis Dakar.",
      nameLabel: "Votre nom",
      namePlaceholder: "Nom complet",
      emailLabel: "Votre email",
      emailPlaceholder: "nom@entreprise.com",
      topicLabel: "Sujet",
      topicOptions: [
        "Partenariat ou collaboration",
        "Représentation internationale",
        "Échange sur applications mobiles",
        "Échange sur plateformes digitales",
        "Échange sur technologies financières",
        "Autre demande professionnelle",
      ],
      messageLabel: "Votre message",
      messagePlaceholder: "Parlez-nous de votre contexte et de ce que vous souhaitez construire.",
      submit: "Ouvrir mon email",
      formNote: "Le bouton prépare un email à l'adresse officielle de Rise Up Tech Mobile.",
      errorMessage: "Veuillez renseigner votre nom, votre email et votre message.",
      successMessage: "Votre messagerie va s'ouvrir pour finaliser l'envoi.",
    },
    footer: {
      tagline: "Des produits digitaux ancrés au Sénégal, conçus pour l'Afrique de l'Ouest.",
      backToTop: "Retour en haut",
      company: "Entreprise",
      location: "Dakar, Sénégal",
      contactLabel: "Coordonnées",
      idLabel: "Identifiants",
      navLabel: "Navigation",
      rights: "© 2026 Rise Up Tech Mobile. Tous droits réservés.",
      legal: "Mentions légales",
      privacy: "Confidentialité",
      terms: "Conditions",
    },
    legal: {
      legal: {
        title: "Mentions légales",
        kicker: "Informations société",
        paragraphs: [
          "Rise Up Tech Mobile est une entreprise basée à Dakar, au Sénégal, spécialisée dans la conception de produits digitaux et la représentation de partenaires technologiques internationaux.",
          "NINEA : 012838407. RCCM : SN.DKR.2026.B.6695.",
          "Contact officiel : contact.riseuptech@gmail.com · WhatsApp : +221 77 493 16 39.",
        ],
      },
      privacy: {
        title: "Politique de confidentialité",
        kicker: "Données & contact",
        paragraphs: [
          "Les informations saisies dans le formulaire de contact sont destinées uniquement à répondre à votre demande professionnelle.",
          "Le site ne demande pas de donnée sensible. Avant toute transmission, vérifiez le contenu de votre message et n'envoyez que les informations nécessaires.",
          "Pour toute question relative à vos données, écrivez à contact.riseuptech@gmail.com.",
        ],
      },
      terms: {
        title: "Conditions d'utilisation",
        kicker: "Cadre d'utilisation",
        paragraphs: [
          "Les contenus présentés sur ce site décrivent le positionnement et les capacités de Rise Up Tech Mobile à titre informatif.",
          "Toute collaboration, livraison de produit ou prestation fait l'objet d'un accord séparé précisant le périmètre, les responsabilités et les conditions applicables.",
          "Les visuels et contenus ne peuvent être reproduits sans accord préalable de Rise Up Tech Mobile.",
        ],
      },
    },
    legalClose: "Fermer",
    marquee: "Vous voulez voir votre société grandir au Sénégal ? Contactez-nous",
  },
  en: {
    nav: { vision: "Vision", products: "What we do", team: "Team", impact: "Impact", contact: "Contact", cta: "Contact us" },
    hero: {
      eyebrow: "Rise Up Tech Mobile",
      titleBefore: "Digital products built here, ",
      titleEm: "ready to scale.",
      lead: "We design digital products and represent international technology companies across Senegal and West Africa.",
      ctaPrimary: "Discover what we do",
      ctaSecondary: "Our way of working",
      signal1Label: "operational base",
      signal1Value: "Dakar",
      signal2Label: "field of action",
      signal2Value: "West Africa",
      footerLine: ["Applied innovation", "Local context", "Regional ambition"],
    },
    vision: {
      eyebrow: "Our vision",
      titleBefore: "Innovation only matters when it ",
      titleEm: "improves real life.",
      statement: "We are not developers: we are project owners. We design products that fit into the daily life, habits and ambitions of the people who use them, and we bring in the right partners and the right contacts to deliver them.",
      paragraph: "Our role is to understand the context, choose the right technology and deliver a reliable experience — a method that lets us speak with local users and international partners alike.",
      cta: "See our principles",
      focus: [
        { title: "Build what matters", text: "Start from a real problem before choosing a technology." },
        { title: "Design for scale", text: "Build a solid foundation for Senegal and neighbouring markets." },
        { title: "Earn trust", text: "Prioritise clarity, security and product accountability." },
      ],
    },
    position: {
      startLabel: "Starting point",
      startValue: "Senegal",
      startNote: "Open to the region",
      eyebrow: "Our ground",
      eyebrowCode: "/ Dakar → region",
      titleBefore: "Local understanding, ",
      titleEm: "borderless ambition.",
      paragraph: "Based in Senegal, we work at the intersection of usage, infrastructure and opportunity across West Africa. Our ambition is regional; our method starts on the ground.",
      list: [
        { label: "01", title: "Context", text: "Products grounded in real usage." },
        { label: "02", title: "Technology", text: "Modern, useful and maintainable choices." },
        { label: "03", title: "Partnership", text: "A clear dialogue with the teams that move forward with us." },
      ],
    },
    products: {
      eyebrow: "What we drive",
      titleBefore: "Ideas we own from start to ",
      titleEm: "finish.",
      paragraph: "We identify the opportunity, design the product and manage its delivery with trusted technical partners — for Senegal and for our international partners alike.",
      cta: "Talk about this",
      items: [
        {
          id: "mobile",
          index: "01",
          eyebrow: "Mobile product",
          title: "Mobile applications",
          description: "We design the project — usage, journey, target market — and manage its delivery with development partners, for experiences built for the African context.",
          image: "/assets/product-mobile.jpg",
          imageAlt: "Illustration of a Rise Up Tech mobile application",
          capabilities: ["Needs definition", "Delivery management", "Development partners"],
        },
        {
          id: "representation",
          index: "02",
          eyebrow: "International development",
          title: "International representation & partnerships",
          description: "We represent foreign technology companies that already have their own products — SaaS, AgriTech, FinTech, AI — for their go-to-market in Senegal and West Africa.",
          icon: true,
          capabilities: ["Local go-to-market", "Business development", "Partnership management"],
        },
        {
          id: "platform",
          index: "03",
          eyebrow: "Product infrastructure",
          title: "Digital platforms",
          description: "We define the requirements for the web and SaaS platforms that structure our clients' operations, and coordinate their development with our technical partners.",
          image: "/assets/product-platform.jpg",
          imageAlt: "Illustration of a digital platform and dashboard",
          capabilities: ["Clear specifications", "Technical coordination", "Quality oversight"],
        },
        {
          id: "finance",
          index: "04",
          eyebrow: "Trust & compliance",
          title: "Financial technologies",
          description: "We design fintech products built around trust and local compliance, and oversee their delivery with specialised technical partners.",
          image: "/assets/product-fintech.jpg",
          imageAlt: "Abstract illustration of a financial technology product",
          capabilities: ["Local compliance", "Technical oversight", "KYC / payments"],
        },
      ],
    },
    team: {
      eyebrow: "Leadership",
      titleBefore: "A small team, ",
      titleEm: "clear responsibilities.",
      paragraph: "Rise Up Tech Mobile's leadership brings together the functions that protect the product vision, financial soundness and execution capacity.",
      members: [
        {
          code: "A / 01",
          variant: "team-card-dark",
          role: "CEO · General management",
          name: "Arouna Sow",
          description: "Vision, strategy and partnership development that give products the room to grow.",
          photo: "/team/ceo-arouna-sow.png",
        },
        {
          code: "A / 02",
          variant: "team-card-saffron",
          role: "CFO · Finance & compliance",
          name: "Mamour Ndiaye",
          description: "Financial management, structuring and compliance discipline to grow with method.",
          photo: "/team/cfo-mamour-ndiaye.jpeg",
        },
        {
          code: "A / 03",
          variant: "team-card-outline",
          role: "CTO · Product & technology",
          name: "Absa So",
          description: "Technical scoping, quality standards and oversight of digital projects with our development partners.",
        },
        {
          code: "A / 04",
          variant: "team-card-dark",
          role: "CAO · Administration & operations",
          name: "Mamadou Gaye",
          description: "Administrative organisation and operational structuring to support reliable growth.",
          photo: "/team/cao-mouhamadou-gaye.jpg",
        },
      ],
    },
    impact: {
      eyebrow: "What defines us",
      titleBefore: "Trust is built in ",
      titleEm: "every detail.",
      principles: [
        { title: "Useful innovation", text: "Exploring without losing sight of the problem the product must solve." },
        { title: "Rigour", text: "Creating clean, reliable experiences that respect the user's time." },
        { title: "Durability", text: "Building with a long-term view, for the product and for the relationship." },
      ],
    },
    contact: {
      eyebrow: "Let's talk product",
      titleBefore: "Let's discuss the next product to ",
      titleEm: "build.",
      paragraph: "Do you represent a company, a fund, an institution or a product team? Write to us directly — we'll reply from Dakar.",
      nameLabel: "Your name",
      namePlaceholder: "Full name",
      emailLabel: "Your email",
      emailPlaceholder: "name@company.com",
      topicLabel: "Subject",
      topicOptions: [
        "Partnership or collaboration",
        "International representation",
        "About mobile applications",
        "About digital platforms",
        "About financial technologies",
        "Other professional request",
      ],
      messageLabel: "Your message",
      messagePlaceholder: "Tell us about your context and what you'd like to build.",
      submit: "Open my email",
      formNote: "The button prepares an email to Rise Up Tech Mobile's official address.",
      errorMessage: "Please fill in your name, email and message.",
      successMessage: "Your email client will open to finish sending.",
    },
    footer: {
      tagline: "Digital products rooted in Senegal, built for West Africa.",
      backToTop: "Back to top",
      company: "Company",
      location: "Dakar, Senegal",
      contactLabel: "Contact",
      idLabel: "Registration",
      navLabel: "Navigation",
      rights: "© 2026 Rise Up Tech Mobile. All rights reserved.",
      legal: "Legal notice",
      privacy: "Privacy",
      terms: "Terms",
    },
    legal: {
      legal: {
        title: "Legal notice",
        kicker: "Company information",
        paragraphs: [
          "Rise Up Tech Mobile is a company based in Dakar, Senegal, specialised in building digital products and representing international technology partners.",
          "NINEA: 012838407. RCCM: SN.DKR.2026.B.6695.",
          "Official contact: contact.riseuptech@gmail.com · WhatsApp: +221 77 493 16 39.",
        ],
      },
      privacy: {
        title: "Privacy policy",
        kicker: "Data & contact",
        paragraphs: [
          "Information entered in the contact form is used solely to respond to your professional request.",
          "The site does not request sensitive data. Before sending, please review your message and only include what is necessary.",
          "For any question about your data, write to contact.riseuptech@gmail.com.",
        ],
      },
      terms: {
        title: "Terms of use",
        kicker: "Terms of use",
        paragraphs: [
          "The content on this site describes Rise Up Tech Mobile's positioning and capabilities for informational purposes.",
          "Any collaboration, product delivery or service is governed by a separate agreement specifying scope, responsibilities and applicable terms.",
          "Visuals and content may not be reproduced without prior agreement from Rise Up Tech Mobile.",
        ],
      },
    },
    legalClose: "Close",
    marquee: "Want to see your company grow in Senegal? Contact us",
  },
};

const focusIcons = [Rocket, Layers3, ShieldCheck];

export default function Home() {
  const [lang, setLang] = useState<Lang>("fr");
  const [menuOpen, setMenuOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState<LegalKey>(null);
  const t = content[lang];
  const [topic, setTopic] = useState(t.contact.topicOptions[0]);
  const [formStatus, setFormStatus] = useState("");

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleProductInterest = (productId: string) => {
    const topicByProduct: Record<string, Record<Lang, string>> = {
      mobile: { fr: "Échange sur applications mobiles", en: "About mobile applications" },
      representation: { fr: "Représentation internationale", en: "International representation" },
      platform: { fr: "Échange sur plateformes digitales", en: "About digital platforms" },
      finance: { fr: "Échange sur technologies financières", en: "About financial technologies" },
    };
    setTopic(topicByProduct[productId]?.[lang] ?? content[lang].contact.topicOptions[0]);
    scrollTo("contact");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const message = String(form.get("message") ?? "").trim();
    const selectedTopic = String(form.get("topic") ?? topic);

    if (!name || !email || !message) {
      setFormStatus(t.contact.errorMessage);
      return;
    }

    const subject = encodeURIComponent(`${selectedTopic} — Rise Up Tech Mobile`);
    const body = encodeURIComponent(`${lang === "fr" ? "Nom" : "Name"} : ${name}\nEmail : ${email}\n${t.contact.topicLabel} : ${selectedTopic}\n\n${t.contact.messageLabel} :\n${message}`);
    setFormStatus(t.contact.successMessage);
    window.location.href = `mailto:contact.riseuptech@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="header-inner">
          <a className="brand-lockup" href="#top" aria-label="Rise Up Tech Mobile — accueil" onClick={() => setMenuOpen(false)}>
            <span className="brand-mark-frame">
              <img src={riseupMark} alt="" aria-hidden="true" />
            </span>
            <span className="brand-name">
              <strong>Rise up</strong>
              <span>tech mobile</span>
            </span>
          </a>

          <nav className={`main-nav ${menuOpen ? "is-open" : ""}`} aria-label="Navigation principale">
            <a href="#vision" onClick={() => setMenuOpen(false)}><span>01</span>{t.nav.vision}</a>
            <a href="#products" onClick={() => setMenuOpen(false)}><span>02</span>{t.nav.products}</a>
            <a href="#team" onClick={() => setMenuOpen(false)}><span>03</span>{t.nav.team}</a>
            <a href="#impact" onClick={() => setMenuOpen(false)}><span>04</span>{t.nav.impact}</a>
            <a href="#contact" onClick={() => setMenuOpen(false)}><span>05</span>{t.nav.contact}</a>
          </nav>

          <div className="lang-toggle" role="group" aria-label="Language / Langue">
            <button type="button" className={lang === "fr" ? "is-active" : ""} onClick={() => setLang("fr")}>FR</button>
            <button type="button" className={lang === "en" ? "is-active" : ""} onClick={() => setLang("en")}>EN</button>
          </div>

          <button className="header-cta" type="button" onClick={() => scrollTo("contact")}>
            {t.nav.cta} <ArrowUpRight size={15} strokeWidth={2.2} />
          </button>
          <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"} onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      <main id="top">
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-texture" aria-hidden="true" />
          <div className="hero-inner">
            <div className="hero-copy">
              <p className="eyebrow eyebrow-light"><span className="eyebrow-line" /> {t.hero.eyebrow} <span className="eyebrow-code">/ 2026</span></p>
              <h1 id="hero-title">{t.hero.titleBefore}<em>{t.hero.titleEm}</em></h1>
              <p className="hero-lead">{t.hero.lead}</p>
              <div className="hero-actions">
                <button className="button button-saffron" type="button" onClick={() => scrollTo("products")}>{t.hero.ctaPrimary} <ArrowDownRight size={17} /></button>
                <button className="text-link text-link-light" type="button" onClick={() => scrollTo("vision")}>{t.hero.ctaSecondary} <MoveUpRight size={16} /></button>
              </div>
              <div className="hero-signals" aria-label="Informations clés">
                <span><strong>{t.hero.signal1Value}</strong> {t.hero.signal1Label}</span>
                <span><strong>{t.hero.signal2Value}</strong> {t.hero.signal2Label}</span>
              </div>
            </div>
            <div className="hero-visual" aria-label="Identité Rise Up Tech Mobile">
              <div className="hero-visual-grid" aria-hidden="true" />
              <div className="hero-logo-card">
                <span className="logo-card-caption">{lang === "fr" ? "Identité officielle" : "Official identity"}</span>
                <div className="official-logo-frame">
                  <img src={officialLogo} alt="Logo officiel Rise up tech mobile" />
                </div>
                <div className="logo-card-foot"><span>RU / 01</span><span>Digital products</span></div>
              </div>
              <div className="hero-index">R<span>U</span><b>01</b></div>
              <div className="trajectory-line" aria-hidden="true" />
            </div>
          </div>
          <div className="hero-footer-line">{t.hero.footerLine.map((label) => <span key={label}>{label}</span>)}</div>
        </section>

        <section className="intro-section content-section" id="vision" aria-labelledby="vision-title">
          <div className="section-rail"><span>01</span><span>{t.nav.vision}</span></div>
          <div className="intro-layout">
            <div className="section-heading-block">
              <p className="eyebrow"><span className="eyebrow-line" /> {t.vision.eyebrow}</p>
              <h2 id="vision-title">{t.vision.titleBefore}<em>{t.vision.titleEm}</em></h2>
            </div>
            <div className="intro-copy">
              <p className="intro-statement">{t.vision.statement}</p>
              <p>{t.vision.paragraph}</p>
              <button className="text-link text-link-dark" type="button" onClick={() => scrollTo("impact")}>{t.vision.cta} <ArrowDownRight size={16} /></button>
            </div>
          </div>
          <div className="focus-grid">
            {t.vision.focus.map(({ title, text }, i) => {
              const Icon = focusIcons[i];
              return (
                <article className="focus-item" key={title}>
                  <Icon size={22} strokeWidth={1.8} />
                  <div><h3>{title}</h3><p>{text}</p></div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="position-section content-section" id="expertise" aria-labelledby="position-title">
          <div className="position-visual">
            <div className="position-note"><span>{t.position.startLabel}</span><strong>{t.position.startValue}</strong><small>{t.position.startNote}</small></div>
          </div>
          <div className="position-copy">
            <p className="eyebrow eyebrow-light"><span className="eyebrow-line" /> {t.position.eyebrow} <span className="eyebrow-code">{t.position.eyebrowCode}</span></p>
            <h2 id="position-title">{t.position.titleBefore}<em>{t.position.titleEm}</em></h2>
            <p>{t.position.paragraph}</p>
            <div className="position-list">
              {t.position.list.map(({ label, title, text }) => (
                <div key={label}><span>{label}</span><strong>{title}</strong><p>{text}</p></div>
              ))}
            </div>
          </div>
        </section>

        <section className="products-section content-section" id="products" aria-labelledby="products-title">
          <div className="section-rail"><span>02</span><span>{t.nav.products}</span></div>
          <div className="products-intro">
            <div>
              <p className="eyebrow"><span className="eyebrow-line" /> {t.products.eyebrow}</p>
              <h2 id="products-title">{t.products.titleBefore}<em>{t.products.titleEm}</em></h2>
            </div>
            <p>{t.products.paragraph}</p>
          </div>
          <div className="products-list">
            {t.products.items.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="product-card-meta"><span>{product.index} / {product.eyebrow}</span><ArrowUpRight size={17} /></div>
                <div className="product-card-body">
                  <div className="product-copy">
                    <h3>{product.title}</h3>
                    <p>{product.description}</p>
                    <ul>{product.capabilities.map((capability) => <li key={capability}><Check size={14} />{capability}</li>)}</ul>
                    <button className="text-link text-link-dark" type="button" onClick={() => handleProductInterest(product.id)}>{t.products.cta} <MoveUpRight size={16} /></button>
                  </div>
                  {product.icon ? (
                    <div className="product-icon-wrap"><Globe2 size={64} strokeWidth={1.3} /></div>
                  ) : (
                    <div className="product-image-wrap"><img src={product.image} alt={product.imageAlt} loading="lazy" /></div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="marquee-band" role="presentation">
          <button type="button" className="marquee-track" onClick={() => scrollTo("contact")} aria-label={t.marquee}>
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i}>{t.marquee} <span aria-hidden="true">✦</span></span>
            ))}
          </button>
        </div>

        <section className="team-section content-section" id="team" aria-labelledby="team-title">
          <div className="team-intro">
            <div><p className="eyebrow"><span className="eyebrow-line" /> {t.team.eyebrow}</p><h2 id="team-title">{t.team.titleBefore}<em>{t.team.titleEm}</em></h2></div>
            <p>{t.team.paragraph}</p>
          </div>
          <div className="team-grid">
            {t.team.members.map((member) => (
              <article className={`team-card ${member.variant}`} key={member.code}>
                <span className="team-number">{member.code}</span>
                <div className="team-avatar">
                  {member.photo ? <img className="team-avatar-photo" src={member.photo} alt={member.name} /> : <Users size={30} />}
                </div>
                <p className="team-role">{member.role}</p>
                <h3>{member.name}</h3>
                <p className="team-description">{member.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="impact-section content-section" id="impact" aria-labelledby="impact-title">
          <div className="impact-heading"><p className="eyebrow eyebrow-light"><span className="eyebrow-line" /> {t.impact.eyebrow}</p><h2 id="impact-title">{t.impact.titleBefore}<em>{t.impact.titleEm}</em></h2></div>
          <div className="impact-principles">
            {t.impact.principles.map(({ title, text }, i) => (
              <div key={title}><span>{String(i + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{text}</p></div>
            ))}
          </div>
        </section>

        <section className="contact-section content-section" id="contact" aria-labelledby="contact-title">
          <div className="contact-heading">
            <p className="eyebrow"><span className="eyebrow-line" /> {t.contact.eyebrow}</p>
            <h2 id="contact-title">{t.contact.titleBefore}<em>{t.contact.titleEm}</em></h2>
            <p>{t.contact.paragraph}</p>
            <a className="contact-direct" href="mailto:contact.riseuptech@gmail.com"><Mail size={18} /> contact.riseuptech@gmail.com <ExternalLink size={14} /></a>
            <a className="contact-direct" href="https://wa.me/221774931639?text=Bonjour%20Rise%20Up%20Tech%20Mobile%2C%20je%20souhaite%20%C3%A9changer%20sur%20vos%20produits." target="_blank" rel="noreferrer"><MessageCircle size={18} /> +221 77 493 16 39 <ExternalLink size={14} /></a>
          </div>
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label>{t.contact.nameLabel}<input name="name" type="text" placeholder={t.contact.namePlaceholder} required /></label>
              <label>{t.contact.emailLabel}<input name="email" type="email" placeholder={t.contact.emailPlaceholder} required /></label>
            </div>
            <label>{t.contact.topicLabel}
              <select name="topic" value={topic} onChange={(event) => setTopic(event.target.value)}>
                {t.contact.topicOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label>{t.contact.messageLabel}<textarea name="message" placeholder={t.contact.messagePlaceholder} rows={5} required /></label>
            <div className="form-actions">
              <button className="button button-navy" type="submit">{t.contact.submit} <Send size={16} /></button>
              <span className="form-note">{t.contact.formNote}</span>
            </div>
            {formStatus && <p className="form-status" role="status">{formStatus}</p>}
          </form>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-top">
          <a className="brand-lockup footer-brand" href="#top"><span className="brand-mark-frame"><img src={riseupMark} alt="" aria-hidden="true" /></span><span className="brand-name"><strong>Rise up</strong><span>tech mobile</span></span></a>
          <p>{t.footer.tagline}</p>
          <button className="footer-back" type="button" onClick={() => scrollTo("top")}>{t.footer.backToTop} <ArrowUpRight size={16} /></button>
        </div>
        <div className="footer-grid">
          <div><span className="footer-label">{t.footer.company}</span><p>Rise Up Tech Mobile</p><p>{t.footer.location}</p></div>
          <div><span className="footer-label">{t.footer.contactLabel}</span><a href="mailto:contact.riseuptech@gmail.com">contact.riseuptech@gmail.com</a><a href="https://wa.me/221774931639" target="_blank" rel="noreferrer">+221 77 493 16 39</a></div>
          <div><span className="footer-label">{t.footer.idLabel}</span><p>NINEA · 012838407</p><p>RCCM · SN.DKR.2026.B.6695</p></div>
          <div><span className="footer-label">{t.footer.navLabel}</span><a href="#vision">{t.nav.vision}</a><a href="#products">{t.nav.products}</a><a href="#team">{t.nav.team}</a><a href="#contact">{t.nav.contact}</a></div>
        </div>
        <div className="footer-bottom">
          <span>{t.footer.rights}</span>
          <div>
            <button type="button" onClick={() => setLegalOpen("legal")}>{t.footer.legal}</button>
            <button type="button" onClick={() => setLegalOpen("privacy")}>{t.footer.privacy}</button>
            <button type="button" onClick={() => setLegalOpen("terms")}>{t.footer.terms}</button>
          </div>
        </div>
      </footer>

      {legalOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => setLegalOpen(null)}>
          <div className="legal-modal" role="dialog" aria-modal="true" aria-labelledby="legal-title" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" aria-label="Fermer" onClick={() => setLegalOpen(null)}><X size={20} /></button>
            <div className="modal-icon"><FileText size={22} /></div>
            <p className="eyebrow"><span className="eyebrow-line" /> {t.legal[legalOpen].kicker}</p>
            <h2 id="legal-title">{t.legal[legalOpen].title}</h2>
            {t.legal[legalOpen].paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            <button className="button button-navy" type="button" onClick={() => setLegalOpen(null)}>{t.legalClose} <Check size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
