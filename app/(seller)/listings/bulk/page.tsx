'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

interface BulkProduct {
  title: string;
  description: string;
  price: number;
  category: string;
  subcategory: string;
  condition: string;
  size?: string;
  brand?: string;
  images: string[];
  delivery_method: string;
  meetup_location?: string;
  shipping_cost?: number;
  status?: string;
}

interface ValidationError {
  index: number;
  field: string;
  message: string;
}

export default function BulkUploadPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [userTier, setUserTier] = useState('free');
  const [jsonInput, setJsonInput] = useState('');
  const [products, setProducts] = useState<BulkProduct[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?returnTo=/listings/bulk');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) return;

      try {
        const response = await fetch('/api/subscriptions');
        if (response.ok) {
          const data = await response.json();
          const tier = data.plan?.tier_id || 'free';
          setUserTier(tier);
          setHasAccess(['growth', 'pro'].includes(tier));
        }
      } catch (error) {
        console.error('Error checking access:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [user]);

  const parseJsonInput = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const productsArray = Array.isArray(parsed) ? parsed : [parsed];
      setProducts(productsArray);
      setErrors([]);
      validateProducts(productsArray);
    } catch (error) {
      setErrors([{ index: -1, field: 'json', message: 'Invalid JSON format' }]);
      setProducts([]);
    }
  };

  const validateProducts = (prods: BulkProduct[]) => {
    const validationErrors: ValidationError[] = [];

    prods.forEach((product, index) => {
      if (!product.title || product.title.length < 5) {
        validationErrors.push({ index, field: 'title', message: 'Title must be at least 5 characters' });
      }
      if (!product.description || product.description.length < 20) {
        validationErrors.push({ index, field: 'description', message: 'Description must be at least 20 characters' });
      }
      if (!product.price || product.price <= 0) {
        validationErrors.push({ index, field: 'price', message: 'Price must be a positive number' });
      }
      if (!product.category) {
        validationErrors.push({ index, field: 'category', message: 'Category is required' });
      }
      if (!product.subcategory) {
        validationErrors.push({ index, field: 'subcategory', message: 'Subcategory is required' });
      }
      if (!product.condition) {
        validationErrors.push({ index, field: 'condition', message: 'Condition is required' });
      }
      if (!product.images || !Array.isArray(product.images) || product.images.length === 0) {
        validationErrors.push({ index, field: 'images', message: 'At least one image URL is required' });
      }
      if (!product.delivery_method) {
        validationErrors.push({ index, field: 'delivery_method', message: 'Delivery method is required' });
      }
    });

    setErrors(validationErrors);
    return validationErrors.length === 0;
  };

  const handleUpload = async () => {
    if (products.length === 0) {
      setErrors([{ index: -1, field: 'products', message: 'No products to upload' }]);
      return;
    }

    if (!validateProducts(products)) {
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      const response = await fetch('/api/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products }),
      });

      const data = await response.json();

      if (response.ok) {
        setUploadResult({
          success: true,
          message: data.message || `Successfully uploaded ${data.count} products`,
          count: data.count,
        });
        setProducts([]);
        setJsonInput('');
      } else {
        setUploadResult({
          success: false,
          message: data.error || 'Failed to upload products',
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({
        success: false,
        message: 'An error occurred while uploading',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const loadTemplate = () => {
    const template = [
      {
        title: 'Example Product Title Here',
        description: 'This is an example description. Make sure it is at least 20 characters long and describes your product well.',
        price: 1500,
        category: 'clothing',
        subcategory: 'Tops',
        condition: 'like_new',
        size: 'M',
        brand: 'Zara',
        images: ['https://your-image-url.com/image1.jpg'],
        delivery_method: 'both',
        meetup_location: 'Nairobi CBD',
        shipping_cost: 150,
        status: 'active',
      },
    ];
    setJsonInput(JSON.stringify(template, null, 2));
  };

  if (authLoading || !user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Bulk Upload Requires Growth Plan</h2>
              <p className="text-gray-600 mb-6">
                You're currently on the <span className="font-semibold capitalize">{userTier}</span> plan.
                Upgrade to Growth or Pro to access bulk upload tools.
              </p>
              <div className="flex justify-center gap-3">
                <Link href="/plan">
                  <Button variant="primary">Upgrade Now</Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline">Back to Dashboard</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bulk Upload</h1>
            <p className="text-gray-600">Upload multiple products at once using JSON format</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        {/* Success/Error Message */}
        {uploadResult && (
          <div className={`mb-6 p-4 rounded-lg ${uploadResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-2">
              {uploadResult.success ? (
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className={uploadResult.success ? 'text-green-700' : 'text-red-700'}>
                {uploadResult.message}
              </span>
            </div>
          </div>
        )}

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">JSON Input</h2>
              <Button variant="outline" size="sm" onClick={loadTemplate}>
                Load Template
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='Paste your JSON array of products here...\n\n[\n  {\n    "title": "Product Name",\n    "description": "Product description...",\n    ...\n  }\n]'
              className="w-full h-64 p-4 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <div className="flex items-center gap-3 mt-4">
              <Button onClick={parseJsonInput} variant="outline">
                Validate JSON
              </Button>
              <span className="text-sm text-gray-500">
                {products.length > 0 ? `${products.length} product(s) ready` : 'Paste JSON and click Validate'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Validation Errors */}
        {errors.length > 0 && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardHeader>
              <h2 className="text-lg font-semibold text-red-700">Validation Errors</h2>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-red-600">
                {errors.map((error, idx) => (
                  <li key={idx}>
                    {error.index >= 0 ? `Product ${error.index + 1}: ` : ''}{error.field}: {error.message}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Products Preview */}
        {products.length > 0 && errors.length === 0 && (
          <Card className="mb-6">
            <CardHeader>
              <h2 className="text-lg font-semibold">Products Preview ({products.length})</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {products.map((product, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded flex-shrink-0">
                        {product.images?.[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={product.images[0]} 
                            alt={product.title}
                            className="w-full h-full object-cover rounded"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{product.title}</h3>
                        <p className="text-sm text-gray-500">
                          {product.category} • {product.subcategory} • KSh {product.price.toLocaleString()}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        product.status === 'draft' ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {product.status || 'active'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Button */}
        {products.length > 0 && errors.length === 0 && (
          <div className="flex justify-end">
            <Button
              variant="primary"
              size="lg"
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Uploading...
                </span>
              ) : (
                `Upload ${products.length} Product${products.length > 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        )}

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <h2 className="text-lg font-semibold">How to Use Bulk Upload</h2>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <ol className="list-decimal pl-5 space-y-2 text-gray-600">
              <li>Click "Load Template" to see the required JSON format</li>
              <li>Prepare your products as a JSON array with all required fields</li>
              <li>Required fields: title, description, price, category, subcategory, condition, images, delivery_method</li>
              <li>Paste your JSON and click "Validate JSON" to check for errors</li>
              <li>Review the preview and click "Upload" to create all products</li>
            </ol>
            <p className="mt-4 text-gray-500 text-sm">
              Maximum 50 products per batch. Images must be valid URLs (upload images to a hosting service first).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
