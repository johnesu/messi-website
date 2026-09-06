import type { ProductDto } from '@mesi/types';
import type { HomePage, Category, BlogPost } from './catalog';

const img = (seed: number, w = 800, h = 800) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

// M.O.T clothing photography (https://www.motthelabel.com) — portrait garment shots.
const mot = (file: string, width = 1080, height = 1620) =>
  `https://www.motthelabel.com/cdn/shop/files/${file}?crop=center&height=${height}&width=${width}`;

export const demoCategories: Category[] = [
  { id: 'c-bridal', name: 'Bridal', slug: 'bridal', description: 'Couture bridal gowns & evening wear', imageUrl: mot('Atsi1d.jpg'), parentId: null, _count: { productCategories: 3 } },
  { id: 'c-native', name: 'Native Wear', slug: 'native-wear', description: 'Ancestral African print & Aso-Oke', imageUrl: mot('Kome1a.jpg'), parentId: null, _count: { productCategories: 3 } },
  { id: 'c-corporate', name: 'Corporate', slug: 'corporate', description: 'Tailored blazers & business suiting', imageUrl: mot('1V5A6272_copy.jpg'), parentId: null, _count: { productCategories: 3 } },
  { id: 'c-casual', name: 'Casual', slug: 'casual', description: 'Everyday ready-to-wear pieces', imageUrl: mot('Chichi1_2.webp'), parentId: null, _count: { productCategories: 2 } },
];

function product(p: Partial<ProductDto> & Pick<ProductDto, 'id' | 'name' | 'slug' | 'price'>): ProductDto {
  return {
    sku: p.slug.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
    description: null,
    shortDescription: null,
    salePrice: null,
    costPrice: null,
    status: 'ACTIVE',
    featured: false,
    rating: 4.5,
    reviewCount: 0,
    images: [],
    variants: [],
    categoryIds: [],
    brandId: null,
    tags: [],
    attributes: {},
    stock: 25,
    seoTitle: null,
    seoDescription: null,
    createdAt: new Date().toISOString(),
    ...p,
  };
}

