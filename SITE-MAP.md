# 🗺️ Linker Adventure - Site Map & Navigation Guide

## Visual Site Map

```
┌─────────────────────────────────────────────────────────────────┐
│                    LINKER ADVENTURE PLATFORM                    │
└─────────────────────────────────────────────────────────────────┘

                         index.html (Home)
                              │
                    ┌─────────┼─────────┐
                    │         │         │
                    ↓         ↓         ↓
            Tour Company  Tour Agent   Sign In
            Registration  Registration  Page
            (register-    (register-   (signin.
             tour-        tour-        html)
             company.     agent.html)
             html)
                    │         │         │
                    └─────────┼─────────┘
                              │
                         (Back to Home)
```

---

## Complete Navigation Structure

### 🏠 HOME PAGE (index.html)

**Navigation Bar:**
- Logo → `index.html`
- Home → `index.html`
- Features → `#features` (anchor)
- About → `#about` (anchor)
- Contact → `#contact` (anchor)
- Sign In → `signin.html`
- Get Started → `register-tour-agent.html`

**Main Content:**
- Hero CTA 1: "Join as Tour Company" → `register-tour-company.html`
- Hero CTA 2: "Join as Tour Agent" → `register-tour-agent.html`
- Glass Card: "Sign In" → `signin.html`
- Glass Card: "Create Account" → `register-tour-agent.html`

**Footer:**
- Linker Adventure (logo/brand)
- Terms of Service → `#terms`
- Privacy Policy → `#privacy`
- Cookies → `#cookies`
- Contact Support → `#support`
- Global Trade Compliance → `#compliance`

---

### 🔐 SIGN IN PAGE (signin.html)

**Navigation Bar:**
- Logo → `index.html`
- Help → `#support` (anchor)

**Main Content:**
- Form fields (email, password)
- "Forgot Password?" → `#forgot`
- "Keep me signed in for 30 days" (checkbox)
- Sign In Button → Form submit
- Google Login → (integration needed)
- SSO Button → (integration needed)
- "Create an Account" → `register-tour-agent.html`

**Footer:**
- Linker Adventure (brand)
- Terms of Service → `#terms`
- Privacy Policy → `#privacy`
- Cookies → `#cookies`
- Contact Support → `#support`
- Global Trade Compliance → `#compliance`

---

### 🧑‍💼 TOUR AGENT REGISTRATION (register-tour-agent.html)

**Navigation Bar:**
- Logo → `index.html`
- Explore → `index.html`
- Partnerships → `#partnerships` (anchor)
- Safety → `#safety` (anchor)
- Sign In → `signin.html`
- Get Started → `register-tour-agent.html`

**Main Content:**

**Personal Information Section:**
- First Name (input)
- Last Name (input)
- Email Address (input)
- Phone Number (input with country code)
- ID/Passport (input)
- Country (select)
- City (input)
- Residential Address (input)

**Professional Information Section:**
- CV/Resume (file upload)
- Experience (select: 0-2, 3-5, 5-10, 10+ years)
- Specialization (select: Safari, Trekking, Cultural, Water)
- Languages Spoken (input)

**Account Security Section:**
- Password (input)
- Confirm Password (input)

**Agreements & Submit:**
- Information accuracy (checkbox)
- Terms & Privacy (checkbox) → Links to `#terms` and `#privacy`
- Create Account Button (submit)
- "Already have account? Sign In" → `signin.html`

**Footer:**
- Linker Adventure (brand)
- Terms of Service → `#terms`
- Privacy Policy → `#privacy`
- Cookies → `#cookies`
- Contact Support → `#support`
- Global Trade Compliance → `#compliance`

---

### 🏢 TOUR COMPANY REGISTRATION (register-tour-company.html)

**Navigation Bar:**
- Logo → `index.html`
- Explore → `index.html`
- About Us → `#about` (anchor)
- Contact → `#contact` (anchor)
- Sign In → `signin.html`

**Main Content:**

**Company Details Section:**
- Company Name (input) *required
- Registration Number (input) *required
- Business Email (input) *required
- Phone (input with country code) *required
- Country (select) *required
- City (input) *required
- Business Address (input) *required

**Company Representative Section:**
- Manager Name (input) *required
- Tour Operator Name (input) optional

**Business Verification Section:**
- Business License (file upload) *required
- TripAdvisor Screenshot (file upload) optional

**Account Security Section:**
- Password (input) *required
- Confirm Password (input) *required

**Agreements & Submit:**
- Information accuracy (checkbox) *required
- Terms & Privacy (checkbox) *required → Links to `#terms` and `#privacy`
- Create Account Button (submit)
- "Already have account? Sign In" → `signin.html`

**Footer:**
- Linker Adventure (brand)
- Terms of Service → `#terms`
- Privacy Policy → `#privacy`
- Cookies → `#cookies`
- Contact Support → `#support`
- Global Trade Compliance → `#compliance`

---

## 🔗 Link Reference Table

