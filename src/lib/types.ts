export interface User {
  id: string;
  email: string;
}

export interface Animal {
  id: string;
  name: string;
  species: string;
  verified: boolean;
  imageUrl?: string; // Optional image for the animal
}

export interface Enclosure {
  id: string;
  name: string;
  type: string; // e.g., 'Aviary', 'Reptile House', 'Aquatic'
  animals: Animal[];
  imageUrl?: string; // Optional image for the enclosure
}

export interface Site {
  id: string;
  name: string;
  location: string; // e.g., 'North Sector', 'Tropical Zone'
  enclosures: Enclosure[];
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
