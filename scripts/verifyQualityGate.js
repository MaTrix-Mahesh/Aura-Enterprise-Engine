import { connectDB, disconnectDB } from '../backend/src/config/db.js';
import { Product } from '../backend/src/models/Product.js';

async function verifyGate() {
  await connectDB();
  const count = await Product.countDocuments();
  const skus = (await Product.aggregate([{ $group: { _id: '$sku' } }, { $count: 'c' }]))[0]?.c;
  
  // Test IXSCAN on SKU
  const explainSku = await Product.find({ sku: 'AURA-000001' }).explain('executionStats');
  const skuStage = explainSku.executionStats.executionStages.stage;
  const skuDocsExamined = explainSku.executionStats.totalDocsExamined;

  // Test IXSCAN on compound index { category: 1, stockQuantity: 1 }
  const explainCompound = await Product.find({ category: 'Industrial Automation', stockQuantity: { $gt: 50 } })
    .limit(50)
    .explain('executionStats');
  const compStage = explainCompound.executionStats.executionStages.stage;

  console.log('=== DATABASE QUALITY GATE RESULTS ===');
  console.log('Total Documents:', count);
  console.log('Unique SKUs:    ', skus);
  console.log('SKU Query Stage:', skuStage, '(Docs examined:', skuDocsExamined, ')');
  console.log('Compound Query: ', compStage);
  
  await disconnectDB();
  if (count === 50000 && skus === 50000) {
    console.log('>>> DATABASE QUALITY GATE PASSED <<<');
    process.exit(0);
  } else {
    console.error('>>> DATABASE QUALITY GATE FAILED <<<');
    process.exit(1);
  }
}

verifyGate().catch((err) => {
  console.error(err);
  process.exit(1);
});
