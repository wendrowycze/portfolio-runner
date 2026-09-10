/**
 * Gość hotelu — dane z ekranu startowego, wyłącznie w pamięci (ADR-4: bez localStorage).
 * Mail nigdzie nie jest wysyłany w tej wersji (zapis postępu po mailu — backlog P2).
 */
export interface Visitor {
  name: string;
  email: string;
  consent: boolean;
  /** Wszedł „jako gość” — bez podawania danych. */
  guest: boolean;
}

export function createVisitor(): Visitor {
  return { name: '', email: '', consent: false, guest: false };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

/** Ile „pochodni” zapala wypełniony formularz: imię, mail, zgoda (0..3). */
export function litTorches(visitor: Visitor): number {
  let lit = 0;
  if (visitor.name.trim().length >= 2) lit += 1;
  if (isValidEmail(visitor.email)) lit += 1;
  if (visitor.consent) lit += 1;
  return lit;
}

export const TORCHES_TOTAL = 3;

export function canEnter(visitor: Visitor): boolean {
  return visitor.guest || litTorches(visitor) === TORCHES_TOTAL;
}
