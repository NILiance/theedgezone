import type { Supplier, SupplierProduct, SupplierSearchParams } from './types'

/**
 * Mock supplier — returns deterministic sample data so the talent UI is
 * exercisable without real credentials. Enabled by default in
 * supplier_credentials.
 */
const SAMPLE: SupplierProduct[] = [
  {
    supplierSku: 'MOCK-TEE-001',
    name: 'Premium Heavy Tee',
    description: '6.5 oz cotton tee with reinforced shoulder seams. Pre-shrunk.',
    brand: 'CoreApparel',
    category: 'T-Shirts',
    basePriceCents: 1800,
    wholesalePriceCents: 1100,
    suggestedMsrpCents: 2999,
    primaryImageUrl: 'https://placehold.co/600x600/000/fff?text=Tee',
    imageUrls: ['https://placehold.co/600x600/000/fff?text=Tee+1', 'https://placehold.co/600x600/333/fff?text=Tee+2'],
    colorOptions: ['Black', 'White', 'Athletic Heather', 'Navy'],
    sizeOptions: ['S', 'M', 'L', 'XL', '2XL'],
    inventoryTotal: 4500,
    variants: [
      { sku: 'MOCK-TEE-001-BLK-M', size: 'M', color: 'Black', priceCents: 1800, inventory: 240 },
      { sku: 'MOCK-TEE-001-BLK-L', size: 'L', color: 'Black', priceCents: 1800, inventory: 180 },
      { sku: 'MOCK-TEE-001-WHT-M', size: 'M', color: 'White', priceCents: 1800, inventory: 320 },
    ],
  },
  {
    supplierSku: 'MOCK-HOODIE-001',
    name: 'Sponge Fleece Hoodie',
    description: '8 oz sponge fleece. Athletic fit. Two-ply hood with matching drawstring.',
    brand: 'CoreApparel',
    category: 'Hoodies',
    basePriceCents: 3400,
    wholesalePriceCents: 2200,
    suggestedMsrpCents: 5499,
    primaryImageUrl: 'https://placehold.co/600x600/000/fff?text=Hoodie',
    imageUrls: ['https://placehold.co/600x600/000/fff?text=Hoodie'],
    colorOptions: ['Black', 'Navy', 'Charcoal'],
    sizeOptions: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
    inventoryTotal: 2200,
  },
  {
    supplierSku: 'MOCK-HAT-001',
    name: 'Structured Snapback',
    description: 'Six-panel structured cap with flat brim. Plastic snap closure.',
    brand: 'HeadCo',
    category: 'Headwear',
    basePriceCents: 1400,
    wholesalePriceCents: 900,
    suggestedMsrpCents: 2499,
    primaryImageUrl: 'https://placehold.co/600x600/000/fff?text=Cap',
    imageUrls: ['https://placehold.co/600x600/000/fff?text=Cap'],
    colorOptions: ['Black/Black', 'Navy/White', 'Charcoal/Black'],
    sizeOptions: ['One Size'],
    inventoryTotal: 980,
  },
  {
    supplierSku: 'MOCK-CREW-001',
    name: 'Heavyweight Crewneck',
    description: '9 oz fleece crewneck with set-in sleeves. No drawstrings — safe for kid sizes.',
    brand: 'CoreApparel',
    category: 'Sweatshirts',
    basePriceCents: 2900,
    wholesalePriceCents: 1800,
    suggestedMsrpCents: 4499,
    primaryImageUrl: 'https://placehold.co/600x600/000/fff?text=Crew',
    imageUrls: ['https://placehold.co/600x600/000/fff?text=Crew'],
    colorOptions: ['Black', 'Athletic Grey', 'Sand'],
    sizeOptions: ['S', 'M', 'L', 'XL', '2XL'],
    inventoryTotal: 1700,
  },
  {
    supplierSku: 'MOCK-MUG-001',
    name: 'Ceramic Mug 11oz',
    description: 'Dishwasher-safe ceramic mug. Full-wrap print area.',
    brand: 'TableWare',
    category: 'Drinkware',
    basePriceCents: 600,
    wholesalePriceCents: 350,
    suggestedMsrpCents: 1499,
    primaryImageUrl: 'https://placehold.co/600x600/000/fff?text=Mug',
    imageUrls: ['https://placehold.co/600x600/000/fff?text=Mug'],
    colorOptions: ['White', 'Black'],
    sizeOptions: ['11oz'],
    inventoryTotal: 5400,
  },
  {
    supplierSku: 'MOCK-STICKER-001',
    name: 'Die-Cut Vinyl Stickers (3-pack)',
    description: 'Weatherproof vinyl. Up to 3" longest dimension. Sold in 3-packs.',
    brand: 'StickIt',
    category: 'Accessories',
    basePriceCents: 350,
    wholesalePriceCents: 180,
    suggestedMsrpCents: 999,
    primaryImageUrl: 'https://placehold.co/600x600/000/fff?text=Stickers',
    imageUrls: ['https://placehold.co/600x600/000/fff?text=Stickers'],
    inventoryTotal: 100000,
  },
]

export class MockSupplier implements Supplier {
  code = 'mock'
  displayName = 'Mock Supplier'

  async test() {
    return { ok: true, message: 'Mock supplier always succeeds' }
  }

  async search(params: SupplierSearchParams): Promise<SupplierProduct[]> {
    const q = (params.query ?? '').toLowerCase()
    const cat = (params.category ?? '').toLowerCase()
    let results = SAMPLE
    if (q) {
      results = results.filter(
        (p) => p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q)
      )
    }
    if (cat) {
      results = results.filter((p) => p.category?.toLowerCase() === cat)
    }
    return results.slice(params.offset ?? 0, (params.offset ?? 0) + (params.limit ?? 50))
  }

  async getProduct(supplierSku: string) {
    return SAMPLE.find((p) => p.supplierSku === supplierSku) ?? null
  }

  async getInventory(supplierSku: string, variantSku?: string) {
    const product = SAMPLE.find((p) => p.supplierSku === supplierSku)
    if (!product) return null
    if (variantSku) {
      const variant = product.variants?.find((v) => v.sku === variantSku)
      return variant
        ? {
            supplierSku,
            variantSku,
            available: variant.inventory ?? 0,
            fetchedAt: new Date().toISOString(),
          }
        : null
    }
    return {
      supplierSku,
      available: product.inventoryTotal ?? 0,
      fetchedAt: new Date().toISOString(),
    }
  }
}
