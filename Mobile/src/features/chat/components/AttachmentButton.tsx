import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface AttachmentFile {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
}

interface Props {
  onAttach: (file: AttachmentFile) => void;
  disabled?: boolean;
}

export const AttachmentButton: React.FC<Props> = ({ onAttach, disabled }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleDocument = async () => {
    setModalVisible(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        onAttach({
          uri: file.uri,
          name: file.name,
          size: file.size || 0,
          mimeType: file.mimeType || "application/octet-stream",
        });
      }
    } catch (e) {
      Alert.alert("Error", "No se pudo seleccionar el documento.");
    }
  };

  const handleImage = async () => {
    setModalVisible(false);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        const fileName =
          file.fileName || file.uri.split("/").pop() || "imagen.jpg";
        onAttach({
          uri: file.uri,
          name: fileName,
          size: file.fileSize || 0,
          mimeType: file.mimeType || "image/jpeg",
        });
      }
    } catch (e) {
      Alert.alert("Error", "No se pudo seleccionar la imagen.");
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.button, disabled && styles.disabled]}
        onPress={() => setModalVisible(true)}
        disabled={disabled}
      >
        <Ionicons name="add" size={28} color="#64748B" />
      </TouchableOpacity>

      <Modal transparent visible={modalVisible} animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.option} onPress={handleDocument}>
              <Ionicons name="document-text" size={24} color="#00284D" />
              <Text style={styles.optionText}>Documento (PDF/Excel)</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.option} onPress={handleImage}>
              <Ionicons name="image" size={24} color="#00284D" />
              <Text style={styles.optionText}>Imagen de la galería</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  disabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
    paddingTop: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  optionText: {
    fontSize: 16,
    marginLeft: 12,
    color: "#0F172A",
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 16,
  },
});