export const demoProducts: ProductDto[] = [
  product({
    id: 'p-1', name: 'Ethereal Aso-Oke Gown', slug: 'ethereal-aso-oke-gown', price: 2850000, salePrice: 2450000,
    shortDescription: 'Hand-woven Aso-Oke bridal gown in champagne gold & ivory.',
    description: 'A bespoke-only masterpiece of hand-woven Aso-Oke in champagne gold and ivory, featuring dramatic structural sleeves and subtle beadwork. Cut and finished in our atelier by master tailors.',
    rating: 4.9, reviewCount: 12, featured: true, stock: 3, brandId: null,
    categoryIds: ['c-bridal'], tags: ['bridal', 'bespoke', 'featured'],
    images: [{ id: 'i1', url: mot('Atsi1d.jpg'), alt: 'Ethereal Aso-Oke Gown', position: 0 }],
    variants: [{ id: 'v1', sku: 'ASO-01', price: 2850000, salePrice: 2450000, stock: 3, attributes: { size: 'Bespoke' }, imageUrl: mot('Atsi1d.jpg'), barcode: null }],
  }),
  product({
    id: 'p-2', name: 'Regal Velvet Suit', slug: 'regal-velvet-suit', price: 1450000,
    shortDescription: 'Midnight-purple bespoke three-piece with a silk sheen.',
    description: 'A three-piece bespoke suit in midnight-purple woven fabric with a subtle silk sheen, high-waisted trousers and a modern slim-cut silhouette. Crafted for a flawless, tailored fit.',
    rating: 4.8, reviewCount: 45, featured: true, stock: 5,
    categoryIds: ['c-corporate', 'c-bridal'], tags: ['bespoke', 'suit', 'featured'],
    images: [{ id: 'i2', url: mot('Tariset1a.jpg'), alt: 'Regal Velvet Suit', position: 0 }],
    variants: [{ id: 'v2', sku: 'REG-02', price: 1450000, salePrice: null, stock: 5, attributes: { size: 'Make to Measure' }, imageUrl: mot('Tariset1a.jpg'), barcode: null }],
  }),
  product({
    id: 'p-3', name: 'Signature Ivory Blazer', slug: 'signature-ivory-blazer', price: 890000,
    shortDescription: 'Ivory wool-crepe blazer with gold button detailing.',
    description: 'A high-end women’s corporate blazer in ivory wool crepe, finished with precision stitching and luxurious gold buttons. Crisp, editorial and endlessly versatile.',
    rating: 4.7, reviewCount: 18, stock: 8,
    categoryIds: ['c-corporate'], tags: ['corporate', 'blazer'],
    images: [{ id: 'i3', url: mot('Sanaa1b.jpg'), alt: 'Signature Ivory Blazer', position: 0 }],
    variants: [{ id: 'v3', sku: 'SIG-03', price: 890000, salePrice: null, stock: 8, attributes: { size: 'S–XL' }, imageUrl: mot('Sanaa1b.jpg'), barcode: null }],
  }),
  product({
    id: 'p-4', name: 'Metropolitan Caftan', slug: 'metropolitan-caftan', price: 550000,
    shortDescription: 'Modern African print caftan in slate grey & deep blue.',
    description: 'A modern native caftan for men with minimalist geometric patterns in slate grey and deep blue. A refined fusion of tradition and contemporary tailoring.',
    rating: 4.6, reviewCount: 32, featured: true, stock: 12,
    categoryIds: ['c-native'], tags: ['native', 'caftan', 'featured'],
    images: [{ id: 'i4', url: mot('Abasi1_2.webp'), alt: 'Metropolitan Caftan', position: 0 }],
    variants: [{ id: 'v4', sku: 'MET-04', price: 550000, salePrice: null, stock: 12, attributes: { size: 'M–XXL' }, imageUrl: mot('Abasi1_2.webp'), barcode: null }],
  }),
  product({
    id: 'p-5', name: 'Regal Bride Collection', slug: 'regal-bride-collection', price: 3250000,
    shortDescription: 'Vibrant traditional African bridal ensemble in gold & cream.',
    description: 'A stunning traditional African bridal ensemble in vibrant gold and cream fabrics — a high-fashion statement crafted for the modern bride who honours her heritage.',
    rating: 5.0, reviewCount: 9, featured: true, stock: 2,
    categoryIds: ['c-bridal'], tags: ['bridal', 'featured'],
    images: [{ id: 'i5', url: mot('1V5A6272_copy.jpg'), alt: 'Regal Bride Collection', position: 0 }],
    variants: [{ id: 'v5', sku: 'BRD-05', price: 3250000, salePrice: null, stock: 2, attributes: { size: 'Bespoke' }, imageUrl: mot('1V5A6272_copy.jpg'), barcode: null }],
  }),
  product({
    id: 'p-6', name: 'Contemporary Fusion Dress', slug: 'contemporary-fusion-dress', price: 680000, salePrice: 590000,
    shortDescription: 'Modern interpretation of African print fashion.',
    description: 'A modern take on African print — clean lines, confident colour and a silhouette that bridges the classic and the contemporary. Hand-finished in our atelier.',
    rating: 4.5, reviewCount: 26, stock: 7,
    categoryIds: ['c-native'], tags: ['native', 'sale'],
    images: [{ id: 'i6', url: mot('Kome1a.jpg'), alt: 'Contemporary Fusion Dress', position: 0 }],
    variants: [{ id: 'v6', sku: 'FUS-06', price: 680000, salePrice: 590000, stock: 7, attributes: { size: 'S–L' }, imageUrl: mot('Kome1a.jpg'), barcode: null }],
  }),
  product({
    id: 'p-7', name: 'Graduate Showcase Drapery', slug: 'graduate-showcase-drapery', price: 420000,
    shortDescription: 'Star student project featuring complex draping techniques.',
    description: 'A striking piece from our graduate showcase, demonstrating advanced structural draping learned in the Fashion Design Mastery track. A one-of-one, signed by its designer.',
    rating: 4.4, reviewCount: 14, stock: 1,
    categoryIds: ['c-casual'], tags: ['student', 'draping'],
    images: [{ id: 'i7', url: mot('1V5A6051copy.jpg'), alt: 'Graduate Showcase Drapery', position: 0 }],
    variants: [{ id: 'v7', sku: 'GRD-07', price: 420000, salePrice: null, stock: 1, attributes: { size: 'One size' }, imageUrl: mot('1V5A6051copy.jpg'), barcode: null }],
  }),
  product({
    id: 'p-8', name: "Gentleman's Couture Suit", slug: 'gentlemans-couture-suit', price: 2100000,
    shortDescription: 'Custom-tailored bespoke suit, made to measure.',
    description: 'A custom-tailored suit for the discerning gentleman, made to measure in our atelier. Expert drape, meticulous finishing and a silhouette built around your measurements.',
    rating: 4.9, reviewCount: 38, featured: true, stock: 4,
    categoryIds: ['c-corporate'], tags: ['bespoke', 'suit', 'featured'],
    images: [{ id: 'i8', url: mot('Turai1gold.jpg'), alt: "Gentleman's Couture Suit", position: 0 }],
    variants: [{ id: 'v8', sku: 'GNT-08', price: 2100000, salePrice: null, stock: 4, attributes: { size: 'Make to Measure' }, imageUrl: mot('Turai1gold.jpg'), barcode: null }],
  }),
  product({
    id: 'p-9', name: 'Bridal Lace Evening Gown', slug: 'bridal-lace-evening-gown', price: 1650000,
    shortDescription: 'White lace couture gown with couture finishing.',
    description: 'A breathtaking white lace gown finished on the mannequin with couture finishing, lace manipulation and refined corsetry. The pinnacle of our Bridal & Evening Wear track.',
    rating: 4.8, reviewCount: 21, stock: 3,
    categoryIds: ['c-bridal'], tags: ['bridal', 'lace'],
    images: [{ id: 'i9', url: mot('Salma1_3.webp'), alt: 'Bridal Lace Evening Gown', position: 0 }],
    variants: [{ id: 'v9', sku: 'LAC-09', price: 1650000, salePrice: null, stock: 3, attributes: { size: 'Bespoke' }, imageUrl: mot('Salma1_3.webp'), barcode: null }],
  }),
  product({
    id: 'p-10', name: 'Slate Adire Aso-Oke Wrap', slug: 'slate-adire-aso-oke-wrap', price: 395000,
    shortDescription: 'Minimalist geometric print in slate grey & deep blue.',
    description: 'An elegant slit-wrap in our exclusive hand-dyed fabric palette, echoing ancestral Adire patterns reimagined for the modern wardrobe. Drapes beautifully for any occasion.',
    rating: 4.6, reviewCount: 17, stock: 10,
    categoryIds: ['c-native'], tags: ['native', 'wrap'],
    images: [{ id: 'i10', url: mot('Tundeset1_2.webp'), alt: 'Slate Adire Wrap', position: 0 }],
    variants: [{ id: 'v10', sku: 'SLT-10', price: 395000, salePrice: null, stock: 10, attributes: { size: 'One size' }, imageUrl: mot('Tundeset1_2.webp'), barcode: null }],
  }),
  product({
    id: 'p-11', name: 'Atelier Weekend Blouse', slug: 'atelier-weekend-blouse', price: 340000,
    shortDescription: 'Relaxed daily piece from our graduating class.',
    description: 'A relaxed, ready-to-wear blouse sewn by our graduating students under expert mentorship — quality construction at an accessible price, straight from the atelier.',
    rating: 4.3, reviewCount: 22, stock: 15,
    categoryIds: ['c-casual'], tags: ['casual', 'student'],
    images: [{ id: 'i11', url: mot('Chichi1_2.webp'), alt: 'Atelier Weekend Blouse', position: 0 }],
    variants: [{ id: 'v11', sku: 'ATL-11', price: 340000, salePrice: null, stock: 15, attributes: { size: 'S–XL' }, imageUrl: mot('Chichi1_2.webp'), barcode: null }],
  }),
];

