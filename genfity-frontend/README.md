# E-Commerce Backend API with Supabase

This project provides a backend API for an e-commerce application with user authentication, product management, and transaction processing using Supabase.

## Setup

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Set up your Supabase project and update the environment variables:
   \`\`\`
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   \`\`\`

3. Run the SQL script in `supabase/schema.sql` in your Supabase SQL editor to create the necessary tables and policies.

4. Run the seed script to populate your database with initial data:
   \`\`\`bash
   ts-node scripts/seed-supabase.ts
   \`\`\`

5. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## API Endpoints

### Authentication
- Authentication is handled by Supabase Auth
- The AuthContext component provides login, register, and logout functionality

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create a new product (admin only)
- `GET /api/products/:id` - Get product by ID
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

### Transactions
- `GET /api/transactions` - Get all transactions for current user
- `POST /api/transactions` - Create a new transaction
- `GET /api/transactions/:id` - Get transaction by ID
- `PATCH /api/transactions/:id` - Update transaction status

## Seeded Users

After running the seed script, you can use these accounts:

- Admin: admin@example.com / admin123
- User: user@example.com / user123
\`\`\`

Let's remove the MySQL-specific files:

```typescriptreact file="prisma/schema.prisma" isDeleted="true"
...deleted...
