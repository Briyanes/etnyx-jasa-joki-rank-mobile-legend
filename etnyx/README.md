# ETNYX - Jasa Joki Mobile Legends

Platform jasa joki Mobile Legends dengan konsep SaaS-style dashboard. Modern, cepat, dan aman.

![ETNYX Preview](public/og-image.jpg)

## ✨ Features

- 🎮 **SaaS-style Dashboard** - UI/UX seperti aplikasi modern
- 🧮 **Real-time Calculator** - Hitung harga instant
- 📱 **Mobile First** - Responsive untuk semua device
- 🔒 **Secure** - Security headers, rate limiting, input sanitization
- 🚀 **Fast** - Optimized dengan Next.js 15
- 📊 **SEO Ready** - Meta tags lengkap untuk semua platform

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript
- **Database**: Supabase (optional)
- **Deployment**: Vercel

## 🚀 Quick Start

### Prerequisites

- Node.js 18.17 or later
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/etnyx.git
cd etnyx

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your values
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
# NEXT_PUBLIC_WHATSAPP_NUMBER=6281234567890
# NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.

## 📁 Project Structure

```
etnyx/
├── public/              # Static assets
│   ├── icons/          # PWA icons
│   ├── manifest.json   # PWA manifest
│   └── robots.txt      # SEO robots
├── src/
│   ├── app/            # Next.js App Router
│   │   ├── api/        # API routes
│   │   ├── layout.tsx  # Root layout with SEO
│   │   ├── page.tsx    # Home page
│   │   └── globals.css # Global styles
│   ├── components/     # React components
│   │   ├── layout/     # Navbar, Footer, etc
│   │   └── sections/   # Page sections
│   ├── lib/            # Utilities & constants
│   ├── types/          # TypeScript types
│   └── middleware.ts   # Security middleware
├── .env.example        # Environment template
└── next.config.ts      # Next.js config with security headers
```

## 🔒 Security Features

- **CSP Headers** - Content Security Policy
- **Rate Limiting** - 100 requests/minute per IP
- **Input Sanitization** - DOMPurify for XSS prevention
- **Suspicious Pattern Blocking** - SQL injection, path traversal
- **Security Headers** - HSTS, X-Frame-Options, etc

## 📦 Deployment to Vercel

### Option 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option 2: Git Integration (Recommended)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables
5. Deploy!

### Environment Variables for Vercel

Add these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | WhatsApp number (62xxx) |
| `NEXT_PUBLIC_SITE_URL` | Your production URL |

## 🗃️ Supabase Setup (Optional)

1. Create project at [supabase.com](https://supabase.com)
2. Get URL and anon key from Settings → API
3. Add to environment variables

### Database Schema (if needed)

```sql
-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT UNIQUE NOT NULL,
  username TEXT,
  game_id TEXT,
  current_rank TEXT NOT NULL,
  target_rank TEXT NOT NULL,
  package TEXT NOT NULL,
  price INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
```

## 🎨 Customization

### Colors (in globals.css)

```css
:root {
  --primary: #7FA8A3;    /* Main brand color */
  --accent: #2DD4BF;     /* Accent/highlight */
  --background: #0F1419; /* Dark background */
  --surface: #151B22;    /* Card background */
  --text: #E6F1EF;       /* Main text */
}
```

### WhatsApp Number

Edit in `.env.local`:
```
NEXT_PUBLIC_WHATSAPP_NUMBER=628123456789
```

## 📊 SEO Checklist

- [x] Meta title & description
- [x] Open Graph tags
- [x] Twitter Card tags
- [x] Schema.org JSON-LD
- [x] Sitemap.xml
- [x] Robots.txt
- [x] Canonical URLs
- [x] Mobile viewport

## 🧪 Testing

```bash
# Run ESLint
npm run lint

# Type check
npx tsc --noEmit

# Build production
npm run build
```

## 📝 License

MIT License - feel free to use for your own projects!

## 🤝 Support

WhatsApp: +62 812-3456-7890

---

Made with ❤️ by ETNYX Team
