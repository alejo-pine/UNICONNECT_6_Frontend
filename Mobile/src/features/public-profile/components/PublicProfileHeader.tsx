/**
 * Componente que muestra el header del perfil público
 * Incluye avatar, nombre, carrera y semestre
 */
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface PublicProfileHeaderProps {
  fullName: string;
  career: string | null;
  semester: number | null;
  avatarUrl: string | null;
}

/**
 * Obtiene las iniciales del nombre completo
 * Protegido contra valores undefined/null
 */
const getInitials = (fullName: string | undefined | null): string => {
  if (!fullName || typeof fullName !== 'string' || fullName.trim() === '') {
    return '??';
  }
  
  const names = fullName.trim().split(' ');
  if (names.length === 1) {
    return names[0].substring(0, 2).toUpperCase();
  }
  return (names[0][0] + names[names.length - 1][0]).toUpperCase();
};

export const PublicProfileHeader: React.FC<PublicProfileHeaderProps> = ({
  fullName,
  career,
  semester,
  avatarUrl,
}) => {
  return (
    <View style={styles.container}>
      {/* Avatar o Iniciales */}
      <View style={styles.avatarContainer}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.initialsText}>{getInitials(fullName)}</Text>
          </View>
        )}
      </View>

      {/* Nombre completo */}
      <Text style={styles.fullName}>{fullName || 'Sin nombre'}</Text>

      {/* Carrera */}
      {career && <Text style={styles.career}>{career}</Text>}

      {/* Semestre */}
      {semester !== null && (
        <View style={styles.semesterBadge}>
          <Text style={styles.semesterText}>Semestre {semester}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarPlaceholder: {
    backgroundColor: '#002147', // Azul oscuro institucional
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 48,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  fullName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#002147', // Azul oscuro
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  career: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4B5563', // Gris neutral
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  semesterBadge: {
    backgroundColor: 'rgba(184, 134, 11, 0.1)', // Dorado con transparencia
    borderWidth: 1,
    borderColor: '#B8860B', // Dorado
    borderRadius: 24,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  semesterText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#B8860B', // Dorado
  },
});
