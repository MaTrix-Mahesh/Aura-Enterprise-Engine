const assert = require('assert');

async function run() {
  console.log('--- STARTING EMERGENCY API VERIFICATION SUITE ---');

  // 1. Health
  const resHealth = await fetch('http://localhost:5000/api/health');
  assert.strictEqual(resHealth.status, 200);
  const dataHealth = await resHealth.json();
  console.log('1. Health check: PASSED', dataHealth.status);

  // 2. Inventory Page 1 (limit 50)
  const resInv1 = await fetch('http://localhost:5000/api/inventory?page=1&limit=50');
  assert.strictEqual(resInv1.status, 200);
  const dataInv1 = await resInv1.json();
  assert.strictEqual(dataInv1.data.length, 50);
  assert.strictEqual(dataInv1.pagination.page, 1);
  assert.strictEqual(dataInv1.pagination.limit, 50);
  assert.ok(dataInv1.pagination.total >= 50000, `Total items (${dataInv1.pagination.total}) should be >= 50000`);
  console.log(`2. Inventory Page 1 limit 50: PASSED (Returned 50 items of ${dataInv1.pagination.total})`);

  // 3. Inventory Page 2 (limit 50)
  const resInv2 = await fetch('http://localhost:5000/api/inventory?page=2&limit=50');
  assert.strictEqual(resInv2.status, 200);
  const dataInv2 = await resInv2.json();
  assert.strictEqual(dataInv2.data.length, 50);
  assert.strictEqual(dataInv2.pagination.page, 2);
  assert.notStrictEqual(dataInv1.data[0]._id, dataInv2.data[0]._id);
  console.log('3. Inventory Page 2 limit 50: PASSED (Distinct page 2 records returned)');

  // 4. Inventory Page 1 (limit 100)
  const resInv100 = await fetch('http://localhost:5000/api/inventory?page=1&limit=100');
  assert.strictEqual(resInv100.status, 200);
  const dataInv100 = await resInv100.json();
  assert.strictEqual(dataInv100.data.length, 100);
  assert.strictEqual(dataInv100.pagination.limit, 100);
  console.log('4. Inventory Page 1 limit 100: PASSED (Returned 100 items)');

  // 5. Inventory Search
  const resSearch = await fetch('http://localhost:5000/api/inventory?search=AURA');
  assert.strictEqual(resSearch.status, 200);
  const dataSearch = await resSearch.json();
  assert.ok(dataSearch.data.length > 0);
  console.log(`5. Inventory Search: PASSED (Found ${dataSearch.pagination.total} records matching 'AURA')`);

  // 6. Analytics
  const resAnalytics = await fetch('http://localhost:5000/api/analytics');
  const dataAnalytics = await resAnalytics.json();
  assert.ok(dataAnalytics.data.totalSKUs >= 50000, `totalSKUs (${dataAnalytics.data.totalSKUs}) should be >= 50000`);
  assert.ok(dataAnalytics.data.totalInventoryValue > 0);
  assert.ok(dataAnalytics.data.outOfStockCount >= 0);
  assert.ok(dataAnalytics.data.categoryValuation.length > 0);
  assert.strictEqual(dataAnalytics.data.topLowestStock.length, 10);
  console.log('6. Analytics Aggregation: PASSED', {
    totalSKUs: dataAnalytics.data.totalSKUs,
    totalValuation: dataAnalytics.data.totalInventoryValue,
    outOfStock: dataAnalytics.data.outOfStockCount,
    lowStock: dataAnalytics.data.lowStockCount,
    categoriesCount: dataAnalytics.data.categoryValuation.length,
    topLowestSample: dataAnalytics.data.topLowestStock[0].sku
  });

  // 7. CSV Export
  const resExport = await fetch('http://localhost:5000/api/inventory/export?category=Industrial%20Automation');
  assert.strictEqual(resExport.status, 200);
  assert.strictEqual(resExport.headers.get('content-type'), 'text/csv; charset=utf-8');
  const csvText = await resExport.text();
  const csvLines = csvText.trim().split('\n');
  assert.ok(csvLines.length > 1000);
  console.log(`7. CSV Streaming Export: PASSED (Exported ${csvLines.length - 1} rows of filtered data with valid CSV headers)`);

  // 8. Validation Rejection Check (price < cost)
  const resInvalid = await fetch('http://localhost:5000/api/inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productName: 'Invalid Product Test',
      sku: 'TEST-INVALID-001',
      category: 'Precision Tools',
      price: 10,
      cost: 50, // price < cost must be rejected!
      stockQuantity: 10,
      reorderLevel: 5
    })
  });
  assert.strictEqual(resInvalid.status, 400);
  const dataInvalid = await resInvalid.json();
  assert.strictEqual(dataInvalid.success, false);
  console.log('8a. Zod Validation Rejection (price < cost): PASSED', dataInvalid.message);

  // 8b. Validation Valid Creation
  const uniqueSku = `TEST-EMERGENCY-${Date.now()}`;
  const resValid = await fetch('http://localhost:5000/api/inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productName: 'Emergency Submission Test Product',
      sku: uniqueSku,
      category: 'Enterprise Networking',
      price: 250,
      cost: 150,
      stockQuantity: 45,
      reorderLevel: 20
    })
  });
  assert.strictEqual(resValid.status, 201);
  const dataValid = await resValid.json();
  assert.strictEqual(dataValid.success, true);
  assert.strictEqual(dataValid.data.sku, uniqueSku);
  const createdId = dataValid.data._id;
  console.log('8b. Valid Product Creation: PASSED', createdId);

  // 9. Product Update (PUT /api/inventory/:id)
  const resUpdate = await fetch(`http://localhost:5000/api/inventory/${createdId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stockQuantity: 88,
      price: 260
    })
  });
  assert.strictEqual(resUpdate.status, 200);
  const dataUpdate = await resUpdate.json();
  assert.strictEqual(dataUpdate.data.stockQuantity, 88);
  assert.strictEqual(dataUpdate.data.price, 260);
  console.log('9. Product Update: PASSED (Stock updated to 88, price updated to 260)');

  // 10. Product Cleanup (DELETE /api/inventory/:id)
  const resDelete = await fetch(`http://localhost:5000/api/inventory/${createdId}`, {
    method: 'DELETE',
  });
  assert.strictEqual(resDelete.status, 200);
  const dataDelete = await resDelete.json();
  assert.strictEqual(dataDelete.success, true);
  console.log('10. Product Cleanup: PASSED (Temporary test record deleted cleanly)');

  console.log('\n--- ALL API ACCEPTANCE CHECKS PASSED (100%) ---');
}

run().catch(err => {
  console.error('API Verification FAILED:', err);
  process.exit(1);
});
