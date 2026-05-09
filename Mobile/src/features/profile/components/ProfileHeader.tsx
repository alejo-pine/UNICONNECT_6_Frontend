import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { memo, useCallback, useState } from 'react';
import {
    Image,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

interface ProfileHeaderProps {
  avatarUrl?: string;
  onAvatarChange?: (uri: string) => void;
}

const colors = {
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#1E293B',
  border: '#E2E8F0',
  primary: '#00284D',
  gold: '#C5A059',
};

export const ProfileHeader = memo<ProfileHeaderProps>(
  ({
    avatarUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvo_Ngu1E5u_x_s5agSUOxRTwg68pCpWwwpYOSpAivY8hc20HxjELeR9TvUWuK_lwbHCnr6XsMwvb7FBaw8419Bf4rEHbj7S7ieeJMyxxlJy26L9NV_4lFmL-q_ea3wfys_THzznJneT8g4A95O-0V4qRhUF01RmblSRw-UKT3VoskElWB7AysGXIYJPdgHScE9SCS0KkHP9zs5SW1yiDa1OYh02WjhAc4wh0Hi35G5xLOxkb-48V3rAx1e_33Nw-GNiv3I2ZOHuAW',
    onAvatarChange,
  }) => {
    const [loading, setLoading] = useState(false);
    const hasAvatar = typeof avatarUrl === 'string' && avatarUrl.trim().length > 0;

    const pickImage = useCallback(async () => {
      try {
        setLoading(true);
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          onAvatarChange?.(result.assets[0].uri);
        }
      } catch (error) {
        console.error('Error picking image:', error);
      } finally {
        setLoading(false);
      }
    }, [onAvatarChange]);

    return (
      <View style={styles.container}>
        <View style={[styles.avatarContainer, { borderColor: colors.surface }]}>
          {hasAvatar ? (
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <MaterialIcons name="person" size={56} color="#9AA6B2" />
            </View>
          )}
          <TouchableOpacity
            style={[
              styles.cameraButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={pickImage}
            disabled={loading}
          >
            <MaterialIcons name="camera-alt" size={20} color={colors.gold} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);

ProfileHeader.displayName = 'ProfileHeader';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#EEF2F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 4,
  },
});
