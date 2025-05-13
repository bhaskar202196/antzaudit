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
  replaceGlobalZoosFromCsv: (csvString: string, currentUser: User) => Promise<{ success: boolean; error?: string }>;
  createZoo: (details: { name: string, city: string }, csvString: string | null, currentUser: User) => Promise<{ success: boolean; newZooId?: string; error?: string }>;
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

  const parseAndPopulateZoos = useCallback((
    csvString: string,
    currentUser: User,
    targetZooInit?: { id: string; name: string; city: string; userId: string; imageUrl?: string }
  ): { zoos: Zoo[]; error?: string } => {
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

    const processRowData = (row: CsvRow, index: number, zooToPopulate: Zoo) => {
      const animalIdFromCsv = row['Antz Animal Id'];
       if (!animalIdFromCsv) {
        console.warn(`Skipping row ${index + 2} due to missing Antz Animal Id.`);
        return;
      }

      const siteName = row['Site/Facilty'];
      if (!siteName) {
        console.warn(`Skipping row ${index + 2} for animal ${animalIdFromCsv} due to missing Site/Facility name.`);
        return;
      }
      let site = zooToPopulate.sites.find(s => s.name === siteName);
      if (!site) {
        const siteId = generateCsvEntityId(siteName, 'site', zooToPopulate.id);
        site = {
          id: siteId,
          name: siteName,
          location: row['Section Name'] || 'N/A (from CSV)',
          enclosures: [],
          imageUrl: `https://picsum.photos/seed/${siteId}/600/400`
        };
        zooToPopulate.sites.push(site);
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
          type: 'General Enclosure (from CSV)',
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
        imageUrl: `https://picsum.photos/seed/animal${animalIdFromCsv.replace(/[^a-zA-Z0-9]/g, '')}/100/100`, // Sanitize ID for URL
        csvRowNumber: index + 2,
      };

      const animalCount = parseInt(row['Animal Count'], 10);
      if (isNaN(animalCount) || animalCount < 1) {
        const animal: Animal = {
          ...animalBase,
          id: generateCsvEntityId(animalIdFromCsv, 'animal', enclosure.id), // Ensure unique ID within enclosure
          name: `${row['Common Name'] || 'Animal'} (${animalIdFromCsv})`,
        };
        enclosure.animals.push(animal);
      } else {
        for (let i = 0; i < animalCount; i++) {
          const uniqueInstanceSuffix = animalCount > 1 ? `-instance-${i + 1}` : '';
          const animalInstanceId = generateCsvEntityId(`${animalIdFromCsv}${uniqueInstanceSuffix}`, 'animal', enclosure.id, i);
          const animalInstance: Animal = {
            ...animalBase,
            id: animalInstanceId,
            name: `${row['Common Name'] || 'Animal'} (${animalIdFromCsv}${uniqueInstanceSuffix})`,
          };
          enclosure.animals.push(animalInstance);
        }
      }
    };


    if (targetZooInit) {
      const populatedZoo: Zoo = {
        id: targetZooInit.id,
        name: targetZooInit.name,
        city: targetZooInit.city,
        userId: targetZooInit.userId,
        sites: [],
        imageUrl: targetZooInit.imageUrl || `https://picsum.photos/seed/${targetZooInit.id}/600/400`,
      };
      parsedData.forEach((row, index) => processRowData(row, index, populatedZoo));
      return { zoos: [populatedZoo] };
    } else {
      // Global CSV processing: creates zoos based on 'Organization Name'
      const zoosMap = new Map<string, Zoo>();
      parsedData.forEach((row, index) => {
        const zooName = row['Organization Name'];
        if (!zooName) {
          console.warn(`Skipping row ${index + 2} due to missing Organization Name.`);
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
        processRowData(row, index, zoo);
      });
      return { zoos: Array.from(zoosMap.values()) };
    }
  }, []);


  const replaceGlobalZoosFromCsv = useCallback(async (csvString: string, currentUser: User): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    return new Promise(resolve => {
      setTimeout(() => { 
        try {
          const { zoos: parsedZoos, error: parseError } = parseAndPopulateZoos(csvString, currentUser);
          if (parseError) {
            setIsLoading(false);
            resolve({ success: false, error: parseError });
            return;
          }
          setZoos(parsedZoos); // Replace all existing data
          setIsLoading(false);
          resolve({ success: true });
        } catch (e: any) {
          setIsLoading(false);
          console.error("Error in replaceGlobalZoosFromCsv: ", e);
          resolve({ success: false, error: e.message || "Failed to parse or process CSV data" });
        }
      }, 50);
    });
  }, [parseAndPopulateZoos]);

  const createZoo = useCallback(async (
    details: { name: string, city: string },
    csvString: string | null,
    currentUser: User
  ): Promise<{ success: boolean; newZooId?: string; error?: string }> => {
    setIsLoading(true);
    return new Promise(resolve => {
      setTimeout(() => {
        try {
          const newZooId = generateCsvEntityId(details.name, 'zoo');
          let newZoo: Zoo;

          if (csvString) {
            const { zoos: populatedZoos, error: parseError } = parseAndPopulateZoos(csvString, currentUser, {
              id: newZooId,
              name: details.name,
              city: details.city,
              userId: currentUser.id,
            });
            if (parseError || populatedZoos.length === 0) {
              setIsLoading(false);
              resolve({ success: false, error: parseError || "CSV processing led to no zoo data." });
              return;
            }
            newZoo = populatedZoos[0];
          } else {
            newZoo = {
              id: newZooId,
              name: details.name,
              city: details.city,
              userId: currentUser.id,
              sites: [],
              imageUrl: `https://picsum.photos/seed/${newZooId}/600/400`,
            };
          }
          
          setZoos(prevZoos => [...prevZoos, newZoo]);
          setIsLoading(false);
          resolve({ success: true, newZooId });

        } catch (e: any) {
          setIsLoading(false);
          console.error("Error in createZoo: ", e);
          resolve({ success: false, error: e.message || "Failed to create zoo" });
        }
      }, 50);
    });
  }, [parseAndPopulateZoos]);


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
    replaceGlobalZoosFromCsv,
    createZoo,
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
