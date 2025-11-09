export type ListingPlatform = "Amazon" | "Flipkart" | "Meesho" | "Myntra";

type CatalogRow = Record<string, string>;

const titleTemplates: Record<ListingPlatform, (row: CatalogRow) => string> = {
  Amazon: (row) => {
    const brand = row.brand || row.Brand || row.vendor || "Premium";
    const name = row.product_name || row.title || row.Name || "Product";
    const keyTrait = row.key_feature || row.feature || row.Features || row.material || "";
    const size = row.size || row.Size || "";
    return [brand, name, keyTrait, size]
      .filter(Boolean)
      .map((part) => part.trim())
      .join(" | ")
      .slice(0, 180);
  },
  Flipkart: (row) => {
    const base = row.product_name || row.title || "Exclusive Pick";
    const qualifier = row.style || row.pattern || row.gender || "";
    return `${base} ${qualifier}`.trim().slice(0, 100);
  },
  Meesho: (row) => {
    const base = row.product_name || row.title || "Trendy Look";
    const category = row.category || row.segment || "Best Seller";
    return `${base} - ${category}`.slice(0, 120);
  },
  Myntra: (row) => {
    const brand = row.brand || row.Brand || "Signature";
    const base = row.product_name || row.title || "Collection";
    return `${brand} ${base}`.slice(0, 80);
  },
};

const bulletTemplates: Record<ListingPlatform, (row: CatalogRow) => string[]> = {
  Amazon: (row) => {
    const features = (row.features || row.Features || "")
      .split(/[|,•\n]/)
      .map((feature) => feature.trim())
      .filter(Boolean);
    const material = row.material ? `Crafted from ${row.material}.` : undefined;
    const usage = row.usage ? `Ideal for ${row.usage}.` : undefined;
    return [material, usage, ...features].filter(Boolean).slice(0, 5) as string[];
  },
  Flipkart: (row) => {
    const usp = row.usp || row.UniqueSellingPoint || row.description || "";
    return usp
      .split(/[.|]/)
      .map((part) => part.trim())
      .filter((part) => part.length > 3)
      .slice(0, 5);
  },
  Meesho: (row) => {
    const highlight = row.highlight || row.Highlights || row.features || "";
    if (!highlight) return ["Trusted quality", "Curated for your boutique", "Ships fast"];
    return highlight
      .split(/[|,•\n]/)
      .map((feature) => feature.trim())
      .filter(Boolean)
      .slice(0, 4);
  },
  Myntra: (row) => {
    const styleTip = row.style_tip || row.Styling || "";
    const care = row.care || row.care_instructions || "";
    return [styleTip, care].filter(Boolean).slice(0, 3);
  },
};

const descriptionTemplates: Record<ListingPlatform, (row: CatalogRow) => string> = {
  Amazon: (row) => {
    const name = row.product_name || row.title || "this product";
    const category = row.category || row.ProductType || "premium item";
    const tone = row.tone || "professional";
    return `${name} delivers a ${tone} experience in the ${category} category. Designed to maximise conversion with compelling features and customer-centric benefits.`;
  },
  Flipkart: (row) => {
    const origin = row.country_of_origin || row.origin || "India";
    return `Handpicked for Flipkart customers. Crafted in ${origin} with attention to detailing, ensuring great value for money shoppers.`;
  },
  Meesho: (row) => {
    const margin = row.margin || row.wholesale_price ? "Optimised margins for resellers." : "";
    return `Perfect addition for boutique sellers. ${margin} Lightweight packaging for reduced logistics cost.`;
  },
  Myntra: (row) => {
    const vibe = row.theme || row.collection || "seasonal";
    return `Part of our ${vibe} drop, aligned with Myntra style guides. Pair it effortlessly with trending wardrobe essentials.`;
  },
};

const keywordTemplates: Record<ListingPlatform, (row: CatalogRow) => string[]> = {
  Amazon: (row) => {
    const keywords = row.keywords || row.search_terms || "";
    const derived = [
      row.category,
      row.sub_category,
      row.material,
      row.color,
      row.season,
    ].filter(Boolean);
    return [...keywords.split(","), ...derived]
      .map((item) => item?.toString().trim() || "")
      .filter(Boolean)
      .slice(0, 15);
  },
  Flipkart: (row) => {
    return [row.category, row.brand, row.gender, row.pattern].filter(Boolean).map(String);
  },
  Meesho: (row) => {
    return [row.category, row.product_name, "Wholesale", "Trending"].filter(Boolean).map(String);
  },
  Myntra: (row) => {
    return [row.brand, row.category, row.occasion, row.fit].filter(Boolean).map(String);
  },
};

export const generateListing = (row: CatalogRow, platform: ListingPlatform) => {
  const title = titleTemplates[platform](row);
  const bullets = bulletTemplates[platform](row);
  const description = descriptionTemplates[platform](row);
  const keywords = keywordTemplates[platform](row);
  return {
    Platform: platform,
    Title: title,
    BulletPoints: bullets.join(" | "),
    Description: description,
    SearchKeywords: keywords.join(", "),
    Price: row.price || row.selling_price || row.mrp || "",
    SKU: row.sku || row.SKU || row["Seller SKU"] || "",
    HSN: row.hsn || row.hsn_code || "",
  };
};

export const enrichCatalog = (rows: CatalogRow[], platforms: ListingPlatform[]) => {
  return rows.flatMap((row) => {
    return platforms.map((platform) => ({
      ...row,
      ...generateListing(row, platform),
    }));
  });
};
