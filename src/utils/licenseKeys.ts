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

// Personal Vault Licenses ($49)
export const singleUserLicenses: LicenseKey[] = [
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
  ...singleUserLicenses,
  ...familyLicenses
];

// Utility functions
export function validateLicenseKey(key: string): boolean {
  // Check format
  const pattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  if (!pattern.test(key)) {
    return false;
  }
  
  // Check if it's in our list of valid keys
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
