/**
 * Policy flags and central values for 2025 behavior toggles.
 * Defaults align with OBBBA 2025 being active, with a flag to revert to pre‑OBBBA when needed.
 */

export function getPolicyFlags(form = {}) {
  const useObbba2025 = form.useObbba2025 !== undefined ? !!form.useObbba2025 : true;
  return { useObbba2025 };
}

export function getSaltCap(filingStatus = 'single', form = {}) {
  const { useObbba2025 } = getPolicyFlags(form);
  if (useObbba2025) return filingStatus === 'marriedSeparate' ? 20000 : 40000;
  return filingStatus === 'marriedSeparate' ? 5000 : 10000;
}

