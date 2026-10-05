#!/usr/bin/env node
import { connectDB, disconnectDB } from '../backend/src/config/db.js';

async function run() {
  console.log('\n====================================================');
  console.log('  DATABASE QUALITY GATE -- AURA ENTERPRISE ENGINE');
  console.log('====================================================\n');
  let allPassed = true;

  try {
    const mongoose = await connectDB();
    const db = mongoose.connection.db;
    const col = db.collection('products');
    console.log('DB:', db.databaseName, '| Collection: products\n');

    // 1. DOCUMENT COUNT
    console.log('[1/6] DOCUMENT COUNT');
    const count = await col.countDocuments();
    const countPass = count === 50000;
    console.log('  Expected: 50,000  Actual:', count, countPass ? '[PASS]' : '[FAIL]');
    if (!countPass) allPassed = false;

    // 2. UNIQUE SKU CHECK
    console.log('\n[2/6] UNIQUE SKU CHECK');
    const [skuAgg] = await col.aggregate([
      { $group: { _id: '$sku', c: { $sum: 1 } } },
      { $group: { _id: null, unique: { $sum: 1 }, dupes: { $sum: { $cond: [{ $gt: ['$c', 1] }, 1, 0] } } } }
    ]).toArray();
    const uniqueSKUs = skuAgg?.unique ?? 0;
    const dupes = skuAgg?.dupes ?? 0;
    const skuPass = uniqueSKUs === 50000 && dupes === 0;
    console.log('  Total docs:', count, '  Unique SKUs:', uniqueSKUs, '  Duplicates:', dupes, skuPass ? '[PASS]' : '[FAIL]');
    if (!skuPass) allPassed = false;

    // 3. DATA INTEGRITY
    console.log('\n[3/6] DATA INTEGRITY');
    const [integ] = await col.aggregate([{
      $group: {
        _id: null,
        priceLessThanCost: { $sum: { $cond: [{ $lt: ['$price','$cost'] }, 1, 0] } },
        negativePrice:     { $sum: { $cond: [{ $lt: ['$price', 0] }, 1, 0] } },
        negativeCost:      { $sum: { $cond: [{ $lt: ['$cost', 0] }, 1, 0] } },
        negativeStock:     { $sum: { $cond: [{ $lt: ['$stockQuantity', 0] }, 1, 0] } },
        negativeReorder:   { $sum: { $cond: [{ $lt: ['$reorderLevel', 0] }, 1, 0] } },
        missingSKU:        { $sum: { $cond: [{ $or: [{ $eq: ['$sku', null] }, { $eq: ['$sku', ''] }] }, 1, 0] } }
      }
    }]).toArray();
    const fields = ['priceLessThanCost','negativePrice','negativeCost','negativeStock','negativeReorder','missingSKU'];
    let integrityPass = true;
    fields.forEach(f => {
      const v = integ?.[f] ?? -1;
      if (v !== 0) integrityPass = false;
      console.log('  ' + f.padEnd(22) + ':', v === 0 ? '[PASS] 0' : '[FAIL] ' + v);
    });
    if (!integrityPass) allPassed = false;

    // 4. INDEX VERIFICATION
    console.log('\n[4/6] INDEX VERIFICATION');
    const indexes = await col.indexes();
    indexes.forEach((idx, i) => {
      const u = idx.unique ? ' [UNIQUE]' : '';
      const w = idx.weights ? ' weights:' + JSON.stringify(idx.weights) : '';
      console.log('  (' + (i+1) + ') "' + idx.name + '" ' + JSON.stringify(idx.key) + u + w);
    });
    const skuIdx      = indexes.find(i => i.key?.sku === 1 && i.unique === true);
    const catStockIdx = indexes.find(i => i.key?.category === 1 && i.key?.stockQuantity === 1);
    const textIdx     = indexes.find(i => i.weights?.productName !== undefined && i.weights?.sku !== undefined);
    const nameIdx     = indexes.find(i => i.key?.productName === 1 && Object.keys(i.key).length === 1);
    const priceIdx    = indexes.find(i => i.key?.price === 1 && Object.keys(i.key).length === 1);
    const dateIdx     = indexes.find(i => i.key?.lastUpdated === -1 && Object.keys(i.key).length === 1);
    const idIdx       = indexes.find(i => i.name === '_id_');
    const idxChecks = [
      ['{sku:1} unique',                   !!skuIdx],
      ['{category:1,stockQuantity:1}',     !!catStockIdx],
      ['{productName:"text",sku:"text"}',  !!textIdx],
      ['{productName:1}',                  !!nameIdx],
      ['{price:1}',                        !!priceIdx],
      ['{lastUpdated:-1}',                 !!dateIdx],
      ['_id_ (default)',                   !!idIdx]
    ];
    let idxPass = true;
    idxChecks.forEach(([label, pass]) => {
      if (!pass) idxPass = false;
      console.log('  ' + (pass ? '[PASS]' : '[FAIL]') + ' ' + label);
    });
    if (!idxPass) allPassed = false;

    // 5. QUERY PERFORMANCE (explain)
    console.log('\n[5/6] QUERY PERFORMANCE');
    async function expl(label, findArgs, sortArg, limitArg) {
      let cursor = col.find(findArgs);
      if (sortArg) cursor = cursor.sort(sortArg);
      if (limitArg) cursor = cursor.limit(limitArg);
      const plan = await cursor.explain('executionStats');
      const pStr = JSON.stringify(plan.queryPlanner?.winningPlan || {});
      const isIx = pStr.includes('IXSCAN');
      const isCo = pStr.includes('COLLSCAN');
      const scan = isIx ? 'IXSCAN' : (isCo ? 'COLLSCAN' : '?');
      const ke   = plan.executionStats?.totalKeysExamined ?? '?';
      const de   = plan.executionStats?.totalDocsExamined ?? '?';
      const ms   = plan.executionStats?.executionTimeMillis ?? '?';
      const pass = isIx && !isCo;
      console.log('  Query: ' + label);
      console.log('    Scan:' + scan + '  Keys:' + ke + '  Docs:' + de + '  ms:' + ms + '  ' + (pass ? '[PASS]' : '[FAIL - NO IXSCAN]'));
      return pass;
    }

    const q1 = await expl('SKU Lookup',            { sku: 'SKU-00001' });
    const q2 = await expl('Category+StockQty',     { category: 'Electronics', stockQuantity: { $gt: 10 } });
    const q3 = await expl('Text Search',            { $text: { $search: 'Wireless' } });
    const q4 = await expl('Price Range',            { price: { $gte: 100, $lte: 500 } }, { price: 1 });
    const q5 = await expl('lastUpdated Sort',       {}, { lastUpdated: -1 }, 50);
    if (!q1 || !q2 || !q3 || !q4 || !q5) allPassed = false;

    // 6. 50K PERFORMANCE
    console.log('\n[6/6] 50K PERFORMANCE CHECK');
    const t0 = Date.now(); await col.countDocuments(); const t1 = Date.now();
    const t2 = Date.now(); await col.find({ category: 'Electronics' }).sort({ lastUpdated: -1 }).limit(50).toArray(); const t3 = Date.now();
    console.log('  countDocuments():', (t1-t0) + 'ms', (t1-t0)<200 ? '[PASS]' : '[WARN]');
    console.log('  Paginated query:', (t3-t2) + 'ms', (t3-t2)<200 ? '[PASS]' : '[WARN]');

    console.log('\n====================================================');
    console.log('  DATABASE QUALITY GATE:', allPassed ? 'PASSED' : 'FAILED');
    console.log('====================================================\n');

    await mongoose.disconnect();
    process.exit(allPassed ? 0 : 1);
  } catch (err) {
    console.error('[FATAL]', err.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}
run();
