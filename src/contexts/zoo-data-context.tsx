// src/contexts/zoo-data-context.tsx
"use client";
import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import type { Zoo, Site, Enclosure, Animal, User } from '@/lib/types';
import { MOCK_ZOOS as INITIAL_MOCK_ZOOS } from '@/lib/data';
import Papa from 'papaparse';
import { generateCsvEntityId } from '@/lib/utils';

// Define a type for the parsed CSV row, matching provided headers
interface CsvRow {
  'Antz Animal Id': string;
  'Micro Chip'?: string;
  'Ring Number'?: string;
  'Scientific Name': string;
  'Common Name': string;
  'Gender': string;
  'Identifier Type'?: string;
  'Identifier Value'?: string;
  'Type Of Animal': string; // e.g. "group", "single" from sample
  'Animal Count': string;
  'Site/Facilty': string; // Site Name
  'Section Name': string; // Site Location
  'Enclosure Name': string;
  'Organization Name': string; // Zoo Name
  'Breed Name'?: string;
  'Morph Name'?: string;
  'Weight'?: string;
  'Age'?: string;
  'Accession Date'?: string;
  'Accession Type'?: string;
  'Birth Date'?: string;
  'Added On Antz'?: string;
}

interface ZooDataContextType {
  zoos: Zoo[];
  loadZoosFromCsv: (csvString: string, currentUser: User) => Promise<{ success: boolean; error?: string }>;
  getZooById: (zooId: string) => Zoo | undefined;
  getSiteById: (zooId: string, siteId: string) => Site | undefined;
  getEnclosureById: (zooId: string, siteId: string, enclosureId: string) => Enclosure | undefined;
  updateAnimalVerification: (zooId: string, siteId: string, enclosureId: string, animalId: string, verified: boolean, verifiedAt?: string) => void;
  isLoading: boolean;
}

const ZooDataContext = createContext<ZooDataContextType | undefined>(undefined);

