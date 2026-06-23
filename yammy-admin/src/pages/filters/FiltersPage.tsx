import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'

import {
  createFilterCategory,
  createFilterOption,
  createFilterSubcategory,
  deleteFilterCategory,
  deleteFilterOption,
  deleteFilterSubcategory,
  fetchFilterCatalog,
} from '@/entities/admin-auth/api'
import type { FilterCategory } from '@/shared/api/types'
import { t } from '@/shared/lib/labels'
import { Button, Card, Input } from '@/shared/ui/primitives'

type SlugNameForm = {
  slug: string
  name: string
}

const emptyForm = (): SlugNameForm => ({ slug: '', name: '' })

function SlugNameFields({
  value,
  onChange,
}: {
  value: SlugNameForm
  onChange: (next: SlugNameForm) => void
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-xs text-zinc-500">{t.filterSlug}</label>
        <Input
          value={value.slug}
          onChange={(e) => onChange({ ...value, slug: e.target.value })}
          placeholder="hair_color"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-zinc-500">{t.filterName}</label>
        <Input
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          placeholder="Рыжие"
        />
      </div>
    </div>
  )
}

export function FiltersPage() {
  const queryClient = useQueryClient()
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [categoryForm, setCategoryForm] = useState(emptyForm)
  const [subcategoryForms, setSubcategoryForms] = useState<Record<string, SlugNameForm>>({})
  const [optionForms, setOptionForms] = useState<Record<string, SlugNameForm>>({})

  const catalogQuery = useQuery({
    queryKey: ['filter-catalog-admin'],
    queryFn: fetchFilterCatalog,
  })

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['filter-catalog-admin'] })
  }

  const handleMutationError = (error: unknown) => {
    setErrorMessage(error instanceof Error ? error.message : t.errorGeneric)
  }

  const showDeleteResult = (affected: number, reindexed: number) => {
    setStatusMessage(`${t.filterDeleteDone} ${affected}, ${t.filterReindexed} ${reindexed}`)
    setErrorMessage(null)
  }

  const createCategoryMutation = useMutation({
    mutationFn: () => createFilterCategory(categoryForm),
    onSuccess: async () => {
      setCategoryForm(emptyForm())
      setStatusMessage('Категория добавлена')
      setErrorMessage(null)
      await invalidate()
    },
    onError: handleMutationError,
  })

  const createSubcategoryMutation = useMutation({
    mutationFn: ({ categoryId, form }: { categoryId: string; form: SlugNameForm }) =>
      createFilterSubcategory(categoryId, form),
    onSuccess: async (_data, variables) => {
      setSubcategoryForms((prev) => ({ ...prev, [variables.categoryId]: emptyForm() }))
      setStatusMessage('Подкатегория добавлена')
      setErrorMessage(null)
      await invalidate()
    },
    onError: handleMutationError,
  })

  const createOptionMutation = useMutation({
    mutationFn: ({ subcategoryId, form }: { subcategoryId: string; form: SlugNameForm }) =>
      createFilterOption(subcategoryId, form),
    onSuccess: async (_data, variables) => {
      setOptionForms((prev) => ({ ...prev, [variables.subcategoryId]: emptyForm() }))
      setStatusMessage('Опция добавлена')
      setErrorMessage(null)
      await invalidate()
    },
    onError: handleMutationError,
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteFilterCategory,
    onSuccess: async (result) => {
      showDeleteResult(result.affected_users, result.reindexed_users)
      await invalidate()
    },
    onError: handleMutationError,
  })

  const deleteSubcategoryMutation = useMutation({
    mutationFn: deleteFilterSubcategory,
    onSuccess: async (result) => {
      showDeleteResult(result.affected_users, result.reindexed_users)
      await invalidate()
    },
    onError: handleMutationError,
  })

  const deleteOptionMutation = useMutation({
    mutationFn: deleteFilterOption,
    onSuccess: async (result) => {
      showDeleteResult(result.affected_users, result.reindexed_users)
      await invalidate()
    },
    onError: handleMutationError,
  })

  const isBusy =
    createCategoryMutation.isPending ||
    createSubcategoryMutation.isPending ||
    createOptionMutation.isPending ||
    deleteCategoryMutation.isPending ||
    deleteSubcategoryMutation.isPending ||
    deleteOptionMutation.isPending

  const confirmDelete = () => window.confirm(t.deleteFilterConfirm)

  const renderCategory = (category: FilterCategory) => (
    <Card key={category.id} className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-medium">{category.name}</div>
          <div className="text-sm text-zinc-500">{category.slug}</div>
        </div>
        <Button
          type="button"
          variant="danger"
          disabled={isBusy}
          onClick={() => {
            if (!confirmDelete()) return
            deleteCategoryMutation.mutate(category.id)
          }}
        >
          <Trash2 className="mr-1 size-4" />
          {t.deleteFilter}
        </Button>
      </div>

      <div className="space-y-3 border-t border-zinc-800 pt-4">
        <p className="text-sm font-medium text-zinc-300">{t.addFilterSubcategory}</p>
        <SlugNameFields
          value={subcategoryForms[category.id] ?? emptyForm()}
          onChange={(form) => setSubcategoryForms((prev) => ({ ...prev, [category.id]: form }))}
        />
        <Button
          type="button"
          disabled={
            isBusy ||
            !subcategoryForms[category.id]?.slug.trim() ||
            !subcategoryForms[category.id]?.name.trim()
          }
          onClick={() => {
            const form = subcategoryForms[category.id]
            if (!form) return
            createSubcategoryMutation.mutate({ categoryId: category.id, form })
          }}
        >
          {t.addFilterSubcategory}
        </Button>
      </div>

      {category.subcategories.map((subcategory) => (
        <div key={subcategory.id} className="ml-2 space-y-3 border-l border-zinc-800 pl-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-medium">{subcategory.name}</div>
              <div className="text-sm text-zinc-500">{subcategory.slug}</div>
            </div>
            <Button
              type="button"
              variant="ghost"
              disabled={isBusy}
              onClick={() => {
                if (!confirmDelete()) return
                deleteSubcategoryMutation.mutate(subcategory.id)
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {subcategory.options.map((option) => (
              <span
                key={option.id}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-sm"
              >
                {option.name}
                <span className="text-zinc-500">({option.slug})</span>
                <button
                  type="button"
                  className="cursor-pointer text-zinc-400 hover:text-red-400"
                  disabled={isBusy}
                  onClick={() => {
                    if (!confirmDelete()) return
                    deleteOptionMutation.mutate(option.id)
                  }}
                  aria-label={`${t.deleteFilter} ${option.name}`}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </span>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-xs text-zinc-500">{t.addFilterOption}</p>
            <SlugNameFields
              value={optionForms[subcategory.id] ?? emptyForm()}
              onChange={(form) => setOptionForms((prev) => ({ ...prev, [subcategory.id]: form }))}
            />
            <Button
              type="button"
              variant="ghost"
              disabled={
                isBusy ||
                !optionForms[subcategory.id]?.slug.trim() ||
                !optionForms[subcategory.id]?.name.trim()
              }
              onClick={() => {
                const form = optionForms[subcategory.id]
                if (!form) return
                createOptionMutation.mutate({ subcategoryId: subcategory.id, form })
              }}
            >
              {t.addFilterOption}
            </Button>
          </div>
        </div>
      ))}
    </Card>
  )

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t.filtersCatalog}</h1>
      <p className="text-sm text-zinc-500">
        При удалении фильтра связи у пользователей снимаются в PostgreSQL и Elasticsearch сразу, без
        фоновых задач.
      </p>

      {statusMessage && <p className="text-sm text-emerald-400">{statusMessage}</p>}
      {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}

      <Card className="space-y-3">
        <p className="font-medium">{t.addFilterCategory}</p>
        <SlugNameFields value={categoryForm} onChange={setCategoryForm} />
        <Button
          type="button"
          disabled={isBusy || !categoryForm.slug.trim() || !categoryForm.name.trim()}
          onClick={() => createCategoryMutation.mutate()}
        >
          {createCategoryMutation.isPending ? t.saving : t.addFilterCategory}
        </Button>
      </Card>

      {catalogQuery.isLoading ? (
        <div className="text-zinc-400">{t.loading}</div>
      ) : (
        <div className="space-y-4">{catalogQuery.data?.map(renderCategory)}</div>
      )}
    </div>
  )
}
