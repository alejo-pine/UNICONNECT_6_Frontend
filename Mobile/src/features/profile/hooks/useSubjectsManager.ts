/**
 * Hook para manejar la lógica de materias
 * Soluciona: Lógica en componente, evita God Component
 */
import { useCallback, useState, useMemo } from 'react';
import { Subject } from '../../../services/profileHttpService';

interface UseSubjectsManagerReturn {
  currentSubjects: Subject[];
  availableSubjects: Subject[];
  searchQuery: string;
  filteredSubjects: Subject[];
  addSubject: (subject: Subject) => void;
  removeSubject: (subjectId: string) => void;
  setSearchQuery: (query: string) => void;
}

export const useSubjectsManager = (
  initialSubjects: Subject[] = [],
  availableSubjects: Subject[] = []
): UseSubjectsManagerReturn => {
  const [currentSubjects, setCurrentSubjects] = useState<Subject[]>(initialSubjects);
  const [searchQuery, setSearchQuery] = useState('');

  const addSubject = useCallback((subject: Subject) => {
    setCurrentSubjects((prev) => {
      // Evitar duplicados
      if (prev.some((s) => s.id === subject.id)) return prev;
      return [...prev, subject];
    });
  }, []);

  const removeSubject = useCallback((subjectId: string) => {
    setCurrentSubjects((prev) => prev.filter((s) => s.id !== subjectId));
  }, []);

  // Filtrar materias disponibles que no estén ya agregadas
  const filteredSubjects = useMemo(() => {
    const currentIds = new Set(currentSubjects.map((s) => s.id));
    return availableSubjects.filter((subject) => {
      const isNotAdded = !currentIds.has(subject.id);
      const matchesSearch = subject.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return isNotAdded && matchesSearch;
    });
  }, [currentSubjects, availableSubjects, searchQuery]);

  return {
    currentSubjects,
    availableSubjects: filteredSubjects,
    searchQuery,
    filteredSubjects,
    addSubject,
    removeSubject,
    setSearchQuery,
  };
};
