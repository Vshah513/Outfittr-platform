# Kenya Thrift Marketplace

A modern Progressive Web App (PWA) for buying and selling quality clothing in Kenya, built with Next.js 14, Supabase, and Tailwind CSS.

## 🚀 Features

### For Buyers
- 🔍 **Smart Marketplace** - Browse with advanced filters (category, price, location, condition)
- 💬 **Direct Messaging** - Chat with sellers in real-time
- ⭐ **Seller Reviews** - Read reviews and ratings from other buyers
- 📱 **Mobile-First** - Installable PWA works on all devices
- 🔐 **Phone Auth** - Simple OTP-based authentication with Kenya numbers

### For Sellers
- 📸 **Easy Listings** - Upload up to 5 images per product
- 📊 **Dashboard** - Track views, messages, and earnings
- 🚚 **Flexible Delivery** - Offer meet-up, shipping, or both
- 💰 **Pricing Control** - Set your own prices and manage inventory

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Phone OTP via Africa's Talking
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **Storage**: Supabase Storage

## 📋 Prerequisites

- Node.js 18+ installed
- Supabase account ([sign up here](https://supabase.com))
- Africa's Talking account (optional for SMS, [sign up here](https://africastalking.com))

## 🏁 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd gwf
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migration files:
   - Copy contents of `supabase/migrations/001_initial_schema.sql`
   - Run it in the SQL Editor
   - Then run `supabase/migrations/002_functions.sql`

3. Set up Storage bucket:
   - Go to Storage in Supabase dashboard
   - Create a new bucket named `product-images` (make it public)
   - Apply the storage policies from `DATABASE_SETUP.md`

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Copy from .env.example
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Africa's Talking (Optional for MVP)
AFRICA_TALKING_API_KEY=your-api-key
AFRICA_TALKING_USERNAME=your-username

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=your-random-secret-key
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add all environment variables from `.env.local`
4. Deploy!

Vercel will automatically:
- Build your Next.js app
- Set up HTTPS
- Enable PWA functionality
- Create preview deployments for PRs

### Post-Deployment Setup

1. **Update Environment Variables**:
   - Set `NEXT_PUBLIC_APP_URL` to your production URL
   - Ensure all Supabase keys are correct

2. **Configure Domain** (Optional):
   - Add your custom domain in Vercel settings
   - Update Supabase allowed URLs

3. **Test PWA Installation**:
   - Visit your site on mobile
   - Look for "Add to Home Screen" prompt
   - Test offline functionality

## 🧪 Testing

### Manual Testing Checklist

- [ ] Phone authentication with Kenya number (+254...)
- [ ] Create product listing with images
- [ ] Browse marketplace with filters
- [ ] Product detail view
- [ ] Send message to seller
- [ ] Leave review for seller
- [ ] PWA installation on mobile
- [ ] Offline mode (basic functionality)

### Development OTP

In development mode, the OTP is printed to console and returned in the API response for easy testing.

## 📱 PWA Features

The app includes:
- ✅ Service Worker for offline support
- ✅ Web App Manifest
- ✅ Installable on iOS and Android
- ✅ App icons and splash screens
- ✅ Standalone display mode

To test PWA locally:
```bash
npm run build
npm start
```

## 🔧 Project Structure

```
gwf/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication routes
│   ├── (buyer)/             # Buyer-specific routes
│   ├── (seller)/            # Seller-specific routes
│   └── api/                 # API routes
├── components/              # React components
│   ├── ui/                  # Reusable UI components
│   ├── filters/             # Filter components
│   ├── products/            # Product components
│   ├── messaging/           # Messaging components
│   └── layout/              # Layout components
├── lib/                     # Utility functions
├── types/                   # TypeScript types
├── public/                  # Static assets
└── supabase/               # Database migrations
```

## 📚 Documentation

- [Database Setup Guide](DATABASE_SETUP.md) - Complete database configuration
- [API Documentation](#) - API endpoints reference (TODO)
- [Component Guide](#) - Component usage examples (TODO)

## 🐛 Known Issues & Limitations

### MVP Limitations
- Payment integration not included (buyers/sellers exchange M-Pesa details)
- Basic messaging (no image sharing yet)
- No push notifications (Phase 2)
- File uploads use local storage (will move to Supabase Storage in production)

### Development Notes
- OTP verification uses mock in development
- Image optimization needs production CDN
- Real-time messaging uses polling (consider Supabase Realtime subscriptions)

## 🚧 Roadmap

### Phase 2 Features
- [ ] M-Pesa payment integration
- [ ] Push notifications
- [ ] Advanced search with AI
- [ ] Follow sellers
- [ ] Wishlist/Saved items
- [ ] Shipping provider integrations (Sendy, Glovo)
- [ ] Seller verification badges
- [ ] Promoted listings (monetization)

## 🤝 Contributing

This is a private project. For suggestions or issues, please contact the team.

## 📄 License

Proprietary - All rights reserved

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Supabase](https://supabase.com)
- SMS via [Africa's Talking](https://africastalking.com)
- Deployed on [Vercel](https://vercel.com)

## 📞 Support

For questions or support:
- Email: support@thriftke.com (update with actual email)
- Documentation: [DATABASE_SETUP.md](DATABASE_SETUP.md)

---

**Made with ❤️ for the Kenya thrift community**
