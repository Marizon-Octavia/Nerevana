import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDistanceMiles,
  calculateOrderSummary,
  canTransitionStatus,
  filterProducts,
  ProductItem,
} from './procurement.ts';

test('calculateDistanceMiles accurately computes distance between two coordinates', () => {
  // New York (40.7128, -74.0060) to Philadelphia (39.9526, -75.1652) is ~80-82 miles
  const ny = { lat: 40.7128, lng: -74.006 };
  const philly = { lat: 39.9526, lng: -75.1652 };
  const distance = calculateDistanceMiles(ny, philly);
  assert.ok(distance > 75 && distance < 85, `Distance was ${distance}`);

  // Same coordinates should yield 0
  assert.equal(calculateDistanceMiles(ny, ny), 0);
});

test('calculateOrderSummary calculates quantities, tiers, and subtotals', () => {
  // 10 units at $20 = $200 (no discount)
  const lowTier = calculateOrderSummary(10, 20);
  assert.equal(lowTier.subtotal, 200);
  assert.equal(lowTier.discountPercent, 0);
  assert.equal(lowTier.total, 200);

  // 30 units at $20 = $600 (5% discount = $30 off -> $570)
  const midTier = calculateOrderSummary(30, 20);
  assert.equal(midTier.subtotal, 600);
  assert.equal(midTier.discountPercent, 5);
  assert.equal(midTier.discountAmount, 30);
  assert.equal(midTier.total, 570);

  // 100 units at $20 = $2,000 (10% discount = $200 off -> $1,800)
  const highTier = calculateOrderSummary(100, 20);
  assert.equal(highTier.subtotal, 2000);
  assert.equal(highTier.discountPercent, 10);
  assert.equal(highTier.discountAmount, 200);
  assert.equal(highTier.total, 1800);
});

test('canTransitionStatus validates permissible status flow by role', () => {
  // Supplier transitions
  assert.equal(canTransitionStatus('pending', 'confirmed', 'supplier'), true);
  assert.equal(canTransitionStatus('confirmed', 'dispatched', 'supplier'), true);
  assert.equal(canTransitionStatus('dispatched', 'delivered', 'supplier'), true);
  assert.equal(canTransitionStatus('pending', 'dispatched', 'supplier'), false); // cannot skip

  // Terminal states cannot transition
  assert.equal(canTransitionStatus('delivered', 'confirmed', 'supplier'), false);
  assert.equal(canTransitionStatus('cancelled', 'pending', 'buyer'), false);

  // Buyer transitions
  assert.equal(canTransitionStatus('pending', 'cancelled', 'buyer'), true);
  assert.equal(canTransitionStatus('dispatched', 'delivered', 'buyer'), true);
  assert.equal(canTransitionStatus('pending', 'confirmed', 'buyer'), false); // buyer cannot confirm their own PO
});

test('filterProducts handles categories, text matching, and price constraints', () => {
  const dummyProducts: ProductItem[] = [
    {
      id: 'p1',
      supplierId: 's1',
      supplierName: 'Alice',
      supplierOrg: 'Apex Stationery',
      supplierLocation: '123 Main St',
      lat: 40.71,
      lng: -74.0,
      title: 'Graphing Notebooks (Pack of 50)',
      category: 'Stationery & Paper',
      description: 'Durable squared paper for math & STEM courses.',
      unit: 'pack',
      price: 45,
      moq: 2,
      inStock: 500,
      leadTimeDays: 2,
      rating: 4.8,
    },
    {
      id: 'p2',
      supplierId: 's2',
      supplierName: 'Bob',
      supplierOrg: 'BioSci Labs',
      supplierLocation: '456 Science Park',
      lat: 40.75,
      lng: -73.98,
      title: 'Digital Microscope 1000x',
      category: 'Lab & Science Equipment',
      description: 'High-res microscope for biology classrooms.',
      unit: 'unit',
      price: 280,
      moq: 1,
      inStock: 40,
      leadTimeDays: 4,
      rating: 4.9,
    },
  ];

  // Category filter
  const scienceOnly = filterProducts(dummyProducts, { category: 'Lab & Science Equipment' });
  assert.equal(scienceOnly.length, 1);
  assert.equal(scienceOnly[0].id, 'p2');

  // Search query filter
  const searchNotebook = filterProducts(dummyProducts, { query: 'notebook' });
  assert.equal(searchNotebook.length, 1);
  assert.equal(searchNotebook[0].id, 'p1');

  // Max price filter
  const under100 = filterProducts(dummyProducts, { maxPrice: 100 });
  assert.equal(under100.length, 1);
  assert.equal(under100[0].id, 'p1');
});
