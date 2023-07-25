import { DataItem } from '@/types/remote';

export const mergeData = (
  local: DataItem[],
  remote: DataItem[],
): DataItem[] => {
  const merged: DataItem[] = [...local];
  remote.forEach((remoteItem) => {
    try {
      const localIndex = merged.findIndex(
        (localItem) => localItem.id === remoteItem.id,
      );
      if (localIndex > -1) {
        merged[localIndex] = remoteItem;
      } else {
        merged.push(remoteItem);
      }
    } catch (error) {}
  });
  return merged;
};


export const toArray = (obj: any) =>  {
    if (Array.isArray(obj)) {
      return obj;
    } else {
      return [];
    }
  }

export const parse = <T>(input: T | string): T | null | undefined => {
    if (typeof input === 'string') {
        try {
            return JSON.parse(input) as T;
        } catch (error) {
            throw new Error("Invalid JSON string");
        }
    } else {
        return input as T;
    }
}

