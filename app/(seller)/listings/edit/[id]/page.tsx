'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ImageUploadZone from '@/components/listings/ImageUploadZone';
import { VintageInput } from '@/components/listings/VintageInput';
import { VintageSelect } from '@/components/listings/VintageSelect';
import { VintageTextarea } from '@/components/listings/VintageTextarea';
import BrandAutocomplete from '@/components/listings/BrandAutocomplete';
import SizeSelector from '@/components/listings/SizeSelector';
import StepIndicator from '@/components/listings/StepIndicator';
import ListingPreview from '@/components/listings/ListingPreview';
import { NAIROBI_AREAS, OTHER_CITIES } from '@/lib/locations';

// Subcategories for each main category
const SUBCATEGORIES: Record<string, string[]> = {
  mens: ['T-Shirts', 'Shirts', 'Trousers', 'Jeans', 'Shorts', 'Jackets', 'Suits', 'Sweaters', 'Hoodies'],
  womens: ['Dresses', 'Tops', 'Blouses', 'Skirts', 'Trousers', 'Jeans', 'Jackets', 'Sweaters', 'Jumpsuits'],
  kids: ['Boys Clothing', 'Girls Clothing', 'Baby Clothing', 'School Uniforms', 'Jackets', 'Shoes'],
  sports: ['Activewear', 'Sneakers', 'Jerseys', 'Tracksuits', 'Sports Bras', 'Shorts'],
  clothing: ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Suits', 'Activewear'],
  shoes: ['Sneakers', 'Heels', 'Boots', 'Sandals', 'Flats', 'Loafers', 'Sports Shoes'],
  accessories: ['Watches', 'Jewelry', 'Belts', 'Hats', 'Scarves', 'Sunglasses', 'Wallets'],
  bags: ['Handbags', 'Backpacks', 'Clutches', 'Totes', 'Crossbody', 'Duffel Bags'],
  vintage: ['70s', '80s', '90s', 'Y2K', 'Designer Vintage', 'Retro'],
};

const CONDITION_HELPER_TEXT: Record<string, string> = {
  brand_new: 'Brand new with tags, never worn',
  like_new: 'Worn once or twice, no visible wear',
  excellent: 'Excellent condition, barely worn',
  good: 'Gently used, minor signs of wear',
  fair: 'Well-used with noticeable wear or flaws',
};

