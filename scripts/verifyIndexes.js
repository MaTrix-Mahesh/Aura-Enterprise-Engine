#!/usr/bin/env node

import { connectDB, disconnectDB } from '../backend/src/config/db.js';
import { Product } from '../backend/src/models/Product.js';

/**
 * CLI utility to synchronize and verify all mandatory database indexes
 * for the Product collection in Aura Enterprise Engine.
 */
async function verifyIndexes() {
  console.log('====================================================');
  console.log('  AURA ENTERPRISE ENGINE — DATABASE INDEX AUDIT    ');
  console.log('====================================================\n');

  let hasFailures = false;

  try {
    // 1. Establish database connection
    console.log('[1/4] Connecting to MongoDB...');
    await connectDB();

    // 2. Synchronize declared schema indexes with MongoDB
    console.log('[2/4] Synchronizing schema indexes with MongoDB collection...');
    await Product.syncIndexes();

    // 3. Inspect actual indexes from database
    console.log('[3/4] Querying Product.collection.indexes()...\n');
    const indexes = await Product.collection.indexes();

    console.log('Raw Database Indexes Found:');
    indexes.forEach((idx, i) => {
      const keysStr = JSON.stringify(idx.key);
      const uniqueStr = idx.unique ? ' [UNIQUE]' : '';
      console.log(`  (${i + 1}) Name: "${idx.name}", Keys: ${keysStr}${uniqueStr}`);
    });
    console.log('');

    // Index Verification Matrix
    // 1. SKU unique
    const skuIndex = indexes.find(
      (idx) => idx.key && idx.key.sku === 1 && idx.unique === true
    );
    if (skuIndex) {
      console.log('  [PASS] Index 1: { sku: 1 } [unique: true]');
    } else {
      console.error('  [FAIL] Index 1: { sku: 1 } [unique: true] NOT FOUND');
      hasFailures = true;
    }

    // 2. Compound { category: 1, stockQuantity: 1 }
    const catStockIndex = indexes.find(
      (idx) => idx.key && idx.key.category === 1 && idx.key.stockQuantity === 1
    );
    if (catStockIndex) {
      console.log('  [PASS] Index 2: { category: 1, stockQuantity: 1 }');
    } else {
      console.error('  [FAIL] Index 2: { category: 1, stockQuantity: 1 } NOT FOUND');
      hasFailures = true;
    }

    // 3. Text index on productName and sku
    // In MongoDB, text indexes have key: { _fts: 'text', _ftsx: 1 } with weights { productName: 1, sku: 1 }
    const textIndex = indexes.find((idx) => {
      if (idx.weights) {
        return idx.weights.productName !== undefined && idx.weights.sku !== undefined;
      }
      return idx.key && (idx.key.productName === 'text' || idx.key._fts === 'text');
    });
    if (textIndex) {
      console.log('  [PASS] Index 3: { productName: "text", sku: "text" } (Compound Text Index)');
    } else {
      console.error('  [FAIL] Index 3: { productName: "text", sku: "text" } NOT FOUND');
      hasFailures = true;
    }

    // 4. Standalone { productName: 1 }
    const productNameIndex = indexes.find(
      (idx) => idx.key && idx.key.productName === 1 && Object.keys(idx.key).length === 1
    );
    if (productNameIndex) {
      console.log('  [PASS] Index 4: { productName: 1 } (Standalone B-Tree)');
    } else {
      console.error('  [FAIL] Index 4: { productName: 1 } NOT FOUND');
      hasFailures = true;
    }

    // 5. Standalone { price: 1 }
    const priceIndex = indexes.find(
      (idx) => idx.key && idx.key.price === 1 && Object.keys(idx.key).length === 1
    );
    if (priceIndex) {
      console.log('  [PASS] Index 5: { price: 1 }');
    } else {
      console.error('  [FAIL] Index 5: { price: 1 } NOT FOUND');
      hasFailures = true;
    }

    // 6. Standalone { lastUpdated: -1 }
    const lastUpdatedIndex = indexes.find(
      (idx) => idx.key && idx.key.lastUpdated === -1 && Object.keys(idx.key).length === 1
    );
    if (lastUpdatedIndex) {
      console.log('  [PASS] Index 6: { lastUpdated: -1 }');
    } else {
      console.error('  [FAIL] Index 6: { lastUpdated: -1 } NOT FOUND');
      hasFailures = true;
    }

    // Duplicate Check
    const customIndexes = indexes.filter((idx) => idx.name !== '_id_');
    const keyFingerprints = customIndexes.map((idx) => JSON.stringify(idx.key));
    const uniqueFingerprints = new Set(keyFingerprints);
    if (keyFingerprints.length === uniqueFingerprints.size) {
      console.log('  [PASS] Duplicate Index Check: Zero duplicate key patterns detected');
    } else {
      console.warn('  [WARN] Duplicate Index Check: Possible duplicate index definitions detected');
    }

    // 4. Test actual database-level SKU uniqueness enforcement
    console.log('\n[4/4] Testing database-level SKU uniqueness constraint...');
    const testSku = `TEST-UNIQUE-${Date.now()}`;
    const docA = await Product.create({
      productName: 'Unique Constraint Probe Item A',
      sku: testSku,
      category: 'Diagnostic',
      price: 120,
      cost: 60,
      stockQuantity: 10,
      reorderLevel: 2,
    });

    let duplicateCaught = false;
    try {
      await Product.create({
        productName: 'Unique Constraint Probe Item B (Duplicate)',
        sku: testSku,
        category: 'Diagnostic',
        price: 130,
        cost: 65,
        stockQuantity: 5,
        reorderLevel: 1,
      });
    } catch (err) {
      if (err.code === 11000) {
        duplicateCaught = true;
      } else {
        console.error('Unexpected error during duplicate test:', err);
      }
    } finally {
      // Clean up test document
      await Product.deleteOne({ _id: docA._id });
    }

    if (duplicateCaught) {
      console.log('  [PASS] SKU Uniqueness Test: Duplicate SKU rejected with Mongo error code 11000');
    } else {
      console.error('  [FAIL] SKU Uniqueness Test: Duplicate SKU was NOT rejected');
      hasFailures = true;
    }

    console.log('\n====================================================');
    if (hasFailures) {
      console.error('  INDEX AUDIT FAILED — One or more indexes missing/invalid');
      console.log('====================================================\n');
      await disconnectDB();
      process.exit(1);
    } else {
      console.log('  INDEX AUDIT PASSED — All mandatory indexes verified');
      console.log('====================================================\n');
      await disconnectDB();
      process.exit(0);
    }
  } catch (error) {
    console.error(`[Index Audit Error] Fatal error: ${error.message}`);
    await disconnectDB().catch(() => {});
    process.exit(1);
  }
}

verifyIndexes();
