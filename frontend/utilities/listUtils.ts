// JavaScript program to serialize and
// deserialize the array of string

// Function to serialized the array of string
export function serialize_list(list: any[]) {
  return list.toString();
}

// Function to deserialize the string
export function deserialize_list(str: string) {
  return Array.from(str.split(","));
}
