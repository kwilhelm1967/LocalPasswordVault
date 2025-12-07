// License key types - Personal and Family only
export type LicenseType = 'single' | 'family';

// License key interface
export interface LicenseKey {
  key: string;
  type: LicenseType;
  expires: string;
  expirationDate: Date;
}

// Function to get expiration date (120 days from now)
function getExpirationDate() {
  const date = new Date();
  date.setDate(date.getDate() + 120);
  
  const formatted = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return { date, formatted };
}

// Function for permanent/lifetime licenses (never expires)
function getLifetimeDate() {
  return {
    date: new Date('2099-12-31'),
    formatted: 'Lifetime License'
  };
}

// Lifetime/Gift Licenses (never expire - for friends and family)
export const lifetimeLicenses: LicenseKey[] = [
  // ADD YOUR GIFT KEYS HERE
  {
    key: "GIFT-LPV1-FREE-4EVR",
    type: "single",
    expires: getLifetimeDate().formatted,
    expirationDate: getLifetimeDate().date
  },
  {
    key: "GIFT-LPV2-FREE-4EVR",
    type: "single",
    expires: getLifetimeDate().formatted,
    expirationDate: getLifetimeDate().date
  },
  {
    key: "GIFT-LPV3-FREE-4EVR",
    type: "single",
    expires: getLifetimeDate().formatted,
    expirationDate: getLifetimeDate().date
  },
  {
    key: "GIFT-LPV4-FREE-4EVR",
    type: "single",
    expires: getLifetimeDate().formatted,
    expirationDate: getLifetimeDate().date
  },
  {
    key: "GIFT-LPV5-FREE-4EVR",
    type: "single",
    expires: getLifetimeDate().formatted,
    expirationDate: getLifetimeDate().date
  },
  {
    key: "GIFT-FAM1-FREE-4EVR",
    type: "family",
    expires: getLifetimeDate().formatted,
    expirationDate: getLifetimeDate().date
  },
  {
    key: "GIFT-FAM2-FREE-4EVR",
    type: "family",
    expires: getLifetimeDate().formatted,
    expirationDate: getLifetimeDate().date
  },
];

// Personal Vault Licenses ($49)
export const singleUserLicenses: LicenseKey[] = [
  // NEW_PERSONAL_KEYS_HERE
  {
    key: "PERS-PGS3-XJ9V-NEGT",
    type: "single",
    expires: getExpirationDate().formatted,
    expirationDate: getExpirationDate().date
  },
  {
    key: "PERS-8JU7-W77F-C3U3",
    type: "single",
    expires: getExpirationDate().formatted,
    expirationDate: getExpirationDate().date
  },
  {
    key: "PERS-Y9DS-2TNH-74YN",
    type: "single",
    expires: getExpirationDate().formatted,
    expirationDate: getExpirationDate().date
  },
  {
    key: "RNKJ-XTPB-LFGM-QVWC3",
    type: "single",
    expires: getExpirationDate().formatted,
    expirationDate: getExpirationDate().date
  },
  {
    key: "HZXD-YVGP-QNMK-JBSF7",
    type: "single",
    expires: getExpirationDate().formatted,
    expirationDate: getExpirationDate().date
  },
  {
    key: "TPWL-QVNM-KZXD-JBGF5",
    type: "single",
    expires: getExpirationDate().formatted,
    expirationDate: getExpirationDate().date
  },
  {
    key: "ABCD-EFGH-IJKL-MNOP1",
    type: "single",
    expires: getExpirationDate().formatted,
    expirationDate: getExpirationDate().date
  },
  {
    key: "QRST-UVWX-YZAB-CDEF2",
    type: "single",
    expires: getExpirationDate().formatted,
    expirationDate: getExpirationDate().date
  },
  {
    key: "GHIJ-KLMN-OPQR-STUV3",
    type: "single",
    expires: getExpirationDate().formatted,
    expirationDate: getExpirationDate().date
  }
];

// Family Vault Licenses ($79)
export const familyLicenses: LicenseKey[] = [
  // NEW_FAMILY_KEYS_HERE
  {
    key: "FMLY-DC7S-E5WQ-MGNY",
    type: "family",
    expires: getExpirationDate().formatted,
    expirationDate: getExpirationDate().date
  },
  {
    key: "GFTP-QVNM-KZXD-JBSF9",
    type: "family",
    expires: getExpirationDate().formatted,
    expirationDate: getExpirationDate().date
  },
  {
    key: "KZXD-JBSF-GFTP-QVNM3",
    type: "family",
    expires: getExpirationDate().formatted,
    expirationDate: getExpirationDate().date
  },
  {
    key: "QVNM-KZXD-JBSF-GFTP1",
    type: "family",
    expires: getExpirationDate().formatted,
    expirationDate: getExpirationDate().date
  },
  {
    key: "WXYZ-ABCD-EFGH-IJKL4",
    type: "family",
    expires: getExpirationDate().formatted,
    expirationDate: getExpirationDate().date
  },
  {
    key: "MNOP-QRST-UVWX-YZAB5",
    type: "family",
    expires: getExpirationDate().formatted,
    expirationDate: getExpirationDate().date
  },
  {
    key: "CDEF-GHIJ-KLMN-OPQR6",
    type: "family",
    expires: getExpirationDate().formatted,
    expirationDate: getExpirationDate().date
  }
];

// All licenses combined
export const allLicenseKeys: LicenseKey[] = [
  ...lifetimeLicenses,
  ...singleUserLicenses,
  ...familyLicenses
];

// Utility functions
export function validateLicenseKey(key: string): boolean {
  const pattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4,5}$/;
  if (!pattern.test(key)) {
    return false;
  }
  return allLicenseKeys.some(license => license.key === key);
}

export function getLicenseType(key: string): LicenseType | null {
  const license = allLicenseKeys.find(license => license.key === key);
  return license ? license.type : null;
}

export function isLicenseExpired(key: string): boolean {
  const license = allLicenseKeys.find(license => license.key === key);
  if (!license) return true;
  return new Date() > license.expirationDate;
}
