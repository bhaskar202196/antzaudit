// src/contexts/zoo-data-context.tsx
"use client";
import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import type { Zoo, Site, Section, Enclosure, Animal, User } from '@/lib/types'; // Added Section
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
  'Section Name': string; // Section Name - NEW HIERARCHY LEVEL
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
  getSectionById: (zooId: string, siteId: string, sectionId: string) => Section | undefined; // NEW
  getEnclosureById: (zooId: string, siteId: string, sectionId: string, enclosureId: string) => Enclosure | undefined; // MODIFIED
  updateAnimalVerification: (zooId: string, siteId: string, sectionId: string, enclosureId: string, animalId: string, verified: boolean, verifiedAt?: string) => void; // MODIFIED
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
          location: 'N/A (from CSV Site)', // Site's general location or default
          sections: [], // Initialize sections array
          imageUrl: `https://picsum.photos/seed/${siteId}/600/400`
        };
        zooToPopulate.sites.push(site);
      }

      const sectionName = row['Section Name'];
      if (!sectionName) {
        console.warn(`Skipping row ${index + 2} for animal ${animalIdFromCsv} due to missing Section Name.`);
        return;
      }
      let section = site.sections.find(sec => sec.name === sectionName);
      if (!section) {
        const sectionId = generateCsvEntityId(sectionName, 'section', site.id);
        section = {
          id: sectionId,
          name: sectionName,
          enclosures: [],
          imageUrl: `https://picsum.photos/seed/${sectionId}/600/400`
        };
        site.sections.push(section);
      }

      const enclosureName = row['Enclosure Name'];
      if (!enclosureName) {
         console.warn(`Skipping row ${index + 2} for animal ${animalIdFromCsv} due to missing Enclosure Name.`);
        return;
      }
      let enclosure = section.enclosures.find(e => e.name === enclosureName);
      if (!enclosure) {
        const enclosureId = generateCsvEntityId(enclosureName, 'enc', section.id); // Parent is now section.id
        enclosure = {
          id: enclosureId,
          name: enclosureName,
          type: 'General Enclosure (from CSV)',
          animals: [],
          imageUrl: `https://picsum.photos/seed/${enclosureId}/600/400`
        };
        section.enclosures.push(enclosure);
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

      const animalCountStr = row['Animal Count']?.trim();
      let countFromCsv = 1; // Default interpretation: if field is missing, empty, or invalid, assume 1 for creation.

      if (animalCountStr && animalCountStr !== "") {
        const parsedNum = parseInt(animalCountStr, 10);
        if (!isNaN(parsedNum)) {
          countFromCsv = parsedNum; // Actual number from CSV
        }
        // If parsing fails (e.g., "text" in Animal Count), countFromCsv remains 1.
      }
      
      // New interpretation: create 1 app animal if CSV count > 0, else 0.
      const numAnimalsToGenerateInApp = countFromCsv > 0 ? 1 : 0;

      if (numAnimalsToGenerateInApp === 0) {
        console.log(`CSV Animal Count is ${countFromCsv} for Antz Animal Id ${animalIdFromCsv} (Row ${index + 2}). Interpreted as 0, so no animal instances created for this CSV line.`);
      } else { // numAnimalsToGenerateInApp is 1
        // The loop for (let i = 0; i < numAnimalsToGenerateInApp; i++) will run exactly once.
        const i = 0; // 'i' will be 0 as loop runs once.
        const idNamePart = animalIdFromCsv; // Using Antz Animal Id directly for naming part.
        
        // generateCsvEntityId includes a random suffix, ensuring unique IDs even if idNamePart, enclosure.id, and i were identical across calls.
        const animalInstanceId = generateCsvEntityId(idNamePart, 'animal', enclosure.id, i);
        
        const animalInstance: Animal = {
          ...animalBase,
          id: animalInstanceId,
          name: `${row['Common Name'] || 'Animal'} (${idNamePart})`, // Name reflects the Antz Animal ID.
        };
        enclosure.animals.push(animalInstance);
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
              sites: [], // Initialize with empty sites array
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

  const getSectionById = useCallback((zooId: string, siteId: string, sectionId: string): Section | undefined => { // NEW
    const site = getSiteById(zooId, siteId);
    return site?.sections.find(section => section.id === sectionId);
  }, [getSiteById]);

  const getEnclosureById = useCallback((zooId: string, siteId: string, sectionId: string, enclosureId: string): Enclosure | undefined => { // MODIFIED
    const section = getSectionById(zooId, siteId, sectionId);
    return section?.enclosures.find(enclosure => enclosure.id === enclosureId);
  }, [getSectionById]);

  const updateAnimalVerification = useCallback((zooId: string, siteId: string, sectionId: string, enclosureId: string, animalId: string, verified: boolean, verifiedAt?: string) => { // MODIFIED
    setZoos(prevZoos => {
      return prevZoos.map(zoo => {
        if (zoo.id === zooId) {
          return {
            ...zoo,
            sites: zoo.sites.map(site => {
              if (site.id === siteId) {
                return {
                  ...site,
                  sections: site.sections.map(currentSection => { // Iterate through sections
                    if (currentSection.id === sectionId) {
                      return {
                        ...currentSection,
                        enclosures: currentSection.enclosures.map(enclosure => {
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
                    return currentSection;
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
    getSectionById, // Add new getter
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