export const demoBlogPosts: BlogPost[] = [
  {
    id: 'b-1', title: 'The Art of Aso-Oke: Weaving Heritage into Today’s Couture', slug: 'art-of-aso-oke',
    excerpt: 'How ancestral weaving traditions are being reimagined for the modern runway.',
    content:
      'Aso-Oke is more than fabric — it is storytelling. Hand-woven on narrow wooden looms, each strip carries patterns passed down through generations. Today our designers fuse these ancestral textiles with contemporary silhouettes, keeping the craft alive while pushing it forward.',
    coverImage: img(50), status: 'PUBLISHED', publishedAt: new Date().toISOString(), tags: ['heritage'], category: { name: 'Native Wear', slug: 'native-wear' },
  },
  {
    id: 'b-2', title: 'From First Stitch to First Collection: The Designer’s Journey', slug: 'first-stitch-to-collection',
    excerpt: 'What it really takes to go from tailoring student to launched fashion brand.',
    content:
      'Every brand starts with one garment. At MESI, students move from mastering the basics of construction to building a full collection — learning colour theory, draping and fashion business along the way. Many launch their line within months of graduating.',
    coverImage: img(51), status: 'PUBLISHED', publishedAt: new Date().toISOString(), tags: ['career'], category: { name: 'Corporate', slug: 'corporate' },
  },
  {
    id: 'b-3', title: 'Bespoke vs Ready-to-Wear: Which Suit Should You Choose?', slug: 'bespoke-vs-ready-to-wear',
    excerpt: 'We break down fit, fabric and value for every wardrobe.',
    content:
      'Ready-to-wear offers convenience; bespoke offers a garment built around your body. If you attend events often, invest in a quality suit, or simply want that flawless drape — made-to-measure is worth it. Our atelier walks you through every choice.',
    coverImage: img(52), status: 'PUBLISHED', publishedAt: new Date().toISOString(), tags: ['bespoke'], category: { name: 'Corporate', slug: 'corporate' },
  },
  {
    id: 'b-4', title: 'Preserving Native Prints: Caring for Africa’s Textile Legacy', slug: 'caring-for-native-prints',
    excerpt: 'Simple care tips that keep Adire and Ankara vibrant for years.',
    content:
      'Native prints deserve gentle treatment. Wash in cold water with mild detergent, avoid harsh bleach, and dry in the shade to prevent fading. Store carefully to keep the colours rich — these are heirlooms in the making.',
    coverImage: img(53), status: 'PUBLISHED', publishedAt: new Date().toISOString(), tags: ['fashion'], category: { name: 'Native Wear', slug: 'native-wear' },
  },
  {
    id: 'b-5', title: '5 Steps to a Perfectly Fitted Bridal Gown', slug: 'perfectly-fitted-bridal-gown',
    excerpt: 'From the first toile to the final fitting — here’s how it comes together.',
    content:
      'A bridal gown is built over several fittings. We start with a toile to perfect the silhouette, drape the final fabric, then hand-finish every seam. The result is a dress that moves with you and fits like it was always meant to — because it was made for you.',
    coverImage: img(54), status: 'PUBLISHED', publishedAt: new Date().toISOString(), tags: ['bridal'], category: { name: 'Bridal', slug: 'bridal' },
  },
  {
    id: 'b-6', title: 'Sewing Your Future: Why Fashion Skills Matter', slug: 'sewing-your-future',
    excerpt: 'Technical skill is the foundation of economic independence in fashion.',
    content:
      'Behind every successful designer is mastery of the craft. Rigorous, skill-based training builds the confidence to start a business, employ others and lead the industry. That is the MESI mission — empowering lives through the art of fashion.',
    coverImage: img(55), status: 'PUBLISHED', publishedAt: new Date().toISOString(), tags: ['training'], category: { name: 'Corporate', slug: 'corporate' },
  },
];

function section(id: string, type: string, title: string | null, settings: Record<string, unknown>) {
  return { id, type, title, position: 0, enabled: true, settings };
}

export const demoHome: HomePage = {
  title: 'Home',
  slug: 'home',
  isHomepage: true,
  sections: [
    section('s-hero', 'HERO', null, {
      heading: 'Transforming Lives Through Fashion, Creativity & Skills',
      subtitle: 'Join Africa’s leading fashion institute where heritage craftsmanship meets modern innovation. Master the art of tailoring and design under expert mentorship.',
    }),
    section('s-featured', 'PRODUCT_GRID', 'The Atelier Collection', {}),
    section('s-cat', 'CATEGORY_GRID', 'Shop by collection', {}),
    section('s-banner', 'BANNER', 'Bespoke craftsmanship, worldwide shipping', { text: 'Every garment is made to order by our master tailors and delivered to your doorstep, anywhere in the world.' }),
  ],
};
