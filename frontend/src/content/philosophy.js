import philosophyData from './data/philosophy.json';

export const PHILOSOPHY_QUOTES = philosophyData.quotes;
export const SERVICES = philosophyData.services;

export const NAV_LINKS = [
  { label: "DIGITAL SERVICES", href: "/digital-services", sectionId: "digital-services" },
  { label: "WORKSHOPS", href: "/workshops", sectionId: "workshops" },
  { label: "ABOUT", href: "#stage", sectionId: "stage" },
  { label: "CONTACT", href: "#contact", sectionId: "contact" }
];

export const NAV_CTA = {
  label: "GET IN TOUCH",
  href: "#contact"
};
