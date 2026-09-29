import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export const canUseCamera = Platform.OS !== 'web';

/**
 * Lets the user pick (or shoot) a photo, then resizes and compresses it.
 * Returns a JPEG data URI small enough to store locally or upload.
 */
export async function choosePhoto(opts: {
  source: 'library' | 'camera';
  aspect: [number, number];
  width: number;
}): Promise<string | null> {
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: opts.aspect,
    quality: 1,
  };
  let result: ImagePicker.ImagePickerResult;
  if (opts.source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new Error('Permita o acesso à câmera nos ajustes do celular.');
    result = await ImagePicker.launchCameraAsync(options);
  } else {
    result = await ImagePicker.launchImageLibraryAsync(options);
  }
  if (result.canceled || !result.assets[0]) return null;

  const rendered = await ImageManipulator.manipulate(result.assets[0].uri).resize({ width: opts.width }).renderAsync();
  const saved = await rendered.saveAsync({ compress: 0.7, format: SaveFormat.JPEG, base64: true });
  return saved.base64 ? `data:image/jpeg;base64,${saved.base64}` : saved.uri;
}
