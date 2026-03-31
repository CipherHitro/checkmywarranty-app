import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Documents = () => {
  const [documents, setDocuments] = useState<any[]>([]);

  const openCamera = async () => {
    await ImagePicker.requestCameraPermissionsAsync();
    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
    });

    if (!result.canceled) {
      setDocuments(prev => [...prev, { ...result.assets[0], type: 'image' }]);
    }
  }

  const pickFile = async () => {
    // MediaLibrary permissions is mostly for MediaLibrary usage, but optional here
    // await ImagePicker.requestMediaLibraryPermissionsAsync();
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
    });

    if (result.assets) {
      setDocuments(prev => [...prev, { ...result.assets[0], type: 'document' }]);
    }
  }

  const showOptions = () => {
    Alert.alert(
      "Upload", 
      "Choose an option", 
      [
        { text: "Camera", onPress: openCamera }, 
        { text: "File", onPress: pickFile },
        { text: "Cancel", style: "cancel" }
      ]
    );
  }

  const renderDocumentItem = ({ item }: { item: any }) => {
    const isImage = item.type === 'image' || 
                   item.mimeType?.includes('image') || 
                   item.uri.match(/\.(jpeg|jpg|png|gif)$/i);

    return (
      <View style={styles.documentItem}>
        {isImage ? (
          <Image source={{ uri: item.uri }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, styles.filePlaceholder]}>
            <Ionicons name="document-text" size={24} color="#6e6496" />
          </View>
        )}
        <View style={styles.documentInfo}>
          <Text style={styles.documentName} numberOfLines={1}>
            {item.name || item.fileName || `Captured Image_${Date.now().toString().slice(-4)}`}
          </Text>
          {item.size && (
            <Text style={styles.documentSize}>
              {(item.size / 1024).toFixed(1)} KB
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>My Documents</Text>
          <Text style={styles.subtext}>Manage your warranty documents</Text>
        </View>
        {documents.length > 0 && (
          <TouchableOpacity style={styles.smallUploadButton} onPress={showOptions}>
            <Ionicons name="cloud-upload-outline" size={18} color="#ffffff" />
            <Text style={styles.smallUploadText}>Upload</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        {documents.length === 0 ? (
          <TouchableOpacity style={styles.uploadCard} activeOpacity={0.7} onPress={showOptions}>
            <View style={styles.iconContainer}>
              <Ionicons name="cloud-upload-outline" size={48} color="#6e6496" />
            </View>
            <Text style={styles.uploadTitle}>Tap to Upload</Text>
            <Text style={styles.uploadSubtitle}>PDF, JPG, PNG files supported</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>Recent Uploads</Text>
            <FlatList
              data={documents}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderDocumentItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.flatListContent}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e1dfea',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  smallUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6e6496',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginLeft: 12,
  },
  smallUploadText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333333',
  },
  subtext: {
    fontSize: 15,
    color: '#666666',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  uploadCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#e5e3ec',
    borderStyle: 'dashed',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f4f2f7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#888888',
  },
  listContainer: {
    flex: 1,
    marginTop: 0,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  flatListContent: {
    paddingBottom: 24,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#f4f2f7',
  },
  filePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  documentSize: {
    fontSize: 13,
    color: '#888888',
  },
});

export default Documents;