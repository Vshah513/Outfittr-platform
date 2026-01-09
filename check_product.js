// Temporary script to check product data
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProduct() {
  const { data, error } = await supabase
    .from('products')
    .select('id, title, images, category, subcategory')
    .eq('category', 'womens')
    .limit(5);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Products found:', data.length);
    data.forEach(p => {
      console.log('\n---');
      console.log('ID:', p.id);
      console.log('Title:', p.title);
      console.log('Category:', p.category);
      console.log('Subcategory:', p.subcategory);
      console.log('Images:', JSON.stringify(p.images));
      console.log('Images type:', typeof p.images);
      console.log('Images length:', p.images?.length);
    });
  }
}

checkProduct().then(() => process.exit(0));
