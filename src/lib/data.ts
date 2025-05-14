import type { Zoo, User, Section } from './types'; // Added Section to imports

export const MOCK_USERS: User[] = [
  { id: 'user1', email: 'auditor@example.com' },
];

// Renamed to INITIAL_MOCK_ZOOS to indicate it's the starting data for the context
export const MOCK_ZOOS: Zoo[] = [
  {
    id: 'zoo1',
    name: 'Central City Zoo',
    city: 'Central City',
    userId: 'user1',
    imageUrl: 'https://picsum.photos/seed/zoo1/600/400',
    sites: [
      {
        id: 'siteA',
        name: 'African Savannah', // Site/Facility
        location: 'Main Park Area', // General location for the site
        imageUrl: 'https://picsum.photos/seed/siteA/600/400',
        sections: [ // Sections within African Savannah site
          {
            id: 'sectionA1',
            name: 'North Sector', // Section Name
            imageUrl: 'https://picsum.photos/seed/sectionA1/600/400',
            enclosures: [
              {
                id: 'enc1',
                name: 'Lion Pride Rock',
                type: 'Large Mammal Exhibit',
                imageUrl: 'https://picsum.photos/seed/enc1/600/400',
                animals: [
                  {
                    id: 'animal1', name: 'Leo', species: 'Panthera leo', verified: false,
                    imageUrl: 'https://picsum.photos/seed/animal1/100/100', commonName: 'Lion',
                    gender: 'Male',
                    microChip: 'MC12345LION',
                    ringNumber: 'RNLION001',
                    identifierType: 'Tattoo ID',
                    identifierValue: 'TAT-LION-01',
                    breedName: 'African Lion',
                    morphName: 'Standard',
                    weight: '190kg',
                    age: '5yr',
                    accessionDate: '2020-03-15',
                    accessionType: 'Born in Zoo',
                    birthDate: '2019-02-10',
                    addedOnAntz: '2019-02-12',
                  },
                  {
                    id: 'animal2', name: 'Leona', species: 'Panthera leo', verified: true,
                    verifiedAt: new Date(Date.now() - 86400000).toISOString(),
                    imageUrl: 'https://picsum.photos/seed/animal2/100/100', commonName: 'Lion',
                    gender: 'Female',
                    weight: '130kg',
                    age: '4yr',
                  },
                ],
              },
              {
                id: 'enc2',
                name: 'Zebra Plains',
                type: 'Hoofed Animals Area',
                imageUrl: 'https://picsum.photos/seed/enc2/600/400',
                animals: [
                  {
                    id: 'animal3', name: 'Stripes', species: 'Equus quagga', verified: false,
                    imageUrl: 'https://picsum.photos/seed/animal3/100/100', commonName: 'Zebra',
                    gender: 'Male',
                    microChip: 'MCZEB001',
                    identifierType: 'Ear Tag',
                    identifierValue: 'ETZ-007',
                    age: '3yr',
                  },
                ],
              },
            ],
          }
        ],
      },
      {
        id: 'siteB',
        name: 'Amazon Rainforest Pavilion',
        location: 'Indoor Exhibits',
        imageUrl: 'https://picsum.photos/seed/siteB/600/400',
        sections: [
          {
            id: 'sectionB1',
            name: 'West Sector', // Section Name
            imageUrl: 'https://picsum.photos/seed/sectionB1/600/400',
            enclosures: [
              {
                id: 'enc3',
                name: 'Monkey Jungle',
                type: 'Primate Habitat',
                imageUrl: 'https://picsum.photos/seed/enc3/600/400',
                animals: [
                  {
                    id: 'animal4', name: 'Miko', species: 'Cebus capucinus', verified: false,
                    imageUrl: 'https://picsum.photos/seed/animal4/100/100', commonName: 'Capuchin Monkey',
                    gender: 'Male',
                    ringNumber: 'RNCAPM1',
                    breedName: 'Tufted Capuchin',
                    age: '2yr',
                  },
                  {
                    id: 'animal5', name: 'Momo', species: 'Cebus capucinus', verified: false,
                    imageUrl: 'https://picsum.photos/seed/animal5/100/100', commonName: 'Capuchin Monkey',
                    gender: 'Female',
                    age: '2.5yr',
                  },
                ],
              },
            ],
          }
        ],
      },
    ],
  },
  {
    id: 'zoo2',
    name: 'Mountain View Safari',
    city: 'Hill Valley',
    userId: 'user1',
    imageUrl: 'https://picsum.photos/seed/zoo2/600/400',
    sites: [
      {
        id: 'siteC',
        name: 'Arctic Tundra', // Site/Facility
        location: 'Cold Climate Zone',
        imageUrl: 'https://picsum.photos/seed/siteC/600/400',
        sections: [
          {
            id: 'sectionC1',
            name: 'Polar Zone', // Section Name
            imageUrl: 'https://picsum.photos/seed/sectionC1/600/400',
            enclosures: [
              {
                id: 'enc4',
                name: 'Polar Bear Ice Caps',
                type: 'Arctic Exhibit',
                imageUrl: 'https://picsum.photos/seed/enc4/600/400',
                animals: [
                  {
                    id: 'animal6', name: 'Snowy', species: 'Ursus maritimus', verified: true,
                    verifiedAt: new Date(Date.now() - 2*86400000).toISOString(),
                    imageUrl: 'https://picsum.photos/seed/animal6/100/100', commonName: 'Polar Bear',
                    gender: 'Female',
                    microChip: 'MCPOLAR01',
                    breedName: 'Arctic Polar Bear',
                    weight: '400kg',
                    age: '8yr',
                  },
                ],
              },
            ],
          }
        ],
      },
    ],
  },
];

// Data fetching/retrieval functions (getZooById, getSiteById, etc.) are now part of ZooDataContext
// This file now primarily serves to export initial mock data and user data.
