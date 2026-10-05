import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Product Mongoose Schema for Aura Enterprise Engine.
 * Enforces field data types, boundary constraints, SKU uniqueness/uppercase normalization,
 * margin integrity, and automatic lastUpdated timestamp maintenance.
 */
const productSchema = new Schema(
  {
    productName: {
      type: String,
      required: [true, 'productName is required'],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'sku is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'category is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'price is required'],
      min: [0, 'price cannot be negative'],
    },
    cost: {
      type: Number,
      required: [true, 'cost is required'],
      min: [0, 'cost cannot be negative'],
    },
    stockQuantity: {
      type: Number,
      required: [true, 'stockQuantity is required'],
      min: [0, 'stockQuantity cannot be negative'],
    },
    reorderLevel: {
      type: Number,
      required: [true, 'reorderLevel is required'],
      min: [0, 'reorderLevel cannot be negative'],
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

/**
 * Mandatory Database Indexes for Aura Enterprise Engine:
 * 1. { sku: 1 } (Unique, declared on sku field definition)
 * 2. { category: 1, stockQuantity: 1 } (Compound B-Tree for category & stock queries)
 * 3. { productName: "text", sku: "text" } (Compound text index for global search)
 * 4. { productName: 1 } (Standalone B-Tree for alphabetical sort & prefix matching)
 * 5. { price: 1 } (B-Tree for price range filters & sorting)
 * 6. { lastUpdated: -1 } (B-Tree for default chronological sort)
 */
productSchema.index({ category: 1, stockQuantity: 1 });
productSchema.index({ productName: 'text', sku: 'text' });
productSchema.index({ productName: 1 });
productSchema.index({ price: 1 });
productSchema.index({ lastUpdated: -1 });

/**
 * Document validation hook ensuring margin integrity (price >= cost).
 */
productSchema.pre('validate', function () {
  if (typeof this.price === 'number' && typeof this.cost === 'number') {
    if (this.price < this.cost) {
      this.invalidate('price', `Price (${this.price}) cannot be lower than cost (${this.cost})`);
    }
  }
});

/**
 * Pre-save middleware to automatically update lastUpdated timestamp on existing documents.
 */
productSchema.pre('save', function () {
  if (!this.isNew) {
    this.lastUpdated = new Date();
  }
});

/**
 * Pre-update middleware to automatically refresh lastUpdated timestamp on query updates.
 */
const updateTimestampHook = function () {
  const update = this.getUpdate();
  if (update) {
    if (update.$set) {
      update.$set.lastUpdated = new Date();
    } else {
      update.lastUpdated = new Date();
    }
  } else {
    this.set({ lastUpdated: new Date() });
  }
};

productSchema.pre('findOneAndUpdate', updateTimestampHook);
productSchema.pre('updateOne', updateTimestampHook);
productSchema.pre('updateMany', updateTimestampHook);

export const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export default Product;
