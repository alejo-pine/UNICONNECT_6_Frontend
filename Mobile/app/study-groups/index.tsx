/**
 * Ruta: /study-groups
 * Pantalla principal de lista de grupos con dos pestañas
 */

import { GroupsListScreen } from '@/src/features/groups/screens/GroupsListScreen';
import { StyleSheet, View } from 'react-native';

const colors = {
  lightBg: '#F8F9FA',
};

export default function StudyGroupsIndexScreen() {
  return (
    <View style={[styles.container]}>
      <GroupsListScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightBg,
  },
});
