# WorkOrderWizard 🧙‍♂️

A full-stack work order management system built for YMCA facilities. Manage maintenance tasks, track progress, and send notifications with style!

## 🚀 Features

- **Work Order Management**: Create, update, and track maintenance work orders
- **User Authentication**: Firebase Auth integration with role-based access
- **Real-time Notifications**: SMS notifications via Twilio
- **Shopify Integration**: Sync work orders with Shopify orders
- **Modern UI**: Built with Next.js, Tailwind CSS, and Shadcn UI
- **Responsive Design**: Works perfectly on desktop and mobile

## 🏗️ Tech Stack

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Shadcn UI** for components
- **TanStack Query** for data fetching
- **React Hook Form** with Zod validation
- **Firebase Auth** for authentication

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Prisma** ORM with PostgreSQL
- **Firebase Admin SDK** for auth
- **Twilio** for SMS notifications
- **Shopify API** for order integration
- **Zod** for request validation

## 📦 Project Structure

```
WorkOrderWizard/
├── frontend/                 # Next.js frontend
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts
│   │   └── lib/            # Utilities
│   └── package.json
├── backend/                 # Express backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # External service integrations
│   │   ├── middleware/     # Express middleware
│   │   └── schemas/        # Validation schemas
│   ├── prisma/             # Database schema and migrations
│   └── package.json
└── .windsurf/              # Windsurf workflows
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+
- pnpm package manager
- PostgreSQL database
- Firebase project
- Twilio account
- Shopify store (optional)

### 1. Clone and Install
```bash
git clone <repository-url>
cd WorkOrderWizard

# Install backend dependencies
cd backend && pnpm install

# Install frontend dependencies
cd ../frontend && pnpm install
```

### 2. Environment Setup

#### Backend (.env)
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/workorderwizard"
JWT_SECRET="supersecretjwtkey123"
TWILIO_SID="your_twilio_sid"
TWILIO_AUTH_TOKEN="your_twilio_auth_token"
TWILIO_PHONE_NUMBER="+1234567890"
FIREBASE_CONFIG='{"apiKey":"...","authDomain":"...","projectId":"..."}'
SHOPIFY_ADMIN_API_TOKEN="your_shopify_token"
SHOPIFY_API_KEY="your_shopify_key"
SHOPIFY_API_SECRET="your_shopify_secret"
```

#### Frontend (.env)
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

### 3. Database Setup
```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npx prisma db seed
```

### 4. Start Development Servers

#### Backend
```bash
cd backend
pnpm dev
# Server runs on http://localhost:3001
```

#### Frontend
```bash
cd frontend
pnpm dev
# App runs on http://localhost:3000
```

## 📋 API Endpoints

### Authentication
- `POST /api/auth/login` - Firebase login
- `GET /api/auth/me` - Get current user

### Work Orders
- `GET /api/work-orders` - List work orders (with filters)
- `GET /api/work-orders/:id` - Get work order details
- `POST /api/work-orders` - Create work order (admin only)
- `PATCH /api/work-orders/:id` - Update work order

### Users
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user details

### Notifications
- `POST /api/notifications` - Send SMS notification

## 🔧 Usage

### Creating Work Orders
1. Log in as an admin user
2. Click "Create Work Order" on the dashboard
3. Fill in title, description, and optional Shopify order ID
4. Submit to create and automatically notify assigned users

### Managing Work Orders
- View all work orders on the dashboard
- Filter by status (Open, In Progress, Completed)
- Click on any work order to view details and activity logs
- Update status and details as needed
- Send SMS notifications for updates

### User Roles
- **Admin**: Can create, update, and manage all work orders
- **Worker**: Can view and update assigned work orders

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (SSH Server)
1. SSH to your server: `ssh root@your-server-ip`
2. Clone repository and install dependencies
3. Set up environment variables
4. Use PM2 or similar for process management
5. Set up reverse proxy with Nginx

### Workflow Automation
Use the Windsurf workflow for automated deployment:
```bash
/build-and-deploy
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
pnpm test
```

### Frontend Tests
```bash
cd frontend
pnpm test
```

## 📱 Features in Detail

### SMS Notifications
- Automatic notifications when work orders are created or updated
- Manual notification sending from work order details
- Configurable phone numbers and message templates

### Shopify Integration
- Link work orders to Shopify orders
- Sync order details and customer information
- Track maintenance related to specific purchases

### Activity Logging
- Complete audit trail of all work order changes
- Timestamped activity logs with user attribution
- Searchable and filterable history

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the GitHub issues
- Review the API documentation
- Contact the development team

---

Built with ❤️ for YMCA facility management
