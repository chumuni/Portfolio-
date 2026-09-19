# Linker Adventure - Website Documentation

## 📁 Project Structure Overview

Your Linker Adventure website is now properly organized with all pages linked together. Here's the complete file structure:

```
linker-adventure/
├── index.html                      # Landing page (Home)
├── signin.html                     # Sign In page
├── register-tour-agent.html        # Tour Agent registration
├── register-tour-company.html      # Tour Company registration
└── styles-shared.css               # (Optional) Shared global styles
```

## 🎯 Page Navigation Flow

### User Journey Map:

```
Landing Page (index.html)
    ├─→ "Join as Tour Company" → register-tour-company.html
    ├─→ "Join as Tour Agent" → register-tour-agent.html
    ├─→ "Sign In" → signin.html
    └─→ Navigation Links → All pages link back to index.html

Sign In Page (signin.html)
    ├─→ "Create an Account" → register-tour-agent.html
    ├─→ Logo/Home → index.html
    └─→ Footer links → Policy pages (#)

Register Tour Agent (register-tour-agent.html)
    ├─→ Logo/Home → index.html
    ├─→ "Sign In" → signin.html
    └─→ Navigation Links → index.html

Register Tour Company (register-tour-company.html)
    ├─→ Logo/Home → index.html
    ├─→ "Sign In" → signin.html
    └─→ Navigation Links → index.html
```

## 🔗 All Internal Links

### Landing Page (index.html)
- **Logo**: Links to `index.html`
- **Home**: Links to `index.html`
- **Navigation**: Home, Features, About, Contact
- **"Join as Tour Company"**: Links to `register-tour-company.html`
- **"Join as Tour Agent"**: Links to `register-tour-agent.html`
- **"Sign In"** (header): Links to `signin.html`
- **"Get Started"** (button): Links to `register-tour-agent.html`
- **"Sign In"** (glass card): Links to `signin.html`
- **"Create Account"** (glass card): Links to `register-tour-agent.html`

### Sign In Page (signin.html)
- **Logo**: Links to `index.html`
- **Help**: Links to `#support` (anchor)
- **"Create an Account"**: Links to `register-tour-agent.html`
- Footer links: Terms, Privacy, Cookies, Support, Compliance

### Register Tour Agent (register-tour-agent.html)
- **Logo**: Links to `index.html`
- **Navigation Links**: Explore, Partnerships, Safety
- **"Sign In"** (header): Links to `signin.html`
- **"Get Started"** (button): Links to `register-tour-agent.html`
- **"Sign In"** (bottom): Links to `signin.html`
- Footer links: Terms, Privacy, Cookies, Support, Compliance

### Register Tour Company (register-tour-company.html)
- **Logo**: Links to `index.html`
- **Navigation Links**: Explore, About Us, Contact
- **"Sign In"** (header): Links to `signin.html`
- Footer links: Terms, Privacy, Cookies, Support, Compliance

## 🎨 Design System

### Colors (Consistent Across All Pages)
- **Primary Brand**: `#421e04` (Deep Brown)
- **Tertiary/Accent**: `#00454a` (Teal)
- **Accent Orange**: `#f97316`
- **Background**: `#fff8f5` (Light Cream)
- **Surface**: `#fff8f5`
- **Text**: `#201b18` (Dark Brown)
- **Text Variant**: `#51443d` (Medium Brown)

### Typography
- **Display Headings**: Montserrat (Bold)
- **Body Text**: Inter (Regular)
- **Labels/UI**: Inter (Semi-bold, 600)

### Spacing Tokens
- `xs`: 4px
- `sm`: 12px
- `base`: 8px
- `md`: 24px
- `lg`: 48px
- `xl`: 80px
- `margin-mobile`: 16px
- `margin-desktop`: 64px

### Border Radius
- `sm`: 0.25rem (4px)
- `md`: 0.5rem (8px)
- `lg`: 0.75rem (12px)
- `full`: 9999px (circular)

## 📱 Responsive Breakpoints

All pages are fully responsive:
- **Mobile**: < 768px (full width, vertical layout)
- **Tablet**: 768px - 1024px (multi-column begins)
- **Desktop**: > 1024px (full multi-column layout)

### Mobile-First Approach
- Navigation links hidden on mobile (shown on `md` breakpoint)
- Form fields stack vertically on mobile
- Hero sections adapt layout
- Touch-friendly button sizing (40px minimum height)

## 🔧 How to Customize

### Change Brand Colors
All Tailwind classes use custom color names:
- Replace `#421e04` throughout for primary color
- Replace `#00454a` for secondary/tertiary
- Colors defined in each page's Tailwind config

### Update Navigation
Edit the nav links in each HTML file:
```html
<a href="new-page.html" class="...">Link Text</a>
```

### Modify Spacing
Use Tailwind spacing classes:
- `gap-md`, `p-md`, `m-md`, etc.

### Add New Pages
1. Create a new `.html` file
2. Copy the nav/footer structure from an existing page
3. Update all internal links to include the new page
4. Add link to new page from relevant existing pages

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Replace placeholder images with actual company logos
- [ ] Update all `#` anchor links to real page URLs (Terms, Privacy, etc.)
- [ ] Test all internal links work correctly
- [ ] Verify responsive design on mobile/tablet/desktop
- [ ] Test form submissions
- [ ] Update social login handlers (Google, SSO)
- [ ] Add actual content for Features, About, Contact sections
- [ ] Set up form backend/email handling
- [ ] Add analytics tracking
- [ ] Optimize images for web
- [ ] Test browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Enable HTTPS
- [ ] Set up CDN if needed

## 📝 Form Sections

### Register Tour Agent Form Sections:
1. **Personal Information**
   - First/Last Name
   - Email
   - Phone (with country code selector)
   - ID/Passport
   - Country/City
   - Residential Address

2. **Professional Information**
   - CV/Resume upload
   - Experience level
   - Specialization (Safari, Trekking, etc.)
   - Languages spoken

3. **Account Security**
   - Password
   - Confirm Password

4. **Agreements**
   - Information accuracy confirmation
   - Terms & Privacy acceptance

### Register Tour Company Form Sections:
1. **Company Details**
   - Company Name
   - Registration Number
   - Business Email
   - Phone (with country code)
   - Country/City
   - Business Address

2. **Company Representative**
   - Manager Name
   - Tour Operator Name

3. **Business Verification**
   - Business License upload
   - TripAdvisor screenshot

4. **Account Security**
   - Password
   - Confirm Password

5. **Agreements**
   - Information accuracy confirmation
   - Terms & Privacy acceptance

## 🔐 Security Notes

- All password fields are type="password"
- Forms use checkboxes for required agreements
- File uploads validated on frontend (add server-side validation)
- Form data not submitted yet (add backend)

## 📞 Support

For questions about the website structure:
- Check the navigation section of each HTML file
- Review the Tailwind config for styling details
- Refer to this documentation for page linking

## ✅ Testing Checklist

Test these user flows:
1. ✅ Landing page → Tour Company registration
2. ✅ Landing page → Tour Agent registration
3. ✅ Landing page → Sign In
4. ✅ Sign In → Create Account
5. ✅ Any page → Logo to home
6. ✅ Navigation links work on desktop
7. ✅ Mobile menu/responsive layout
8. ✅ Form inputs accept data
9. ✅ Footer links work (or link to proper pages)

---

**Last Updated**: June 2026
**Version**: 1.0
**Linker Adventure - Global Stewardship in Tourism**