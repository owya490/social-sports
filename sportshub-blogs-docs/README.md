# SportsHub Blog Publishing Guide

This guide explains how to publish new blog posts for SportsHub, from writing content to deploying to production.

## 📝 Writing New Blog Posts

### 1. Create a New Blog Post

Navigate to the Hugo content directory:

```bash
cd frontend/hugo/content/blogs
```

Create a new markdown file with the following naming convention:

```
blog-post-title.md
```

Example: `introducing-sportshub-blogs.md`

### 2. Blog Post Structure

Each blog post should have the following front matter (header) at the top:

```yaml
---
title: "Your Blog Post Title"
description: "A brief description of your blog post (used for SEO and previews)"
date: 2024-01-15
draft: false
tags: ["sports", "technology", "community"]
authors:
  - name: "Your Name"
    image: "/images/blog/your-featured-image.jpg"
    link: "https://abc.com"
---
Your blog content goes here...
```

#### Front Matter Fields Explained:

- **title**: The main title of your blog post
- **description**: SEO-friendly description (150-160 characters recommended)
- **date**: Publication date in ISO format
- **draft**: Set to `false` when ready to publish
- **tags**: Array of relevant tags for categorization
- **author**: Your name or pen name
- **image**: Path to featured image (optional but recommended)

### 3. Content Guidelines

- Use Markdown syntax for formatting
- Keep paragraphs short and readable
- Use headers (`#`, `##`, `###`) for structure
- Reference images as `/images/blog/filename.jpg`

## 🔍 Previewing Your Blog

### Local Development Server

Start the Hugo development server to preview your blog:

```bash
cd frontend/hugo
hugo server -D
```

This will:

- Start a local server (usually at `http://localhost:1313`)
- Enable live reload (changes appear instantly)
- Show draft posts (`draft: true`) in preview

### Build for Production Preview

To see exactly how it will look in production:

```bash
cd frontend/hugo
hugo --minify
```

This generates the static files in the `public/` directory.

## 🚀 Publishing Process

### Before Raising a PR

1. **Test your blog post locally**:

   ```bash
   cd frontend/hugo
   hugo server -D
   ```

2. **Build and integrate with Vercel**:

   ```bash
   ./scripts/build-hugo.sh
   ```

   This script will:

   - Build Hugo static files
   - Copy blog content to Vercel's public directory
   - Merge images and assets
   - Prepare everything for deployment

3. **Verify the integration**:
   - Check that your blog appears in `frontend/public/blogs/`
   - Ensure images are properly copied
   - Test that the blog is accessible

### Raising a Pull Request

1. **Commit your changes**:

   ```bash
   git add frontend/hugo/content/blogs/your-blog-post.md
   git add frontend/public/  # If any files were generated
   git commit -m "Add new blog post: Your Blog Post Title"
   ```

2. **Push and create PR**:

   ```bash
   git push origin your-branch
   ```

3. **In your PR description, include**:
   - Brief description of the blog post
   - Any new images or assets added
   - Confirmation that you've tested locally

## 🛠️ Troubleshooting

### Common Issues

1. **Blog not appearing**:

   - Check that `draft: false` in front matter
   - Verify the file is in the correct directory
   - Ensure proper markdown syntax

2. **Images not loading**:

   - Confirm image path is correct
   - Check that image exists in `static/images/blog/`
   - Verify file permissions

3. **Build errors**:
   - Check Hugo syntax in your markdown
   - Verify front matter is properly formatted
   - Look for missing required fields

### Useful Commands

```bash
# Check Hugo version
hugo version

# Validate your Hugo site
hugo check

# Build with verbose output
hugo --verbose

# Clean and rebuild
rm -rf frontend/hugo/public
hugo --minify
```

## 📚 Additional Resources

- [Hugo Documentation](https://gohugo.io/documentation/)
- [Markdown Guide](https://www.markdownguide.org/)
- [Hugo Themes Documentation](https://themes.gohugo.io/)

## 🤝 Contributing

When contributing blog posts:

1. Follow the established format and guidelines
2. Test thoroughly before submitting
3. Include appropriate tags and categories
4. Provide high-quality images when possible
5. Write clear, engaging content for our community

---

**Need help?** Reach out to the team or check the Hugo documentation for more advanced features.
