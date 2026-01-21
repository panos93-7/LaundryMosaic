import * as FileSystem from "expo-file-system";

export async function imageToBase64(uri: string) {
  return await FileSystem.readAsStringAsync(uri, {
    encoding: "base64",
  });
}