const STEPS = [
  { number: 1, title: 'Photos', description: 'Upload your best shots' },
  { number: 2, title: 'Details', description: 'Describe your item' },
  { number: 3, title: 'Delivery', description: 'Set your options' },
];

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const { user, isLoading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isDraft, setIsDraft] = useState(false);

  // Protect this page - require authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?returnTo=/dashboard');
    }
  }, [user, authLoading, router]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'mens',
    subcategory: '',
    size: '',
    condition: 'brand_new',
    brand: '',
    delivery_method: 'both',
    meetup_location: '',
    shipping_cost: '',
    status: 'active',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Fetch existing product data
  useEffect(() => {
    if (user && productId) {
      fetchProductData();
    }
  }, [user, productId]);

  const fetchProductData = async () => {
    setIsFetching(true);
    try {
      const response = await fetch(`/api/products/${productId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch product');
      }

      const product = data.data;

      // Verify ownership
      if (product.seller_id !== user?.id) {
        setError('You do not have permission to edit this listing');
        setTimeout(() => router.push('/dashboard'), 2000);
        return;
      }

      // Populate form with existing data
      setFormData({
        title: product.title || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        category: product.category || 'mens',
        subcategory: product.subcategory || '',
        size: product.size || '',
        condition: product.condition || 'brand_new',
        brand: product.brand || '',
        delivery_method: product.delivery_method || 'both',
        meetup_location: product.meetup_location || '',
        shipping_cost: product.shipping_cost?.toString() || '',
        status: product.status || 'active',
      });

      // Set existing images
      if (product.images && product.images.length > 0) {
        setExistingImages(product.images);
        setImagePreviews(product.images);
      }
    } catch (err: any) {
      console.error('Error fetching product:', err);
      setError(err.message || 'Failed to load product data');
    } finally {
      setIsFetching(false);
    }
  };

  // Handle image changes
  const handleImageChange = (files: File[]) => {
    if (files.length + imagePreviews.length > 5) {
      setValidationErrors({ ...validationErrors, images: 'Maximum 5 images allowed' });
      return;
    }

    setImageFiles([...imageFiles, ...files]);

    // Generate previews for new files
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Clear error
    if (validationErrors.images) {
      const newErrors = { ...validationErrors };
      delete newErrors.images;
      setValidationErrors(newErrors);
    }
  };

  const removeImage = (index: number) => {
    // Remove from both existing and new images
    const removedUrl = imagePreviews[index];
    
    // Remove from existing images if it's an existing image
    if (existingImages.includes(removedUrl)) {
      setExistingImages(existingImages.filter(img => img !== removedUrl));
    }
    
    // Remove from new image files if it's a new upload
    const fileIndex = imagePreviews.indexOf(removedUrl) - existingImages.length;
    if (fileIndex >= 0) {
      setImageFiles(imageFiles.filter((_, i) => i !== fileIndex));
    }

    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const reorderImages = (fromIndex: number, toIndex: number) => {
    const newPreviews = [...imagePreviews];
    const [moved] = newPreviews.splice(fromIndex, 1);
    newPreviews.splice(toIndex, 0, moved);
    setImagePreviews(newPreviews);
  };

  // Validation functions
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (imagePreviews.length === 0) {
        errors.images = 'At least one photo is required';
      }
    }

    if (step === 2) {
      if (!formData.title.trim()) {
        errors.title = 'Title is required';
      } else if (formData.title.length < 5) {
        errors.title = 'Title must be at least 5 characters';
      } else if (formData.title.length > 80) {
        errors.title = 'Title must be less than 80 characters';
      }

      if (!formData.description.trim()) {
        errors.description = 'Description is required';
      } else if (formData.description.length < 20) {
        errors.description = 'Description must be at least 20 characters';
      } else if (formData.description.length > 1000) {
        errors.description = 'Description must be less than 1000 characters';
      }

      if (!formData.price || parseFloat(formData.price) <= 0) {
        errors.price = 'Valid price is required';
      }

      if (!formData.category) {
        errors.category = 'Category is required';
      }

      if (!formData.subcategory) {
        errors.subcategory = 'Subcategory is required';
      }

      if (!formData.condition) {
        errors.condition = 'Condition is required';
      }
    }

    if (step === 3) {
      if (!formData.delivery_method) {
        errors.delivery_method = 'Delivery method is required';
      }

      if ((formData.delivery_method === 'pickup' || formData.delivery_method === 'both') 
          && !formData.meetup_location) {
        errors.meetup_location = 'Pickup location is required';
      }

      if ((formData.delivery_method === 'shipping' || formData.delivery_method === 'both') 
          && (!formData.shipping_cost || parseFloat(formData.shipping_cost) < 0)) {
        errors.shipping_cost = 'Shipping cost is required';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const canProceedToNext = (): boolean => {
    if (currentStep === 1) return imagePreviews.length > 0;
    if (currentStep === 2) return !!(formData.title && formData.description && formData.price && formData.category && formData.subcategory);
    if (currentStep === 3) return !!formData.delivery_method;
    return false;
  };

  const handleSubmit = async (saveAsDraft = false) => {
    // Validate all steps
    const allValid = validateStep(1) && validateStep(2) && validateStep(3);
    
    if (!allValid && !saveAsDraft) {
      setError('Please complete all required fields');
      return;
    }

    setError('');
    setIsLoading(true);
    setIsDraft(saveAsDraft);

    try {
      let finalImageUrls = [...existingImages];

      // Upload new images if any
      if (imageFiles.length > 0) {
        const imageFormData = new FormData();
        imageFiles.forEach(file => {
          imageFormData.append('files', file);
        });

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: imageFormData,
        });

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(uploadData.error || 'Failed to upload images');
        }

        // Combine existing and new images in the correct order
        finalImageUrls = imagePreviews.map(preview => {
          // If it's an existing image, use it
          if (existingImages.includes(preview)) {
            return preview;
          }
          // Otherwise, find the corresponding new upload
          const newIndex = imagePreviews.indexOf(preview) - existingImages.filter(img => imagePreviews.includes(img)).length;
          return uploadData.urls[newIndex] || preview;
        });
      } else {
        // No new images, use the reordered existing images
        finalImageUrls = imagePreviews;
      }

      // Images are already in the correct order - first image is always the cover

      const productPayload = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        shipping_cost: (formData.delivery_method === 'shipping' || formData.delivery_method === 'both') && formData.shipping_cost
          ? parseFloat(formData.shipping_cost)
          : undefined,
        meetup_location: (formData.delivery_method === 'pickup' || formData.delivery_method === 'both') && formData.meetup_location
          ? formData.meetup_location
          : undefined,
        images: finalImageUrls,
        status: saveAsDraft ? 'draft' : formData.status,
      };

      const productResponse = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productPayload),
      });

      let productData: { error?: string; data?: unknown } = {};
      try {
        const text = await productResponse.text();
        productData = text ? JSON.parse(text) : {};
      } catch {
        throw new Error('The server returned an invalid response. Please try again.');
      }

      if (!productResponse.ok) {
        throw new Error(productData.error || 'Failed to update listing');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsDraft(false);
    }
  };

  // Get subcategories for current category
  const subcategoryOptions = (SUBCATEGORIES[formData.category] || []).map(sub => ({
    value: sub,
    label: sub,
  }));

  // Location options
  const locationOptions = [
    { value: '', label: 'Select location...' },
    ...NAIROBI_AREAS.map(area => ({ value: area, label: area })),
    ...OTHER_CITIES.map(city => ({ value: city, label: city })),
  ];

  // Show loading state while checking authentication or fetching data
  if (authLoading || !user || isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-marketplace">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-marketplace pb-24">
      {/* Header */}
      <div className="bg-white border-b border-vintage">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-vintage-muted hover:text-vintage-primary transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="font-editorial text-3xl md:text-4xl font-medium text-vintage-primary">
                Edit Listing
              </h1>
              <p className="text-sm text-vintage-secondary mt-1">
                Update your item details
              </p>
            </div>
          </div>

          {/* Step Indicator */}
          <StepIndicator currentStep={currentStep} steps={STEPS} />
        </div>
      </div>

      {/* Global Error */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 mt-6">
          <div className="bg-red-50 border border-red-200 rounded-vintage p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError('')}
              className="text-red-600 hover:text-red-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Column */}
          <div className="col-span-1 lg:col-span-2">
            {/* Step 1: Photos */}
            {currentStep === 1 && (
              <div className="vintage-card p-6 sm:p-8 space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-medium text-vintage-primary flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Update Your Photos
                  </h2>
                  <p className="text-sm text-vintage-secondary">
                    Great photos are the key to a successful listing. Upload up to 5 images showing your item from different angles.
                  </p>
                </div>

                <div className="divider-vintage" />

                <ImageUploadZone
                  images={imagePreviews}
                  maxImages={5}
                  coverIndex={0}
                  onImagesChange={handleImageChange}
                  onRemove={removeImage}
                  onReorder={reorderImages}
                  onSetCover={() => {}}
                  error={validationErrors.images}
                />
              </div>
            )}

            {/* Step 2: Details */}
            {currentStep === 2 && (
              <div className="vintage-card p-6 sm:p-8 space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-medium text-vintage-primary flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Product Details
                  </h2>
                  <p className="text-sm text-vintage-secondary">
                    Provide accurate details to help buyers find and understand your item.
                  </p>
                </div>

                <div className="divider-vintage" />

                <div className="space-y-5">
                  {/* Title */}
                  <VintageInput
                    label="Title"
                    required
                    placeholder="e.g., Vintage Levi's 501 Jeans"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    error={validationErrors.title}
                    characterCount={{
                      current: formData.title.length,
                      max: 80,
                    }}
                  />

                  {/* Description */}
                  <VintageTextarea
                    label="Description"
                    required
                    rows={6}
                    placeholder="Describe your item in detail. Include the condition, any flaws, measurements, and styling tips..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    error={validationErrors.description}
                    helperText="Be honest and detailed - it builds trust"
                    characterCount={{
                      current: formData.description.length,
                      max: 1000,
                    }}
                  />

                  {/* Category & Subcategory */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <VintageSelect
                      label="Category"
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value, subcategory: '' })}
                      error={validationErrors.category}
                      options={[
                        { value: 'mens', label: "Men's" },
                        { value: 'womens', label: "Women's" },
                        { value: 'kids', label: 'Kids' },
                        { value: 'sports', label: 'Sports' },
                        { value: 'shoes', label: 'Shoes' },
                        { value: 'accessories', label: 'Accessories' },
                        { value: 'bags', label: 'Bags' },
                        { value: 'vintage', label: 'Vintage' },
                      ]}
                    />

                    {formData.category && subcategoryOptions.length > 0 && (
                      <VintageSelect
                        label="Subcategory"
                        required
                        value={formData.subcategory}
                        onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                        error={validationErrors.subcategory}
                        options={[
                          { value: '', label: 'Select subcategory...' },
                          ...subcategoryOptions,
                        ]}
                      />
                    )}
                  </div>

                  {/* Price & Condition */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <VintageInput
                      label="Price (KES)"
                      required
                      type="number"
                      placeholder="1000"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      error={validationErrors.price}
                      helperText="Set a fair price"
                    />

                    <VintageSelect
                      label="Condition"
                      required
                      value={formData.condition}
                      onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                      error={validationErrors.condition}
                      helperText={CONDITION_HELPER_TEXT[formData.condition]}
                      options={[
                        { value: 'brand_new', label: 'Brand New' },
                        { value: 'like_new', label: 'Like New' },
                        { value: 'excellent', label: 'Excellent' },
                        { value: 'good', label: 'Good' },
                        { value: 'fair', label: 'Fair' },
                      ]}
                    />
                  </div>

                  {/* Brand */}
                  <BrandAutocomplete
                    label="Brand"
                    value={formData.brand}
                    onChange={(value) => setFormData({ ...formData, brand: value })}
                    helperText="Optional but recommended"
                  />

                  {/* Size */}
                  <SizeSelector
                    label="Size"
                    value={formData.size}
                    onChange={(value) => setFormData({ ...formData, size: value })}
                    category={formData.category}
                    helperText="Select a preset or enter custom"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Delivery */}
            {currentStep === 3 && (
              <div className="vintage-card p-6 sm:p-8 space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-medium text-vintage-primary flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    Delivery Options
                  </h2>
                  <p className="text-sm text-vintage-secondary">
                    Choose how buyers can receive their purchase.
                  </p>
                </div>

                <div className="divider-vintage" />

                <div className="space-y-5">
                  {/* Delivery Method */}
                  <VintageSelect
                    label="Delivery Method"
                    required
                    value={formData.delivery_method}
                    onChange={(e) => setFormData({ ...formData, delivery_method: e.target.value })}
                    error={validationErrors.delivery_method}
                    helperText="Offering both options increases your chances of a sale"
                    options={[
                      { value: 'pickup', label: 'Pickup only' },
                      { value: 'shipping', label: 'Shipping only' },
                      { value: 'both', label: 'Both pickup and shipping' },
                    ]}
                  />

                  {/* Conditional: Pickup Location */}
                  {(formData.delivery_method === 'pickup' || formData.delivery_method === 'both') && (
                    <VintageSelect
                      label="Pickup Location"
                      required={formData.delivery_method === 'pickup' || formData.delivery_method === 'both'}
                      value={formData.meetup_location}
                      onChange={(e) => setFormData({ ...formData, meetup_location: e.target.value })}
                      error={validationErrors.meetup_location}
                      helperText="Choose your preferred pickup area"
                      options={locationOptions}
                    />
                  )}

                  {/* Conditional: Shipping Cost */}
                  {(formData.delivery_method === 'shipping' || formData.delivery_method === 'both') && (
                    <VintageInput
                      label="Shipping Cost (KES)"
                      required={formData.delivery_method === 'shipping' || formData.delivery_method === 'both'}
                      type="number"
                      placeholder="200"
                      value={formData.shipping_cost}
                      onChange={(e) => setFormData({ ...formData, shipping_cost: e.target.value })}
                      error={validationErrors.shipping_cost}
                      helperText="Typical Nairobi delivery: KES 200-400"
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Preview Column (Desktop Only) */}
          <div className="col-span-1 preview-column">
            <div className="sticky top-24">
              <ListingPreview
                title={formData.title}
                description={formData.description}
                price={formData.price}
                images={imagePreviews}
                coverIndex={0}
                category={formData.category}
                subcategory={formData.subcategory}
                size={formData.size}
                condition={formData.condition}
                brand={formData.brand}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-vintage shadow-lg z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Back/Cancel */}
            <div>
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-sm text-vintage-muted hover:text-vintage-primary transition-colors font-medium flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="text-sm text-vintage-muted hover:text-vintage-primary transition-colors font-medium"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              {/* Save Draft (only on final step) */}
              {currentStep === 3 && (
                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  disabled={isLoading}
                  className="hidden sm:block px-5 py-2.5 rounded-vintage font-medium text-sm transition-all duration-200 bg-vintage-cream hover:bg-vintage-stone text-vintage-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDraft && isLoading ? 'Saving...' : 'Save Draft'}
                </button>
              )}

              {/* Next / Update Listing */}
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceedToNext()}
                  className="px-6 py-2.5 rounded-vintage font-medium text-sm bg-vintage-primary text-white transition-all duration-200 hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Continue
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  disabled={isLoading || !canProceedToNext()}
                  className="px-6 py-2.5 rounded-vintage font-medium text-sm bg-vintage-primary text-white transition-all duration-200 hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading && !isDraft ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Updating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Update Listing
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

