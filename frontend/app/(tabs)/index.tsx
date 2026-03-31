import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getToken } from '@/utils/auth';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Document {
  id: number;
  user_id: number;
  file_url: string;
  original_filename: string;
  expiry_date: string | null;
  created_at: string;
}

const Documents = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [pendingFile, setPendingFile] = useState<any>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${BACKEND_URL}/manageData/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error('Fetch documents error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDocuments();
  };

  const uploadFile = async (fileAsset: any, expiry?: string) => {
    setUploading(true);
    try {
      const token = await getToken();
      const formData = new FormData();

      const fileUri = fileAsset.uri;
      const fileName = fileAsset.name || fileAsset.fileName || `upload_${Date.now()}.jpg`;
      const fileType = fileAsset.mimeType || 'application/octet-stream';

      formData.append('file', {
        uri: fileUri,
        name: fileName,
        type: fileType,
      } as any);

      if (expiry) {
        formData.append('expiry_date', expiry);
      }

      const response = await fetch(`${BACKEND_URL}/manageData/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Document uploaded successfully');
        fetchDocuments();
      } else {
        Alert.alert('Upload Failed', data.message || 'Could not upload file');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Could not connect to the server');
    } finally {
      setUploading(false);
    }
  };

  const promptExpiryAndUpload = (fileAsset: any) => {
    setPendingFile(fileAsset);
    setExpiryDate('');
    setShowExpiryModal(true);
  };

  const handleExpirySubmit = () => {
    setShowExpiryModal(false);
    if (pendingFile) {
      uploadFile(pendingFile, expiryDate || undefined);
      setPendingFile(null);
    }
  };

  const handleSkipExpiry = () => {
    setShowExpiryModal(false);
    if (pendingFile) {
      uploadFile(pendingFile);
      setPendingFile(null);
    }
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      promptExpiryAndUpload({
        uri: result.assets[0].uri,
        name: `photo_${Date.now()}.jpg`,
        mimeType: 'image/jpeg',
      });
    }
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
    });

    if (result.assets && result.assets[0]) {
      promptExpiryAndUpload(result.assets[0]);
    }
  };

  const showOptions = () => {
    Alert.alert('Upload', 'Choose an option', [
      { text: 'Camera', onPress: openCamera },
      { text: 'File', onPress: pickFile },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const deleteDocument = async (docId: number) => {
    Alert.alert('Delete', 'Are you sure you want to delete this document?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await getToken();
            const response = await fetch(
              `${BACKEND_URL}/manageData/documents/${docId}`,
              {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            if (response.ok) {
              setDocuments((prev) => prev.filter((d) => d.id !== docId));
            } else {
              Alert.alert('Error', 'Could not delete document');
            }
          } catch (error) {
            Alert.alert('Error', 'Could not connect to server');
          }
        },
      },
    ]);
  };

  const getFileUrl = (fileUrl: string) => `${BACKEND_URL}${fileUrl}`;

  const isImageFile = (filename: string) =>
    /\.(jpeg|jpg|png|webp|gif)$/i.test(filename);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderDocumentItem = ({ item }: { item: Document }) => {
    const isImage = isImageFile(item.original_filename || item.file_url);

    return (
      <TouchableOpacity
        style={styles.documentItem}
        activeOpacity={0.7}
        onLongPress={() => deleteDocument(item.id)}
      >
        {isImage ? (
          <Image
            source={{ uri: getFileUrl(item.file_url) }}
            style={styles.thumbnail}
          />
        ) : (
          <View style={[styles.thumbnail, styles.filePlaceholder]}>
            <Ionicons name="document-text" size={24} color="#6e6496" />
          </View>
        )}
        <View style={styles.documentInfo}>
          <Text style={styles.documentName} numberOfLines={1}>
            {item.original_filename || 'Untitled Document'}
          </Text>
          <Text style={styles.documentDate}>
            Uploaded {formatDate(item.created_at)}
          </Text>
          {item.expiry_date && (
            <Text style={styles.expiryText}>
              Expires {formatDate(item.expiry_date)}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteDocument(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#e74c3c" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6e6496" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Expiry Date Modal */}
      <Modal
        visible={showExpiryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExpiryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Warranty Expiry Date</Text>
            <Text style={styles.modalSubtitle}>
              Enter the expiry date (optional)
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#a0a0a0"
              value={expiryDate}
              onChangeText={setExpiryDate}
              keyboardType="numeric"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalSkipButton}
                onPress={handleSkipExpiry}
              >
                <Text style={styles.modalSkipText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={handleExpirySubmit}
              >
                <Text style={styles.modalSubmitText}>Upload</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Upload Overlay */}
      {uploading && (
        <View style={styles.uploadingOverlay}>
          <View style={styles.uploadingCard}>
            <ActivityIndicator size="large" color="#6e6496" />
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>My Documents</Text>
          <Text style={styles.subtext}>Manage your warranty documents</Text>
        </View>
        {documents.length > 0 && (
          <TouchableOpacity
            style={styles.smallUploadButton}
            onPress={showOptions}
          >
            <Ionicons name="cloud-upload-outline" size={18} color="#ffffff" />
            <Text style={styles.smallUploadText}>Upload</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        {documents.length === 0 ? (
          <TouchableOpacity
            style={styles.uploadCard}
            activeOpacity={0.7}
            onPress={showOptions}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="cloud-upload-outline" size={48} color="#6e6496" />
            </View>
            <Text style={styles.uploadTitle}>Tap to Upload</Text>
            <Text style={styles.uploadSubtitle}>
              PDF, JPG, PNG files supported
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>
              {documents.length} Document{documents.length !== 1 ? 's' : ''}
            </Text>
            <FlatList
              data={documents}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderDocumentItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.flatListContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#6e6496"
                  colors={['#6e6496']}
                />
              }
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 2,
  },
  documentDate: {
    fontSize: 13,
    color: '#888888',
  },
  expiryText: {
    fontSize: 12,
    color: '#6e6496',
    fontWeight: '500',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  // Upload overlay
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  uploadingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  uploadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#f4f2f7',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#333333',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalSkipButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f4f2f7',
    alignItems: 'center',
    marginRight: 8,
  },
  modalSkipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  modalSubmitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#6e6496',
    alignItems: 'center',
    marginLeft: 8,
  },
  modalSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default Documents;