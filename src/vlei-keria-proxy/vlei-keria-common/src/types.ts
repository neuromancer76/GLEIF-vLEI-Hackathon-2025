/**
 * Test type definition for the VLEI Keria Common library
 */
export type Test = {
  id: string;
  name: string;
  value: unknown;
  timestamp: Date;
};

/**
 * Type guard to check if an object is of type Test
 */
export function isTest(obj: unknown): obj is Test {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as Test).id === 'string' &&
    typeof (obj as Test).name === 'string' &&
    (obj as Test).timestamp instanceof Date
  );
}