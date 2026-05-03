export type Preset = {
  label: string;
  blurb: string;
  brand: string;
  category: string;
  competitors: string[];
};

export const PRESETS: Preset[] = [
  {
    label: "Athletic Greens",
    blurb: "DTC darling, premium-priced",
    brand: "Athletic Greens",
    category: "daily greens powder for energy and gut health",
    competitors: ["Bloom Greens", "Huel Daily Greens", "Ka'Chava"],
  },
  {
    label: "Liquid Death",
    blurb: "Edgy canned water brand",
    brand: "Liquid Death",
    category: "premium canned water",
    competitors: ["LaCroix", "Spindrift", "Open Water"],
  },
  {
    label: "Allbirds",
    blurb: "Sustainable sneakers",
    brand: "Allbirds",
    category: "sustainable everyday sneakers",
    competitors: ["Veja", "Cariuma", "Nike"],
  },
];
