const fs = require('fs');

// Read the file
const content = fs.readFileSync('src/lib/api/admin.js', 'utf8');

// Find and replace the getAdminProducts function
const oldPattern = /export const getAdminProducts = async \(\) => \{[\s\S]*?\.order\("created_at", \{ ascending: false \}\);/;

const newFunction = `export const getAdminProducts = async (filters = {}) => {
  let query = supabase
    .from("products")
    .select(\`
      *,
      categories!product_categories(id, name),
      product_sizes(*),
      product_images(id, image_url, is_primary, display_order)
    \`);

  // Apply filters
  if (filters.productCode) {
    query = query.ilike("product_code", \`%\${filters.productCode}%\`);
  }

  if (filters.minPrice) {
    const minPrice = parseFloat(filters.minPrice);
    if (!isNaN(minPrice)) {
      query = query.gte("price", minPrice);
    }
  }

  if (filters.maxPrice) {
    const maxPrice = parseFloat(filters.maxPrice);
    if (!isNaN(maxPrice)) {
      query = query.lte("price", maxPrice);
    }
  }

  query = query.order("created_at", { ascending: false });`;

const newContent = content.replace(oldPattern, newFunction);

// Write back
fs.writeFileSync('src/lib/api/admin.js', newContent, 'utf8');

console.log("✅ File updated successfully!");