export const ZooDataProvider = ({ children }: { children: ReactNode }) => {
  const [zoos, setZoos] = useState<Zoo[]>(INITIAL_MOCK_ZOOS);
  const [isLoading, setIsLoading] = useState(false);

  const parseCsvDataToZoos = useCallback((csvString: string, currentUser: User): { zoos: Zoo[], error?: string } => {
    const results = Papa.parse<CsvRow>(csvString, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim(),
    });

    if (results.errors.length > 0) {
      console.error("CSV Parsing Errors:", results.errors);
      return { zoos: [], error: results.errors.map(err => err.message).join(', ') };
    }

    const parsedData = results.data;
    const zoosMap = new Map<string, Zoo>();

    parsedData.forEach((row, index) => {
      const zooName = row['Organization Name'];
      const animalIdFromCsv = row['Antz Animal Id'];

      if (!zooName || !animalIdFromCsv) {
        console.warn(`Skipping row ${index + 2} due to missing Organization Name ('${zooName}') or Antz Animal Id ('${animalIdFromCsv}').`);
        return;
      }

      let zoo = zoosMap.get(zooName);
      if (!zoo) {
        const zooId = generateCsvEntityId(zooName, 'zoo');
        zoo = {
          id: zooId,
          name: zooName,
          city: 'N/A (from CSV)',
          userId: currentUser.id,
          sites: [],
          imageUrl: `https://picsum.photos/seed/${zooId}/600/400`
        };
        zoosMap.set(zooName, zoo);
      }

      const siteName = row['Site/Facilty'];
      if (!siteName) {
        console.warn(`Skipping row ${index + 2} for animal ${animalIdFromCsv} due to missing Site/Facility name.`);
        return;
      }
      let site = zoo.sites.find(s => s.name === siteName);
      if (!site) {
        const siteId = generateCsvEntityId(siteName, 'site', zoo.id);
        site = {
          id: siteId,
          name: siteName,
          location: row['Section Name'] || 'N/A (from CSV)',
          enclosures: [],
          imageUrl: `https://picsum.photos/seed/${siteId}/600/400`
        };
        zoo.sites.push(site);
      }

      const enclosureName = row['Enclosure Name'];
      if (!enclosureName) {
         console.warn(`Skipping row ${index + 2} for animal ${animalIdFromCsv} due to missing Enclosure Name.`);
        return;
      }
      let enclosure = site.enclosures.find(e => e.name === enclosureName);
      if (!enclosure) {
        const enclosureId = generateCsvEntityId(enclosureName, 'enc', site.id);
        enclosure = {
          id: enclosureId,
          name: enclosureName,
          type: 'General Enclosure (from CSV)', // CSV 'Type Of Animal' seems to be about grouping not enclosure physical type
          animals: [],
          imageUrl: `https://picsum.photos/seed/${enclosureId}/600/400`
        };
        site.enclosures.push(enclosure);
      }
      
      const animalBase: Omit<Animal, 'id' | 'name'> = {
        species: row['Scientific Name'] || 'Unknown Species',
        verified: false,
        gender: row['Gender'],
        microChip: row['Micro Chip'],
        ringNumber: row['Ring Number'],
        identifierType: row['Identifier Type'],
        identifierValue: row['Identifier Value'],
        breedName: row['Breed Name'],
        morphName: row['Morph Name'],
        weight: row['Weight'],
        age: row['Age'],
        accessionDate: row['Accession Date'],
        accessionType: row['Accession Type'],
        birthDate: row['Birth Date'],
        addedOnAntz: row['Added On Antz'],
        commonName: row['Common Name'],
        imageUrl: `https://picsum.photos/seed/animal${animalIdFromCsv}/100/100`,
        csvRowNumber: index + 2,
      };

      const animalCount = parseInt(row['Animal Count'], 10);
      if (isNaN(animalCount) || animalCount < 1) {
        const animal: Animal = {
          ...animalBase,
          id: animalIdFromCsv,
          name: `${row['Common Name'] || 'Animal'} (${animalIdFromCsv})`,
        };
        enclosure.animals.push(animal);
      } else {
        for (let i = 0; i < animalCount; i++) {
          const uniqueAnimalId = animalCount > 1 ? `${animalIdFromCsv}-instance-${i + 1}` : animalIdFromCsv;
          const animalInstance: Animal = {
            ...animalBase,
            id: uniqueAnimalId,
            name: `${row['Common Name'] || 'Animal'} (${uniqueAnimalId})`,
          };
          enclosure.animals.push(animalInstance);
        }
      }
    });
    return { zoos: Array.from(zoosMap.values()) };
  }, []);


  const loadZoosFromCsv = useCallback(async (csvString: string, currentUser: User): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    return new Promise(resolve => {
      setTimeout(() => { // Simulate async processing / give UI time to update
        try {
          const { zoos: parsedZoos, error: parseError } = parseCsvDataToZoos(csvString, currentUser);
          if (parseError) {
            setIsLoading(false);
            resolve({ success: false, error: parseError });
            return;
          }
          // For now, CSV data replaces all existing data.
          // Could be changed to merge or add based on requirements.
          setZoos(parsedZoos);
          setIsLoading(false);
          resolve({ success: true });
        } catch (e: any) {
          setIsLoading(false);
          console.error("Error in loadZoosFromCsv: ", e);
          resolve({ success: false, error: e.message || "Failed to parse or process CSV data" });
        }
      }, 50);
    });
  }, [parseCsvDataToZoos]);


  const getZooById = useCallback((zooId: string): Zoo | undefined => {
    return zoos.find(zoo => zoo.id === zooId);
  }, [zoos]);

  const getSiteById = useCallback((zooId: string, siteId: string): Site | undefined => {
    const zoo = getZooById(zooId);
    return zoo?.sites.find(site => site.id === siteId);
  }, [getZooById]);

  const getEnclosureById = useCallback((zooId: string, siteId: string, enclosureId: string): Enclosure | undefined => {
    const site = getSiteById(zooId, siteId);
    return site?.enclosures.find(enclosure => enclosure.id === enclosureId);
  }, [getSiteById]);

  const updateAnimalVerification = useCallback((zooId: string, siteId: string, enclosureId: string, animalId: string, verified: boolean, verifiedAt?: string) => {
    setZoos(prevZoos => {
      return prevZoos.map(zoo => {
        if (zoo.id === zooId) {
          return {
            ...zoo,
            sites: zoo.sites.map(site => {
              if (site.id === siteId) {
                return {
                  ...site,
                  enclosures: site.enclosures.map(enclosure => {
                    if (enclosure.id === enclosureId) {
                      return {
                        ...enclosure,
                        animals: enclosure.animals.map(animal => {
                          if (animal.id === animalId) {
                            return { ...animal, verified, verifiedAt };
                          }
                          return animal;
                        })
                      };
                    }
                    return enclosure;
                  })
                };
              }
              return site;
            })
          };
        }
        return zoo;
      });
    });
  }, []);

  const value = { 
    zoos, 
    loadZoosFromCsv, 
    getZooById, 
    getSiteById, 
    getEnclosureById, 
    updateAnimalVerification, 
    isLoading 
  };

  return (
    <ZooDataContext.Provider value={value}>
      {children}
    </ZooDataContext.Provider>
  );
};

export const useZooData = () => {
  const context = useContext(ZooDataContext);
  if (!context) {
    throw new Error('useZooData must be used within a ZooDataProvider');
  }
  return context;
};
