import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { AppNotification, notificationsHttpService } from '../services/notificationsHttpService';

export function NotificationBell() {
  const { token, userId, notificationRefreshKey, notifications: storeNotifications, setNotifications } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadNotifications = useCallback(async () => {
    if (!token || !userId) return;
    setLoading(true);
    try {
      const response = await notificationsHttpService.getNotifications(token, userId);
      if (response.success && response.data) {
        setNotifications(response.data);
      }
    } finally {
      setLoading(false);
    }
  }, [token, userId, setNotifications]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications, notificationRefreshKey]);

  // Derive the displayed notifications from the store (updated by socket in real-time)
  const notifications = storeNotifications;

  const openModal = () => {
    setModalVisible(true);
    loadNotifications(); // Full sync when user opens the modal
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setModalVisible(false));
  };

  const handleNotificationPress = async (notification: AppNotification) => {
    if (!notification.read && token) {
      await notificationsHttpService.markAsRead(notification.id, token);
      setNotifications(
        storeNotifications.map(n => (n.id === notification.id ? { ...n, read: true } : n))
      );
    }
    closeModal();

    // Guard: only navigate if we have a real, non-empty groupId
    const groupId = notification.groupId;
    if (groupId && groupId.trim().length > 0 && groupId !== 'null' && groupId !== 'undefined') {
      // Small delay so modal close animation finishes before navigation
      setTimeout(() => {
        router.push(`/study-groups/${groupId}` as any);
      }, 160);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Ahora';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Hace ${diffH} h`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <TouchableOpacity style={styles.bellButton} onPress={openModal} activeOpacity={0.7}>
        <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : String(unreadCount)}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={closeModal}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.dropdown,
                  { opacity: fadeAnim, marginTop: insets.top + 56 },
                ]}
              >
                {/* Header */}
                <View style={styles.dropdownHeader}>
                  <Text style={styles.dropdownTitle}>Notificaciones</Text>
                  {unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{unreadCount} sin leer</Text>
                    </View>
                  )}
                  <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
                    <Ionicons name="close" size={18} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                {/* Body */}
                <ScrollView
                  style={styles.list}
                  bounces={false}
                  showsVerticalScrollIndicator={false}
                >
                  {loading ? (
                    <View style={styles.centered}>
                      <ActivityIndicator size="small" color="#00284D" />
                    </View>
                  ) : notifications.length === 0 ? (
                    <View style={styles.centered}>
                      <Ionicons name="notifications-off-outline" size={40} color="#D1D5DB" />
                      <Text style={styles.emptyText}>Sin notificaciones</Text>
                    </View>
                  ) : (
                    notifications.map(n => (
                      <TouchableOpacity
                        key={n.id}
                        style={[styles.item, !n.read && styles.itemUnread]}
                        onPress={() => handleNotificationPress(n)}
                        activeOpacity={0.75}
                      >
                        <View style={styles.itemIconWrapper}>
                          <Ionicons
                            name={n.read ? 'notifications-outline' : 'notifications'}
                            size={20}
                            color={n.read ? '#9CA3AF' : '#00284D'}
                          />
                        </View>
                        <View style={styles.itemContent}>
                          <Text
                            style={[styles.itemMessage, !n.read && styles.itemMessageBold]}
                            numberOfLines={3}
                          >
                            {n.message}
                          </Text>
                          <Text style={styles.itemTime}>{formatTime(n.createdAt)}</Text>
                        </View>
                        {!n.read && <View style={styles.dot} />}
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bellButton: {
    marginRight: 14,
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#00284D',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 12,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'flex-end',
  },
  dropdown: {
    width: 320,
    maxHeight: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FAFAFA',
  },
  dropdownTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  unreadBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
  },
  closeBtn: {
    padding: 4,
  },
  list: {
    maxHeight: 360,
  },
  centered: {
    paddingVertical: 36,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  itemUnread: {
    backgroundColor: '#F0F5FF',
  },
  itemIconWrapper: {
    marginRight: 12,
    paddingTop: 1,
  },
  itemContent: {
    flex: 1,
  },
  itemMessage: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
  },
  itemMessageBold: {
    fontWeight: '600',
    color: '#111827',
  },
  itemTime: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginTop: 4,
    marginLeft: 8,
  },
});
