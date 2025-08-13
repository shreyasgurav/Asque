# AsQue Bot Platform - Production Deployment Guide

## 🚀 Quick Start

1. **Set up environment variables** (see [Environment Configuration](#environment-configuration))
2. **Deploy to your platform** (see [Deployment Options](#deployment-options))
3. **Monitor and maintain** (see [Monitoring & Maintenance](#monitoring--maintenance))

## 📋 Pre-Deployment Checklist

### ✅ Security
- [ ] All environment variables are set
- [ ] Firebase Admin SDK is configured
- [ ] OpenAI API key is valid and has sufficient credits
- [ ] Rate limiting is enabled
- [ ] Input validation is active
- [ ] Error tracking is configured
- [ ] Security headers are enabled

### ✅ Performance
- [ ] Database indexes are created
- [ ] CDN is configured (if applicable)
- [ ] Image optimization is enabled
- [ ] Bundle size is optimized

### ✅ Monitoring
- [ ] Error tracking service is set up (Sentry recommended)
- [ ] Analytics are configured
- [ ] Log aggregation is set up
- [ ] Health checks are implemented

## 🔧 Environment Configuration

### Required Environment Variables

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

### Optional Environment Variables

```bash
# Error Tracking
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CHAT_RATE_LIMIT_MAX_REQUESTS=30
AUTH_RATE_LIMIT_MAX_REQUESTS=5

# File Upload (AWS S3)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-vercel-analytics-id
```

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

3. **Set environment variables in Vercel dashboard**

### Option 2: Netlify

1. **Install Netlify CLI:**
   ```bash
   npm i -g netlify-cli
   ```

2. **Build and deploy:**
   ```bash
   npm run build
   netlify deploy --prod --dir=out
   ```

### Option 3: Docker

1. **Build Docker image:**
   ```bash
   docker build -t asque-bot-platform .
   ```

2. **Run container:**
   ```bash
   docker run -p 3000:3000 \
     -e OPENAI_API_KEY=your-key \
     -e FIREBASE_PROJECT_ID=your-project \
     asque-bot-platform
   ```

### Option 4: Manual Deployment

1. **Build the application:**
   ```bash
   npm run build
   npm run export
   ```

2. **Upload the `out` directory to your hosting provider**

## 🔒 Security Considerations

### API Security
- All API endpoints are rate-limited
- Input validation is enforced
- Authentication is required for sensitive operations
- CORS is properly configured

### Data Security
- Firebase Firestore rules are enforced
- User data is properly isolated
- API keys are never exposed to the client

### Infrastructure Security
- Security headers are enabled
- HTTPS is enforced
- XSS protection is active
- Content Security Policy is configured

## 📊 Monitoring & Maintenance

### Error Tracking
The application includes built-in error tracking. For production, we recommend:

1. **Set up Sentry:**
   - Create a Sentry account
   - Add your DSN to environment variables
   - Monitor error rates and trends

2. **Monitor API usage:**
   - Track OpenAI API usage and costs
   - Set up alerts for unusual usage patterns
   - Monitor rate limit violations

### Performance Monitoring
- Monitor response times
- Track database query performance
- Monitor memory usage
- Set up alerts for performance degradation

### Cost Monitoring
- Monitor OpenAI API costs
- Track Firebase usage
- Set up billing alerts
- Optimize based on usage patterns

## 🔧 Maintenance Tasks

### Daily
- [ ] Check error logs
- [ ] Monitor API usage
- [ ] Review performance metrics

### Weekly
- [ ] Update dependencies
- [ ] Review security alerts
- [ ] Analyze usage patterns
- [ ] Backup critical data

### Monthly
- [ ] Security audit
- [ ] Performance optimization
- [ ] Cost analysis
- [ ] Feature planning

## 🚨 Troubleshooting

### Common Issues

#### 1. OpenAI API Errors
**Symptoms:** Chat responses fail, 401/403 errors
**Solutions:**
- Check API key validity
- Verify billing status
- Check rate limits
- Monitor token usage

#### 2. Firebase Connection Issues
**Symptoms:** Authentication fails, database errors
**Solutions:**
- Verify Firebase configuration
- Check service account permissions
- Monitor Firestore rules
- Verify network connectivity

#### 3. Performance Issues
**Symptoms:** Slow response times, timeouts
**Solutions:**
- Check database indexes
- Monitor API response times
- Review rate limiting settings
- Optimize queries

#### 4. Rate Limiting Issues
**Symptoms:** 429 errors, blocked requests
**Solutions:**
- Adjust rate limit settings
- Monitor user behavior
- Implement progressive rate limiting
- Add user-specific limits

### Debug Commands

```bash
# Check environment variables
npm run check-env

# Test database connection
npm run test-db

# Validate configuration
npm run validate-config

# Check build status
npm run build --dry-run
```

## 📈 Scaling Considerations

### Horizontal Scaling
- Use load balancers
- Implement session management
- Configure database clustering
- Set up CDN for static assets

### Vertical Scaling
- Monitor memory usage
- Optimize database queries
- Implement caching strategies
- Use connection pooling

### Cost Optimization
- Monitor OpenAI usage
- Implement caching for embeddings
- Optimize training data storage
- Use cost-effective models

## 🔄 Updates & Upgrades

### Regular Updates
1. **Dependencies:** Update monthly
2. **Security patches:** Apply immediately
3. **Feature updates:** Plan quarterly
4. **Database migrations:** Test thoroughly

### Upgrade Process
1. **Backup data**
2. **Test in staging**
3. **Deploy to production**
4. **Monitor for issues**
5. **Rollback if needed**

## 📞 Support

### Getting Help
- Check the [main README](../README.md)
- Review error logs
- Monitor application metrics
- Contact the development team

### Emergency Contacts
- **Technical Issues:** Development team
- **Billing Issues:** OpenAI/Firebase support
- **Security Issues:** Immediate escalation required

## 📝 License

This application is licensed under the MIT License. See the [LICENSE](../LICENSE) file for details.

---

**Last Updated:** $(date)
**Version:** 1.0.0
**Environment:** Production 