| Link Text | Source Page | Target | Type |
|-----------|------------|--------|------|
| Logo | All pages | index.html | Internal |
| Home | index.html | index.html | Internal |
| Features | index.html | #features | Anchor |
| About | index.html, register pages | #about or index.html | Mixed |
| Contact | index.html, register pages | #contact or index.html | Mixed |
| Sign In | All pages | signin.html | Internal |
| Get Started | index.html | register-tour-agent.html | Internal |
| Join as Tour Company | index.html | register-tour-company.html | Internal |
| Join as Tour Agent | index.html | register-tour-agent.html | Internal |
| Create Account | signin.html | register-tour-agent.html | Internal |
| Forgot Password | signin.html | #forgot | Anchor |
| Explore | All pages | index.html | Internal |
| Partnerships | register-tour-agent.html | #partnerships | Anchor |
| Safety | register-tour-agent.html | #safety | Anchor |
| About Us | register-tour-company.html | #about | Anchor |
| Terms of Service | All pages | #terms | Anchor |
| Privacy Policy | All pages | #privacy | Anchor |
| Cookies | All pages | #cookies | Anchor |
| Contact Support | All pages | #support | Anchor |
| Global Trade Compliance | All pages | #compliance | Anchor |

---

## 🎯 User Journey Paths

### Path 1: New Tour Agent Registration
```
index.html → "Join as Tour Agent" → register-tour-agent.html → Fill form → Submit
```

### Path 2: New Tour Company Registration
```
index.html → "Join as Tour Company" → register-tour-company.html → Fill form → Submit
```

### Path 3: Existing User Login
```
index.html → "Sign In" → signin.html → Enter credentials → Submit
```

### Path 4: Forgot Password
```
index.html → "Sign In" → signin.html → "Forgot Password?" → #forgot (to be implemented)
```

### Path 5: Help/Support
```
Any page → "Help"/"Support" link → #support (to be implemented)
```

### Path 6: Policy/Legal
```
Any page → Footer link → Policy page (to be implemented)
```

### Path 7: Back to Home (from anywhere)
```
Any page → Logo click → index.html
```

---

## 📊 Navigation Statistics

| Metric | Count |
|--------|-------|
| Total Pages | 4 |
| Total Internal Links | 28+ |
| Navigation Bar Items | 4-5 per page |
| Footer Links | 6 per page |
| Anchor Links (placeholders) | 12 |
| Form Pages | 2 |
| Form Input Fields | 24+ |

---

## 🔄 Cross-Page Navigation Matrix

```
         From\To    index  signin  tour-agent  tour-co
index              -      ✓       ✓           ✓
signin             ✓      -       ✓           -
tour-agent         ✓      ✓       -           -
tour-co            ✓      ✓       -           -
```

✓ = Direct link exists
- = Same page (no link needed)

---

## 📱 Responsive Navigation

### Mobile (< 768px)
- Logo and brand name visible
- Main nav hidden (toggle menu if added)
- "Sign In" and "Get Started" buttons visible
- Stacked layout
- Touch-friendly tap targets (min 44x44px)

### Tablet (768px - 1024px)
- Logo and brand name visible
- Some nav links visible
- Mobile menu optional
- Multi-column layout starts

### Desktop (> 1024px)
- Full navigation visible
- All links accessible
- Multi-column forms
- Optimal spacing

---

## 🎨 Navigation Styling

### Common Navbar Styles (All Pages):
- Background: `bg-surface`
- Height: `py-sm` (12px padding)
- Position: `sticky top-0 z-50`
- Box Shadow: `shadow-sm`
- Links: `text-on-surface-variant` with `hover:text-primary`

### Footer Styling (All Pages):
- Background: `bg-surface-container-highest`
- Border: `border-t border-outline-variant`
- Padding: `py-lg` (48px)
- Text: `text-on-surface-variant`
- Links: Hover to `text-primary`

---

## 🔐 Security-Related Navigation

### Password-Related Links:
- "Forgot Password?" (signin.html) → `#forgot` (to implement)
- Password fields use `type="password"`
- Confirm password field for verification

### Agreement Links:
- "Terms" → `#terms` (to implement)
- "Privacy" → `#privacy` (to implement)
- Both marked as required (`required` attribute)

---

## 📋 Navigation Checklist

- [ ] Test all internal page links
- [ ] Verify logo links to home
- [ ] Confirm nav links work on mobile
- [ ] Check responsive breakpoints
- [ ] Test form submission buttons
- [ ] Verify back button functionality
- [ ] Test browser back/forward buttons
- [ ] Check loading times on all pages
- [ ] Verify all hover states work
- [ ] Test focus states for accessibility
- [ ] Check footer links visibility
- [ ] Verify mobile menu (if added)

---

## 🚀 Future Navigation Enhancements

1. **Add Dashboard Page**
   - User profile
   - Dashboard home
   - Booking management
   - Analytics

2. **Add Policy Pages**
   - terms.html
   - privacy.html
   - cookies.html

3. **Add Support Pages**
   - help.html
   - contact.html
   - faq.html

4. **Add Admin Pages**
   - admin-dashboard.html
   - admin-users.html
   - admin-verification.html

5. **Navigation Improvements**
   - Mobile hamburger menu
   - Breadcrumb navigation
   - Search functionality
   - Notifications bell
   - User dropdown menu

---

## 📞 Quick Reference

**Main Entry Point:** `index.html`

**Registration Pages:**
- Tour Agent: `register-tour-agent.html`
- Tour Company: `register-tour-company.html`

**Authentication:**
- Sign In: `signin.html`

**External Links (to implement):**
- Terms: Create `terms.html`
- Privacy: Create `privacy.html`
- Support: Add support contact info
- Help: Create `help.html`

---

**Navigation Map Version:** 1.0  
**Last Updated:** June 2026  
**Linker Adventure Platform**