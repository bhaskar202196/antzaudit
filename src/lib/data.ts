import type { Zoo, User } from './types';

export const MOCK_USERS: User[] = [
  { id: 'user1', email: 'auditor@example.com' },
];

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
        name: 'African Savannah',
        location: 'North Sector',
        imageUrl: 'https://picsum.photos/seed/siteA/600/400',
        enclosures: [
          {
            id: 'enc1',
            name: 'Lion Pride Rock',
            type: 'Large Mammal Exhibit',
            imageUrl: 'https://picsum.photos/seed/enc1/600/400',
            animals: [
              { id: 'animal1', name: 'Leo', species: 'Lion', verified: false, imageUrl: 'https://picsum.photos/seed/animal1/100/100' },
              { id: 'animal2', name: 'Leona', species: 'Lion', verified: true, imageUrl: 'https://picsum.photos/seed/animal2/100/100' },
            ],
          },
          {
            id: 'enc2',
            name: 'Zebra Plains',
            type: 'Hoofed Animals Area',
            imageUrl: 'https://picsum.photos/seed/enc2/600/400',
            animals: [
              { id: 'animal3', name: 'Stripes', species: 'Zebra', verified: false, imageUrl: 'https://picsum.photos/seed/animal3/100/100' },
            ],
          },
        ],
      },
      {
        id: 'siteB',
        name: 'Amazon Rainforest Pavilion',
        location: 'West Sector',
        imageUrl: 'https://picsum.photos/seed/siteB/600/400',
        enclosures: [
          {
            id: 'enc3',
            name: 'Monkey Jungle',
            type: 'Primate Habitat',
            imageUrl: 'https://picsum.photos/seed/enc3/600/400',
            animals: [
              { id: 'animal4', name: 'Miko', species: 'Capuchin Monkey', verified: false, imageUrl: 'https://picsum.photos/seed/animal4/100/100' },
              { id: 'animal5', name: 'Momo', species: 'Capuchin Monkey', verified: false, imageUrl: 'https://picsum.photos/seed/animal5/100/100' },
            ],
          },
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
        name: 'Arctic Tundra',
        location: 'Polar Zone',
        imageUrl: 'https://picsum.photos/seed/siteC/600/400',
        enclosures: [
          {
            id: 'enc4',
            name: 'Polar Bear Ice Caps',
            type: 'Arctic Exhibit',
            imageUrl: 'https://picsum.photos/seed/enc4/600/400',
            animals: [
              { id: 'animal6', name: 'Snowy', species: 'Polar Bear', verified: true, imageUrl: 'https://picsum.photos/seed/animal6/100/100' },
            ],
          },
        ],
      },
    ],
  },
];

// Helper functions to get data
export const getZoosByUserId = (userId: string): Zoo[] => {
  return MOCK_ZOOS.filter(zoo => zoo.userId === userId);
}

export const getZooById = (zooId: string): Zoo | undefined => {
  return MOCK_ZOOS.find(zoo => zoo.id === zooId);
}

export const getSiteById = (zoo: Zoo, siteId: string) => {
  return zoo.sites.find(site => site.id === siteId);
}

export const getEnclosureById = (site: NonNullable<ReturnType<typeof getSiteById>>, enclosureId: string) => {
  return site.enclosures.find(enclosure => enclosure.id === enclosureId);
}
