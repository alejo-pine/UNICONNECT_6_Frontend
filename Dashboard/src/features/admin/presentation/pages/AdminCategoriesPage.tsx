import React, { useState } from 'react';
import { useAdminCategories } from '../hooks/useAdminCategories';
import type { Category } from '../../../events/domain/Category';
import { Button } from '@shared/components/ui/Button';
import { CategoryModal } from '../components/CategoryModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { useToast } from '@shared/components/ui/ToastProvider';

export function AdminCategoriesPage() {
  const { categories, isLoading, error, refreshCategories, createCategory, updateCategory, deleteCategory } = useAdminCategories();
  const { push } = useToast();

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenCreateModal = () => {
    setSelectedCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditModal = (category: Category) => {
    setSelectedCategory(category);
    setIsCategoryModalOpen(true);
  };

  const handleOpenDeleteModal = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const handleCategorySubmit = async (data: { name: string; description?: string }) => {
    setIsSubmitting(true);
    let result;
    
    if (selectedCategory) {
      result = await updateCategory(selectedCategory.id, data);
    } else {
      result = await createCategory(data);
    }

    setIsSubmitting(false);

    if (result.success) {
      push(selectedCategory ? 'Categoría actualizada exitosamente.' : 'Categoría creada exitosamente.', 'success');
      setIsCategoryModalOpen(false);
    } else {
      push(result.error || 'Ocurrió un error inesperado.', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    
    setIsDeleting(true);
    const result = await deleteCategory(categoryToDelete.id);
    setIsDeleting(false);

    if (result.success) {
      push('Categoría eliminada exitosamente.', 'success');
      setIsDeleteModalOpen(false);
    } else {
      push(result.error || 'Ocurrió un error al eliminar la categoría.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-[#002147]">progress_activity</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-lg font-medium">{error}</p>
          <Button className="mt-4" onClick={refreshCategories}>Reintentar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-6 max-w-7xl mx-auto w-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#062E57]">Categorías de Eventos</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona las categorías disponibles para crear eventos en UniConnect.</p>
        </div>
        <Button onClick={handleOpenCreateModal} className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">add</span>
          Nueva Categoría
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-[#062E57]">Nombre</th>
                <th className="px-6 py-4 font-semibold text-[#062E57]">Slug</th>
                <th className="px-6 py-4 font-semibold text-[#062E57]">Descripción</th>
                <th className="px-6 py-4 font-semibold text-[#062E57] text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No hay categorías registradas.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{category.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{category.slug}</td>
                    <td className="px-6 py-4">
                      {category.description ? (
                        <span className="truncate max-w-xs block" title={category.description}>
                          {category.description}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Sin descripción</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(category)}
                          className="p-1.5 text-gray-500 hover:text-[#002147] hover:bg-gray-100 rounded-md transition-colors"
                          title="Editar"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(category)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Eliminar"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSubmit={handleCategorySubmit}
        initialData={selectedCategory}
        isSubmitting={isSubmitting}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Categoría"
        message={`¿Estás seguro de que deseas eliminar la categoría "${categoryToDelete?.name}"? Esta acción no se puede deshacer.`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
