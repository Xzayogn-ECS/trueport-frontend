# TruePortMe Frontend

A Next.js frontend application for verified digital portfolios. Users can create, manage, and verify their professional experiences with industry professionals.

## Features

- **Authentication**: Register/login with JWT-based authentication
- **Experience Management**: Create, edit, and manage professional experiences
- **File Upload**: Direct upload to Cloudinary for attachments
- **Verification System**: Request experience verification from mentors/employers
- **Public Portfolio**: Shareable portfolio with verified experiences
- **GitHub Integration**: Connect GitHub profile to showcase repositories
- **Responsive Design**: Mobile-first responsive UI with Tailwind CSS

## Tech Stack

- **Framework**: Next.js 15 with Pages Router
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **HTTP Client**: Axios
- **File Upload**: Cloudinary (unsigned upload)
- **Authentication**: JWT with js-cookie
- **Deployment**: Vercel-ready

## Project Structure

```
├── pages/                 # Next.js pages
│   ├── api/              # API routes (placeholder)
│   ├── auth/             # Authentication pages
│   ├── experiences/      # Experience management
│   ├── verify/           # Verification system
│   ├── portfolio/        # Public portfolios
│   ├── github/           # GitHub integration
│   └── ...
├── components/           # Reusable React components
├── utils/               # Utility functions
├── styles/              # Global styles
└── public/              # Static assets
```

## Environment Variables

Create a `.env.local` file with the following variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_CLOUDINARY_CLOUD=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3001
```

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3001](http://localhost:3001)

## Available Scripts

- `npm run dev` - Start development server on port 3001
- `npm run build` - Build production application
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Key Components

### Authentication
- `AuthForm` - Shared login/register component
- `ProtectedRoute` - HOC for protecting routes

### Experience Management
- `ExperienceCard` - Display experience with verification status
- `ExperienceForm` - Create/edit experiences
- `Uploader` - Cloudinary file upload component

### Verification System
- `VerificationModal` - Request verification from verifiers
- `VerifierPanel` - Approve/reject verification requests

### UI Components
- `Navbar` - Navigation with auth state
- `Toast` - Notification system
- `Pagination` - List pagination

## API Integration

The frontend expects a REST API with the following endpoints:

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### User Management
- `GET /users/me` - Get current user
- `PUT /users/me` - Update user profile

### Experiences
- `GET /experiences` - List user experiences (with filters)
- `POST /experiences` - Create new experience
- `GET /experiences/:id` - Get single experience

### Verification
- `POST /verify/request/:experienceId` - Request verification
- `GET /verify/:token` - Get verification details
- `POST /verify/:token/approve` - Approve verification
- `POST /verify/:token/reject` - Reject verification

### Portfolio
- `GET /portfolio/:userId` - Get public portfolio

### GitHub Integration
- `GET /github/public/:username` - Get public repositories

## Deployment

### Vercel (Recommended)

1. **Connect your GitHub repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

### Manual Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start the production server**:
   ```bash
   npm start
   ```

## Demo Flow

1. **Register** a new account or **login**
2. **Complete profile** with GitHub username (optional)
3. **Add experience** with file attachments
4. **Request verification** by entering verifier email
5. **Verifier opens link** and approves/rejects
6. **Share portfolio** link with verified experiences

## File Upload Configuration

### Cloudinary Setup

1. **Create Cloudinary account**
2. **Create unsigned upload preset**:
   - Go to Settings > Upload
   - Add Upload Preset
   - Set to "Unsigned"
   - Configure allowed formats: jpg, png, pdf
   - Set file size limit: 10MB

3. **Update environment variables** with your cloud name and preset

## Customization

### Styling
- Modify `tailwind.config.js` for design system changes
- Update `styles/globals.css` for custom styles
- Component styles use Tailwind utility classes

### API Configuration
- Update `utils/api.js` for different backend configurations
- Modify base URL and timeout settings
- Add custom interceptors

### Features
- Add new pages in `pages/` directory
- Create reusable components in `components/`
- Extend utilities in `utils/` folder

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support, please open an issue in the GitHub repository or contact the development team.