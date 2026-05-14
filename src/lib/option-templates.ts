// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Option Templates - Pre-configured option sets for common product types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface OptionTemplate {
  id: string;
  category: "clothing" | "shoes" | "colors" | "materials" | "custom";
  name: string;
  description: string;
  icon: string;
  options: {
    title: string;
    values: string[];
    recommended?: boolean;
  }[];
  helpText: string;
  exampleProducts: string[];
}

export const OPTION_TEMPLATES: OptionTemplate[] = [
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Clothing Sizes
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: "clothing-sizes-combined",
    category: "clothing",
    name: "Clothing Sizes (Combined EU + Letter)",
    description: "Recommended: Shows both EU numbers and letter sizes in one option",
    icon: "👕",
    options: [
      {
        title: "Size",
        values: [
          "XS / EU 52",
          "S / EU 54",
          "M / EU 56",
          "L / EU 58",
          "XL / EU 60",
          "XXL / EU 62",
        ],
        recommended: true,
      },
    ],
    helpText:
      "Combined sizing prevents creating too many variants. Users can filter by either EU number or letter size.",
    exampleProducts: ["T-Shirts", "Jackets", "Hoodies"],
  },
  {
    id: "clothing-sizes-letter-only",
    category: "clothing",
    name: "Clothing Sizes (Letter Only)",
    description: "Simple letter sizes without EU numbers",
    icon: "👕",
    options: [
      {
        title: "Size",
        values: ["XS", "S", "M", "L", "XL", "XXL"],
      },
    ],
    helpText:
      "Use this for international products or when EU sizing isn't relevant.",
    exampleProducts: ["Athletic wear", "Loungewear"],
  },
  {
    id: "clothing-sizes-eu-only",
    category: "clothing",
    name: "Clothing Sizes (EU Only)",
    description: "EU numeric sizes only",
    icon: "👕",
    options: [
      {
        title: "Size",
        values: ["52", "54", "56", "58", "60", "62"],
      },
    ],
    helpText: "Traditional European sizing. Common in formal wear.",
    exampleProducts: ["Suits", "Dress shirts"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Shoe Sizes
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: "shoe-sizes-eu-us-combined",
    category: "shoes",
    name: "Shoe Sizes (EU + US Combined)",
    description: "Recommended: Shows both EU and US sizes",
    icon: "👟",
    options: [
      {
        title: "Size",
        values: [
          "US 6 / EU 39",
          "US 7 / EU 40",
          "US 8 / EU 41",
          "US 9 / EU 42",
          "US 10 / EU 43",
          "US 11 / EU 44",
          "US 12 / EU 45",
        ],
        recommended: true,
      },
    ],
    helpText:
      "Combined sizing helps international customers. Prevents duplicate variants.",
    exampleProducts: ["Sneakers", "Boots", "Sandals"],
  },
  {
    id: "shoe-sizes-eu-only",
    category: "shoes",
    name: "Shoe Sizes (EU Only)",
    description: "European sizing only",
    icon: "👟",
    options: [
      {
        title: "Size",
        values: ["39", "40", "41", "42", "43", "44", "45"],
      },
    ],
    helpText: "Use for EU-focused markets.",
    exampleProducts: ["Dress shoes", "Casual shoes"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Colors
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: "colors-basic",
    category: "colors",
    name: "Colors (Basic Palette)",
    description: "Common colors for clothing and accessories",
    icon: "🎨",
    options: [
      {
        title: "Color",
        values: [
          "Black",
          "White",
          "Gray",
          "Navy",
          "Red",
          "Blue",
          "Green",
          "Beige",
        ],
      },
    ],
    helpText: "Basic color options suitable for most products.",
    exampleProducts: ["T-Shirts", "Bags", "Accessories"],
  },
  {
    id: "colors-extended",
    category: "colors",
    name: "Colors (Extended Palette)",
    description: "Comprehensive color range",
    icon: "🎨",
    options: [
      {
        title: "Color",
        values: [
          "Black",
          "White",
          "Gray",
          "Navy",
          "Red",
          "Blue",
          "Green",
          "Yellow",
          "Orange",
          "Purple",
          "Pink",
          "Brown",
          "Beige",
          "Olive",
          "Burgundy",
          "Teal",
        ],
      },
    ],
    helpText:
      "Warning: More colors = more variants. Only use if you stock all these.",
    exampleProducts: ["Fashion items", "Customizable products"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Materials
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: "materials-fabric",
    category: "materials",
    name: "Materials (Fabric)",
    description: "Common fabric types",
    icon: "🧵",
    options: [
      {
        title: "Material",
        values: ["Cotton", "Polyester", "Wool", "Linen", "Silk"],
      },
    ],
    helpText: "Use for products available in different materials.",
    exampleProducts: ["Clothing", "Home textiles"],
  },
  {
    id: "materials-jewelry",
    category: "materials",
    name: "Materials (Jewelry)",
    description: "Common jewelry materials",
    icon: "💍",
    options: [
      {
        title: "Material",
        values: [
          "Gold",
          "Silver",
          "Platinum",
          "Rose Gold",
          "Stainless Steel",
        ],
      },
    ],
    helpText: "For jewelry products with material variations.",
    exampleProducts: ["Rings", "Necklaces", "Bracelets"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Common Combinations
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: "clothing-size-color",
    category: "clothing",
    name: "Clothing: Size + Color",
    description: "Most common clothing variant setup",
    icon: "👕",
    options: [
      {
        title: "Size",
        values: ["S / EU 54", "M / EU 56", "L / EU 58", "XL / EU 60"],
        recommended: true,
      },
      {
        title: "Color",
        values: ["Black", "White", "Navy", "Gray"],
      },
    ],
    helpText:
      "Creates 16 variants (4 sizes × 4 colors). Edit colors/sizes as needed.",
    exampleProducts: ["T-Shirts", "Hoodies", "Jeans"],
  },
  {
    id: "shoes-size-color",
    category: "shoes",
    name: "Shoes: Size + Color",
    description: "Common shoe variant setup",
    icon: "👟",
    options: [
      {
        title: "Size",
        values: [
          "US 7 / EU 40",
          "US 8 / EU 41",
          "US 9 / EU 42",
          "US 10 / EU 43",
        ],
        recommended: true,
      },
      {
        title: "Color",
        values: ["Black", "White", "Brown"],
      },
    ],
    helpText:
      "Creates 12 variants (4 sizes × 3 colors). Common for footwear.",
    exampleProducts: ["Sneakers", "Boots", "Sandals"],
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Template Categories Metadata
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const TEMPLATE_CATEGORIES = [
  {
    id: "clothing" as const,
    name: "Clothing",
    description: "Size templates for apparel",
    icon: "👕",
  },
  {
    id: "shoes" as const,
    name: "Shoes",
    description: "Shoe size templates",
    icon: "👟",
  },
  {
    id: "colors" as const,
    name: "Colors",
    description: "Color palettes",
    icon: "🎨",
  },
  {
    id: "materials" as const,
    name: "Materials",
    description: "Material variations",
    icon: "🧵",
  },
  {
    id: "custom" as const,
    name: "Custom",
    description: "Start from scratch",
    icon: "✏️",
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helper Functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Calculate total variants that will be created from options
 */
export function calculateVariantCount(options: { values: string[] }[]): number {
  if (options.length === 0) return 0;
  return options.reduce((total, option) => total * option.values.length, 1);
}

/**
 * Get variant count status (green/yellow/red based on Shopify's 100-variant limit)
 */
export function getVariantCountStatus(count: number): {
  status: "safe" | "warning" | "danger";
  color: string;
  message: string;
} {
  if (count === 0) {
    return {
      status: "safe",
      color: "gray",
      message: "No variants yet",
    };
  }
  if (count < 50) {
    return {
      status: "safe",
      color: "green",
      message: "Good variant count",
    };
  }
  if (count < 80) {
    return {
      status: "warning",
      color: "yellow",
      message: "Approaching Shopify's 100-variant limit",
    };
  }
  if (count < 100) {
    return {
      status: "danger",
      color: "orange",
      message: "Close to limit - consider consolidating options",
    };
  }
  return {
    status: "danger",
    color: "red",
    message: "Exceeds Shopify's 100-variant limit - product cannot be saved",
  };
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(
  category: "clothing" | "shoes" | "colors" | "materials" | "custom"
): OptionTemplate[] {
  return OPTION_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get recommended templates (those marked with recommended: true)
 */
export function getRecommendedTemplates(): OptionTemplate[] {
  return OPTION_TEMPLATES.filter((t) =>
    t.options.some((opt) => opt.recommended)
  );
}
