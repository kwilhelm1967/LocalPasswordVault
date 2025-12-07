# 🔑 Kelly's Guide to Creating License Keys for Friends

This guide shows you exactly how to create **FREE lifetime license keys** that you can give to friends and family.

---

## ✅ Keys Already Created for You

I've already added **7 lifetime keys** that are ready to give out right now:

### Personal Keys (1 device each)
| Key | Give To |
|-----|---------|
| `GIFT-LPV1-FREE-4EVR` | Friend #1 |
| `GIFT-LPV2-FREE-4EVR` | Friend #2 |
| `GIFT-LPV3-FREE-4EVR` | Friend #3 |
| `GIFT-LPV4-FREE-4EVR` | Friend #4 |
| `GIFT-LPV5-FREE-4EVR` | Friend #5 |

### Family Keys (5 devices each)
| Key | Give To |
|-----|---------|
| `GIFT-FAM1-FREE-4EVR` | Family Member #1 (can use on 5 devices) |
| `GIFT-FAM2-FREE-4EVR` | Family Member #2 (can use on 5 devices) |

**These keys NEVER expire!** ✨

---

## 📝 How to Add MORE Keys

### Step 1: Open the License Keys File

Open this file in your code editor:
```
src/utils/licenseKeys.ts
```

### Step 2: Find the Lifetime Licenses Section

Look for this section near the top of the file:
```typescript
// Lifetime/Gift Licenses (never expire - for friends and family)
export const lifetimeLicenses: LicenseKey[] = [
  // ADD YOUR GIFT KEYS HERE
```

### Step 3: Add a New Key

Copy and paste this template below the existing keys:

**For a PERSONAL key (1 device):**
```typescript
  {
    key: "GIFT-XXXX-YYYY-ZZZZ",
    type: "single",
    expires: getLifetimeDate().formatted,
    expirationDate: getLifetimeDate().date
  },
```

**For a FAMILY key (5 devices):**
```typescript
  {
    key: "GIFT-XXXX-YYYY-ZZZZ",
    type: "family",
    expires: getLifetimeDate().formatted,
    expirationDate: getLifetimeDate().date
  },
```

### Step 4: Make Up Your Own Key Code

Replace `GIFT-XXXX-YYYY-ZZZZ` with your own code. Rules:
- Must be 4 groups of 4 characters
- Separated by dashes
- Use UPPERCASE letters and numbers only
- Avoid confusing characters (0/O, 1/I/L)

**Examples:**
- `GIFT-JOHN-2024-FREE`
- `GIFT-MARY-BDAY-LOVE`
- `GIFT-DAVE-XMAS-2025`
- `GIFT-MOM1-LOVE-4EVR`

### Step 5: Save and Rebuild

After adding keys:
1. Save the file
2. Run this command in terminal:
```bash
npm run build
```

### Step 6: Build New Installer

To create a new installer with the keys included:
```bash
npm run dist:win
```

The new installer will be in the `release/` folder.

---

## 🎁 Example: Adding Keys for Mom and Dad

Here's exactly what you'd add to the file:

```typescript
// Lifetime/Gift Licenses (never expire - for friends and family)
export const lifetimeLicenses: LicenseKey[] = [
  // ADD YOUR GIFT KEYS HERE
  {
    key: "GIFT-LPV1-FREE-4EVR",
    type: "single",
    expires: getLifetimeDate().formatted,
    expirationDate: getLifetimeDate().date
  },
  // ... existing keys ...
  
  // 👇 ADD YOUR NEW KEYS HERE 👇
  {
    key: "GIFT-MOM1-LOVE-4EVR",
    type: "single",
    expires: getLifetimeDate().formatted,
    expirationDate: getLifetimeDate().date
  },
  {
    key: "GIFT-DAD1-LOVE-4EVR",
    type: "single",
    expires: getLifetimeDate().formatted,
    expirationDate: getLifetimeDate().date
  },
  {
    key: "GIFT-BROS-XMAS-2025",
    type: "family",
    expires: getLifetimeDate().formatted,
    expirationDate: getLifetimeDate().date
  },
];
```

---

## 🚀 Quick Command Reference

| What | Command |
|------|---------|
| Build the app | `npm run build` |
| Create Windows installer | `npm run dist:win` |
| Create Mac installer | `npm run dist:mac` |
| Create Linux installer | `npm run dist:linux` |
| Create ALL installers | `npm run dist:all` |

---

## 📧 What to Tell Your Friend

Send them this message:

```
Hey! I got you a FREE lifetime license for Local Password Vault - 
a secure offline password manager.

Here's your license key:
GIFT-XXXX-YYYY-ZZZZ

Download it here: [Your download link]

When you install it, enter the key above and you're all set!
It never expires. Enjoy! 🎉
```

---

## ❓ FAQ

**Q: Can one person use multiple keys?**
A: No, each key is for one person. Family keys allow 5 DEVICES for ONE household.

**Q: What if I run out of keys?**
A: Just add more following the steps above!

**Q: Do I need to rebuild after adding keys?**
A: Yes! Run `npm run build` then `npm run dist:win` to create a new installer.

**Q: Can I change a key after someone uses it?**
A: No, once activated the key is tied to their device. But you can add new keys anytime.

---

## 📁 File Locations

| What | Where |
|------|-------|
| License keys file | `src/utils/licenseKeys.ts` |
| Windows installer | `release/Local Password Vault Setup 1.2.0.exe` |
| This guide | `docs/KellyMakeKeys.md` |

---

*Last Updated: December 2025*

