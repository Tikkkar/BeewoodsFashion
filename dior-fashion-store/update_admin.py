import re

# Read the file
with open('src/lib/api/admin.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to match the getAdminProducts function
old_pattern = r'export const getAdminProducts = async \(\) => \{[\s\S]*?\.order\("created_at", \{ ascending: false \}\);'

# New function with filters
new_function = '''export const getAdminProducts = async (filters = {}) => {
  let query = supabase
    .from("products")
    .select(`
      *,
      categories!product_categories(id, name),
      product_sizes(*),
      product_images(id, image_url, is_primary, display_order)
    `);

  // Apply filters
  if (filters.productCode) {
    query = query.ilike("product_code", `%${filters.productCode}%`);
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

  query = query.order("created_at", { ascending: false });'''

# Replace
content = re.sub(old_pattern, new_function, content)

# Write back
with open('src/lib/api/admin.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("File updated successfully!")
