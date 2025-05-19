import type { Zoo, User, Section } from './types'; // Added Section to imports

export const MOCK_USERS: User[] = [
  { id: 'user1', email: 'auditor@example.com' },
];

// Renamed to INITIAL_MOCK_ZOOS to indicate it's the starting data for the context
// This is now empty to remove demo zoos
export const MOCK_ZOOS: Zoo[] = [];

// Data fetching/retrieval functions (getZooById, getSiteById, etc.) are now part of ZooDataContext
// This file now primarily serves to export initial mock data and user data.
