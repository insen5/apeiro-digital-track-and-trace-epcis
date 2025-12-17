'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/SearchableSelect';
import { manufacturerApi, Batch } from '@/lib/api/manufacturer';
import { regulatorApi, Product } from '@/lib/api/regulator';
import { Plus, X, Trash2 } from 'lucide-react';

export interface ProductEntry {
  productId: number;
  batchId: number;
  qty: number;
}

interface ProductEntryProps {
  value?: ProductEntry[];
  onChange: (products: ProductEntry[]) => void;
  error?: string;
}

export const ProductEntry: React.FC<ProductEntryProps> = ({
  value = [],
  onChange,
  error,
}) => {
  const [products, setProducts] = useState<ProductEntry[]>(value);
  const [productOptions, setProductOptions] = useState<SearchableSelectOption[]>([]);
  const [batches, setBatches] = useState<Record<number, Batch[]>>({});
  const [batchOptions, setBatchOptions] = useState<Record<number, SearchableSelectOption[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    onChange(products);
  }, [products, onChange]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const products = await regulatorApi.products.getAll();
      const options: SearchableSelectOption[] = products.map((product: Product) => ({
        value: product.id,
        label: `${product.productName} (${product.brandName})`,
        subtitle: `GTIN: ${product.gtin}`,
      }));
      setProductOptions(options);
    } catch (err) {
      console.error('Failed to load products:', err);
      setProductOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBatchesForProduct = async (productId: number) => {
    try {
      const allBatches = await manufacturerApi.batches.getAll();
      const productBatches = allBatches.filter(b => b.productId === productId);
      setBatches(prev => ({ ...prev, [productId]: productBatches }));
      
      const options: SearchableSelectOption[] = productBatches.map(batch => ({
        value: batch.id,
        label: `${batch.batchno} (Exp: ${new Date(batch.expiry).toLocaleDateString()}, Available: ${batch.qty - batch.sentQty})`,
        subtitle: `Batch #${batch.batchno} - ${batch.qty - batch.sentQty} units available`,
      }));
      setBatchOptions(prev => ({ ...prev, [productId]: options }));
    } catch (err) {
      console.error('Failed to load batches:', err);
    }
  };

  const addProduct = () => {
    setProducts([...products, { productId: 0, batchId: 0, qty: 0 }]);
  };

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, field: keyof ProductEntry, value: number) => {
    const updated = [...products];
    updated[index] = { ...updated[index], [field]: value };
    
    // When product changes, load batches and reset batch/qty
    if (field === 'productId' && value) {
      loadBatchesForProduct(value);
      updated[index] = { ...updated[index], batchId: 0, qty: 0 };
    }
    
    setProducts(updated);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-foreground">
          Products <span className="text-destructive">*</span>
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addProduct}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">No products added yet</p>
          <p className="text-xs text-muted-foreground">Click "Add Product" to start adding products to this case</p>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Product #{index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeProduct(index)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <SearchableSelect
                    label="Product"
                    options={productOptions}
                    value={product.productId || undefined}
                    onChange={(val) => updateProduct(index, 'productId', Number(val) || 0)}
                    placeholder="Select product"
                    loading={loading}
                    required
                  />
                </div>

                <div>
                  <SearchableSelect
                    label="Batch"
                    options={batchOptions[product.productId] || []}
                    value={product.batchId || undefined}
                    onChange={(val) => updateProduct(index, 'batchId', Number(val) || 0)}
                    placeholder={product.productId ? "Select batch" : "Select product first"}
                    disabled={!product.productId}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Quantity <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={product.qty || ''}
                    onChange={(e) => updateProduct(index, 'qty', parseInt(e.target.value) || 0)}
                    placeholder="Enter quantity"
                    disabled={!product.batchId}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
};

