/**
 * Lista de compañeros usando FlatList para soporte nativo de scroll
 * y virtualización. Memoizada para evitar re-renders innecesarios.
 */
import React, { memo, useCallback } from "react";
import { FlatList, StyleSheet } from "react-native";
import type { Classmate } from "../types/search";
import { ClassmateCard } from "./ClassmateCard";

interface ClassmateListProps {
  classmates: Classmate[];
}

export const ClassmateList = memo<ClassmateListProps>(({ classmates }) => {
  // useCallback garantiza una referencia estable para que FlatList
  // no re-renderice todos los ítems cuando el padre cambia de estado.
  const renderItem = useCallback(
    ({ item }: { item: Classmate }) => <ClassmateCard classmate={item} />,
    [],
  );

  return (
    <FlatList
      data={classmates}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
});

ClassmateList.displayName = "ClassmateList";

const styles = StyleSheet.create({
  list: {
    paddingTop: 8,
    paddingBottom: 32,
  },
});
