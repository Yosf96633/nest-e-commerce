export const ROLE_VALUES = ['customer', 'seller', 'rider', 'admin'] as const;

export type Role = (typeof ROLE_VALUES)[number];
