# Deployment Guide

This guide provides instructions for deploying the Interview Prep Board application to production environments.

## Prerequisites

- MongoDB Atlas account (or self-hosted MongoDB)
- GitHub account (for repository)
- Deployment platform account (Heroku, Render, Railway, Vercel, or Netlify)

## Backend Deployment

### Option 1: Heroku

1. **Create a Heroku account** and install Heroku CLI

2. **Create a new Heroku app:**
```bash
heroku create your-app-name
```

3. **Set environment variables:**
```bash
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_super_secret_jwt_key
heroku config:set NODE_ENV=production
heroku config:set FRONTEND_URL=https://your-frontend-url.com
```

4. **Create Procfile in backend root:**
```
web: node server.js
```

5. **Deploy:**
```bash
git push heroku main
```

### Option 2: Render

1. **Connect your GitHub repository to Render**

2. **Create a new Web Service:**
   - Select "Node" as the runtime
   - Set build command: `npm install`
   - Set start command: `npm start`

3. **Set environment variables in Render dashboard:**
   - MONGODB_URI
   - JWT_SECRET
   - NODE_ENV=production
   - FRONTEND_URL

4. **Deploy** - Render automatically deploys on git push

### Option 3: Railway

1. **Connect GitHub repository to Railway**

2. **Create a new project**

3. **Add environment variables:**
   - MONGODB_URI
   - JWT_SECRET
   - NODE_ENV=production
   - FRONTEND_URL

4. **Railway automatically detects Node.js and deploys**

## Frontend Deployment

### Option 1: Vercel

1. **Connect your GitHub repository to Vercel**

2. **Configure build settings:**
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Set environment variables:**
   - VITE_API_URL=https://your-backend-api-url

4. **Deploy** - Vercel automatically deploys on git push

### Option 2: Netlify

1. **Connect your GitHub repository to Netlify**

2. **Configure build settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Set environment variables:**
   - VITE_API_URL=https://your-backend-api-url

4. **Add redirect for SPA:**
   - Create `_redirects` file in `public/`:
   ```
   /* /index.html 200
   ```

5. **Deploy** - Netlify automatically deploys on git push

## Database Setup

### MongoDB Atlas (Cloud)

1. **Create a cluster** at mongodb.com
2. **Create a database user** with appropriate permissions
3. **Whitelist IP addresses** (or 0.0.0.0/0 for testing)
4. **Copy connection string**
5. **Replace placeholders** with database name and credentials
6. **Use as MONGODB_URI**

### Security Checklist

- [ ] Change JWT_SECRET to a strong random value
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS on frontend and backend
- [ ] Set appropriate CORS origins
- [ ] Configure proper database backups
- [ ] Enable MongoDB IP whitelist
- [ ] Use strong passwords for database users
- [ ] Enable authentication on all endpoints
- [ ] Set up rate limiting
- [ ] Monitor logs and errors

## Environment Variables

### Backend (.env)
```env
# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/interview-prep-board

# JWT
JWT_SECRET=your_super_secret_key_with_random_chars_min_32_chars

# Server
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com

# Optional
MAX_FILE_SIZE=10485760
```

### Frontend (.env or .env.production)
```env
VITE_API_URL=https://your-backend-api-url
```

## Post-Deployment

### Verify Deployment

1. **Test backend API:**
```bash
curl https://your-backend-url/api/health
```

2. **Test authentication:**
```bash
curl -X POST https://your-backend-url/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'
```

3. **Test frontend:** Visit your frontend URL in browser

### Monitor

1. Set up error tracking (Sentry, LogRocket)
2. Monitor database performance
3. Set up uptime monitoring
4. Configure backup schedules
5. Monitor API rate limits

## Scaling

### For High Traffic

1. **Backend:**
   - Use load balancer
   - Scale database read replicas
   - Implement caching (Redis)
   - Set up CDN for static files

2. **Frontend:**
   - Use CDN for asset delivery
   - Enable compression
   - Optimize images
   - Implement lazy loading

## Troubleshooting

### Common Issues

**"Cannot connect to MongoDB"**
- Verify connection string
- Check IP whitelist in MongoDB Atlas
- Verify credentials

**"CORS errors"**
- Update FRONTEND_URL in environment
- Clear browser cache
- Check CORS configuration in server.js

**"Build fails on deployment"**
- Check Node.js version compatibility
- Verify all dependencies are installed
- Check for environment variable issues

## Maintenance

### Regular Tasks

1. Monitor error logs
2. Update dependencies
3. Backup database
4. Review and optimize queries
5. Clean up old data/sessions
6. Review security logs

## Recovery

### Database Backup

```bash
# MongoDB Atlas provides automatic backups
# For manual backup:
mongodump --uri "mongodb+srv://user:pass@cluster.mongodb.net"
```

### Restore from Backup

```bash
mongorestore --uri "mongodb+srv://user:pass@cluster.mongodb.net" --archive=backup.archive
```

## Performance Optimization

### Backend

- Enable query caching
- Use database indexing
- Implement request compression
- Set up pagination for large datasets
- Use clustering for Node.js

### Frontend

- Code splitting with React.lazy()
- Image optimization
- CSS minification
- JavaScript minification
- Asset caching headers

## Security

### Additional Hardening

1. Enable HTTPS only
2. Set security headers (Helmet.js)
3. Implement rate limiting
4. Regular security audits
5. Keep dependencies updated
6. Implement input sanitization
7. Use environment variables for secrets
8. Enable logging and monitoring

---

For more help, refer to the main [README.md](./README.md)
