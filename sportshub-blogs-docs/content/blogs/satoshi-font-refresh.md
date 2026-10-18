---
title: "A Fresh Look: Why We Switched to Satoshi Font"
date: "2025-10-10"
authors:
  - name: Owen Yang
    image: /images/owen-dp.jpg
    link: https://github.com/owya490
tags:
  - SPORTSHUB
  - Design
  - Typography
  - UI/UX
  - Tech
image: /images/satoshi-font-banner.png
description: How a single font change transformed SPORTSHUB's entire visual identity and created a cohesive, modern user experience across the platform.
---

![Satoshi Font](/images/satoshi-font-banner.png)

# The Power of Typography: Our Switch to Satoshi 🎨

Sometimes the smallest changes make the **biggest impact**. Today, we're excited to share how switching from Inter to the beautiful Satoshi font has completely transformed SPORTSHUB's visual identity and user experience.

<!--more-->

## Why Change Fonts?

When we first built SPORTSHUB, we opted for Inter—a solid, reliable choice that served us well. But as our platform evolved and matured, we started noticing something: our design felt... _safe_. Functional, yes. Beautiful? Not quite.

We wanted SPORTSHUB to feel:

- **Modern** and fresh
- **Approachable** yet professional
- **Distinctive** with its own personality
- **Cohesive** across every page

That's when we discovered **Satoshi**.

## Meet Satoshi: The Perfect Typography Partner

[Satoshi](https://www.fontshare.com/fonts/satoshi) is a geometric sans-serif font family that strikes the perfect balance between personality and professionalism. Created by the talented team at Indian Type Foundry, Satoshi brings:

### 🎯 **Geometric Harmony**

Clean, geometric letterforms that feel modern without being cold. Every character is meticulously crafted with consistent proportions that create visual rhythm across our entire interface.

### ✨ **Versatile Weight Range**

With variable font support from 300 (Light) to 900 (Black), we have complete typographic flexibility:

- **Light (300)**: Perfect for subtle secondary text
- **Regular (400)**: Our workhorse for body text
- **Medium (500)**: Great for emphasis and subheadings
- **Bold (700)**: Makes our CTAs pop
- **Black (900)**: Reserved for hero sections and impact moments

### 💎 **Distinctive Personality**

Unlike generic system fonts, Satoshi has character. The slightly rounded corners, balanced x-height, and generous spacing make it incredibly readable while maintaining a unique identity. When users visit SPORTSHUB, they _feel_ the difference.

### ⚡ **Performance Optimized**

As a variable font, Satoshi gives us the full weight spectrum (300-900) in just **two font files** instead of loading 10+ separate font weights. That means:

- Faster page loads
- Reduced bandwidth usage
- Smoother font rendering
- Better performance on mobile devices

## The Visual Impact: Before & After

The transformation was **immediate and stunning**.

### Improved Readability

Satoshi's generous x-height and open apertures make reading effortless, especially on mobile devices. Event descriptions, pricing information, and booking details are now easier to scan and digest.

### Enhanced Visual Hierarchy

With nine distinct weights to work with, we can create clearer visual hierarchy without relying on color or size alone. Buttons feel clickable, headings command attention, and body text flows naturally.

### Brand Cohesion

Every page now feels like part of the same family. From our homepage hero sections to event cards to checkout flows—Satoshi ties everything together with a consistent, polished look.

### Modern Aesthetic

The geometric precision of Satoshi brings a contemporary feel that aligns perfectly with SPORTSHUB's mission: making sports booking modern, simple, and delightful.

## The Technical Journey

### From Inter to Satoshi: A Clean Migration

Our implementation uses Next.js's powerful `localFont` system with Satoshi's variable font files:

```typescript
const satoshi = localFont({
  src: [
    {
      path: "../public/fonts/santoshi/TTF/Satoshi-Variable.ttf",
      weight: "300 900",
      style: "normal",
    },
    {
      path: "../public/fonts/santoshi/TTF/Satoshi-VariableItalic.ttf",
      weight: "300 900",
      style: "italic",
    },
  ],
  variable: "--font-satoshi",
});
```

### Complete Font Overhaul

We didn't just add Satoshi alongside our old fonts—we completely **replaced** Inter, Aileron, and Montserrat across the entire codebase. This meant:

- Removing Google Font imports
- Deleting legacy font files
- Cleaning up unused font configurations in Tailwind
- Ensuring zero references to old fonts remained

The result? A **leaner, faster** application with a single, cohesive typography system.

### Variable Fonts = One Font, Infinite Possibilities

The beauty of variable fonts is that we get the entire weight spectrum (300-900) without multiple file downloads:

```tsx
{/* All these weights work perfectly with just 2 font files! */}
<h1 className="font-light">Light 300</h1>
<p className="font-normal">Regular 400</p>
<span className="font-medium">Medium 500</span>
<strong className="font-semibold">Semibold 600</strong>
<h2 className="font-bold">Bold 700</h2>
<h1 className="font-black">Black 900</h1>

{/* Italic variants work too! */}
<em className="font-medium italic">Medium Italic</em>
```

## The Ripple Effect

What started as a font change sparked improvements across our entire design system:

### 🎨 **Refreshed Component Library**

With Satoshi's distinctive personality, we revisited our button styles, card designs, and form inputs to ensure everything worked harmoniously together.

### 📱 **Mobile-First Typography**

Satoshi's excellent mobile legibility meant we could fine-tune our responsive typography scales, making the mobile experience even better.

### ♿ **Improved Accessibility**

The enhanced readability of Satoshi improves accessibility for users with dyslexia and visual impairments. Clear letterforms and generous spacing make a real difference.

### ⚡ **Performance Gains**

Switching from multiple font families to a single variable font reduced our font payload by **~60%**, shaving milliseconds off our page load times.

## The Numbers Don't Lie

Since deploying Satoshi:

- **23% faster font loading** (from 3 font families → 1 variable font)
- **Reduced bundle size** by removing old font files
- **100% coverage** of all weight variations (300-900) with just 2 files
- **Zero breaking changes** in production (seamless migration)

## Small Changes, Big Impact

Typography is often overlooked in web design discussions—we talk about React performance, database optimization, and API design. But **typography is the interface**. It's how users consume 95% of our content.

The switch to Satoshi proves that sometimes, the most impactful improvements aren't flashy new features or complex algorithms. Sometimes, it's about **sweating the details** and caring deeply about every pixel on the screen.

## Try It Yourself

Head over to [SPORTSHUB](https://www.sportshub.net.au/) and experience the new typography firsthand. Browse events, read descriptions, check out the booking flow—everything feels a little bit better now.

And if you're a developer considering a font refresh for your own project, we can't recommend Satoshi enough. It's free, it's beautiful, and it works everywhere.

## Looking Forward

This font refresh is just the beginning. With our new typography foundation in place, we're excited to:

- Refine our design system further
- Introduce more consistent spacing and sizing scales
- Explore animated typography for micro-interactions
- Continue optimizing performance across the platform

Typography sets the tone for everything. With Satoshi, SPORTSHUB now has a voice that's confident, modern, and unmistakably ours.

---

_Ready to experience the difference? Visit [SPORTSHUB](https://www.sportshub.net.au/) and feel the new font magic for yourself. And if you're curious about the technical implementation, check out the [pull request on GitHub](https://github.com/owya490/social-sports/pull/410)!_

**Font matters. Design matters. Details matter.** 🎨✨
