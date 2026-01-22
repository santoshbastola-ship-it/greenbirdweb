import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:image_picker/image_picker.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:uuid/uuid.dart';

class ImageService {
  final ImagePicker _picker = ImagePicker();
  final FirebaseStorage _storage = FirebaseStorage.instance;

  // Pick multiple images
  Future<List<XFile>> pickImages({int maxImages = 2}) async {
    try {
      if (maxImages > 1) {
         // limit is not directly supported by pickMultiImage in all platforms but we can slice result
         final List<XFile> images = await _picker.pickMultiImage(imageQuality: 70);
         if (images.length > maxImages) {
           return images.sublist(0, maxImages);
         }
         return images;
      } else {
        final XFile? image = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
        return image != null ? [image] : [];
      }
    } catch (e) {
      print('Error picking images: $e');
      throw e; // Rethrow to let UI show error
    }
  }

  // Upload single image (works for Web & Mobile via XFile)
  Future<String?> uploadImage(XFile file, String folder) async {
    try {
      // Check file size (Max 150KB = 153,600 bytes)
      final int distinctSize = await file.length();
      if (distinctSize > 153600) {
        throw Exception("Image too large. Max size is 150KB.");
      }

      final String uuid = const Uuid().v4();
      final String extension = file.name.split('.').last;
      final String path = '$folder/$uuid.$extension';
      
      final Reference ref = _storage.ref().child(path);
      
      // Upload task
      final Uint8List data = await file.readAsBytes();
      final UploadTask task = ref.putData(data, SettableMetadata(contentType: 'image/$extension'));

      // Wait for completion
      final TaskSnapshot snapshot = await task;
      final String downloadUrl = await snapshot.ref.getDownloadURL();
      print("ImageService: Uploaded image to $downloadUrl");
      return downloadUrl;
    } catch (e) {
      print('Error uploading image: $e');
      return null;
    }
  }

  // Upload multiple images
  Future<List<String>> uploadImages(List<XFile> files, String folder) async {
    List<String> urls = [];
    for (var file in files) {
      String? url = await uploadImage(file, folder);
      if (url != null) {
        urls.add(url);
      }
    }
    return urls;
  }
}
