
export interface User {
  id: string;
  email: string;
}

export interface Animal {
  id: string; // Corresponds to 'Antz Animal Id'
  name: string; // e.g., 'Leo' or 'Common Name (ID)' if individual name not available
  species: string; // Corresponds to 'Scientific Name'
  verified: boolean;
  verifiedAt?: string; // ISO string for when the animal was last verified
  imageUrl?: string; // Optional image for the animal

  // Fields from CSV
  gender?: string;
  microChip?: string;
  ringNumber?: string;
  identifierType?: string;
  identifierValue?: string;
  // 'Type Of Animal' from CSV (e.g. "group", "single") might be stored as 'groupingStrategy' or similar if needed
  // 'Animal Count' is used during parsing to create multiple animal instances if > 1.
  breedName?: string;
  morphName?: string;
  weight?: string;
  age?: string; // e.g., "5d"
  accessionDate?: string; // Date string
  accessionType?: string;
  birthDate?: string; // Date string
  addedOnAntz?: string; // Date string, likely when record was created in source system
  commonName?: string; // Store original 'Common Name' from CSV if distinct from 'name'
  csvRowNumber?: number; // For debugging or reference

  // New boolean features
  nightCellPresence?: boolean;
  airConditioning?: boolean;
  camera?: boolean;
}

export interface Enclosure {
  id: string;
  name: string;
  type: string; // e.g., 'Aviary', 'Reptile House', 'Aquatic'
  animals: Animal[];
  imageUrl?: string; // Optional image for the enclosure
}

// New Section interface
export interface Section {
  id: string;
  name: string; // Corresponds to 'Section Name' from CSV
  enclosures: Enclosure[];
  imageUrl?: string; // Optional image for the section
}

export interface Site {
  id: string;
  name: string; // Corresponds to 'Site/Facility' from CSV
  location: string; // General location for the site, can be derived or static
  sections: Section[]; // Changed from enclosures: Enclosure[]
  imageUrl?: string; // Optional image for the site
}

export interface Zoo {
  id: string;
  name: string;
  city: string;
  userId: string; // To associate with a user
  sites: Site[];
  imageUrl?: string; // Optional image for the zoo
}
