import type React from 'react'

import type { FiltersState } from '@/features/matches-filter/model/types'
import { Image, Input, Switch, cn } from '@/shared'

import {
  EDUCATION_LEVEL_OPTIONS,
  PROFILE_PHOTOS,
  RELATIONSHIP_GOAL_OPTIONS,
  WORK_SPHERE_MOCK_OPTIONS,
} from './profile.constants'

interface ProfileEditFormProps {
  draft: FiltersState
  setDraft: React.Dispatch<React.SetStateAction<FiltersState>>
}

export const ProfileEditForm = ({ draft, setDraft }: ProfileEditFormProps): React.JSX.Element => (
  <section className="flex flex-col gap-3">
    <div className="grid grid-cols-2 gap-3">
      {PROFILE_PHOTOS.map((photo, index) => (
        <div key={photo} className="relative overflow-hidden rounded-3xl bg-card">
          <Image src={photo} alt={`Profile photo ${index + 1}`} className="aspect-square w-full object-cover" />
        </div>
      ))}
    </div>

    <div className="grid grid-cols-2 gap-3">
      <label className="flex flex-col gap-2 rounded-3xl bg-card px-4 py-4">
        <span className="text-sm font-[200] text-muted-foreground">Возраст от</span>
        <Input
          type="number"
          min={18}
          max={100}
          value={draft.ageRange[0]}
          onChange={(event) => {
            const min = Number(event.target.value)
            setDraft((prev) => ({ ...prev, ageRange: [Math.min(min, prev.ageRange[1]), prev.ageRange[1]] }))
          }}
          className="h-10 rounded-xl border-none bg-muted px-3 text-[15px] font-[200] text-foreground focus-visible:ring-0"
        />
      </label>
      <label className="flex flex-col gap-2 rounded-3xl bg-card px-4 py-4">
        <span className="text-sm font-[200] text-muted-foreground">Возраст до</span>
        <Input
          type="number"
          min={18}
          max={100}
          value={draft.ageRange[1]}
          onChange={(event) => {
            const max = Number(event.target.value)
            setDraft((prev) => ({ ...prev, ageRange: [prev.ageRange[0], Math.max(prev.ageRange[0], max)] }))
          }}
          className="h-10 rounded-xl border-none bg-muted px-3 text-[15px] font-[200] text-foreground focus-visible:ring-0"
        />
      </label>
    </div>

    <label className="flex flex-col gap-2 rounded-3xl bg-card px-4 py-4">
      <span className="text-sm font-[200] text-muted-foreground">Пол</span>
      <div className="grid grid-cols-2 gap-2">
        {(['Мужской', 'Женский'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setDraft((prev) => ({ ...prev, gender: option }))}
            className={cn(
              'h-11 rounded-xl border text-[14px] font-[200]',
              draft.gender === option
                ? 'border-[#FF6BA4]/40 bg-[#FF6BA4]/20 text-foreground'
                : 'border-transparent bg-muted text-foreground',
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </label>

    <label className="flex flex-col gap-2 rounded-3xl bg-card px-4 py-4">
      <span className="text-sm font-[200] text-muted-foreground">Цель отношений</span>
      <div className="relative">
        <select
          value={draft.relationshipGoals[0] ?? ''}
          onChange={(event) =>
            setDraft((prev) => ({ ...prev, relationshipGoals: event.target.value ? [event.target.value] : [] }))
          }
          className="h-11 w-full appearance-none rounded-xl border-none bg-muted px-3 pr-9 text-[15px] font-[200] text-foreground outline-none"
        >
          <option value="">Не указано</option>
          {RELATIONSHIP_GOAL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </label>

    <label className="flex flex-col gap-2 rounded-3xl bg-card px-4 py-4">
      <span className="text-sm font-[200] text-muted-foreground">Город</span>
      <Input
        type="text"
        value={draft.city}
        onChange={(event) => setDraft((prev) => ({ ...prev, city: event.target.value }))}
        placeholder="Москва"
        className="h-11 rounded-xl border-none bg-muted px-3 text-[15px] font-[200] text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
      />
    </label>

    <label className="flex flex-col gap-2 rounded-3xl bg-card px-4 py-4">
      <span className="text-sm font-[200] text-muted-foreground">Сфера работы</span>
      <div className="relative">
        <select
          value={draft.workFields[0] ?? ''}
          onChange={(event) =>
            setDraft((prev) => ({ ...prev, workFields: event.target.value ? [event.target.value] : [] }))
          }
          className="h-11 w-full appearance-none rounded-xl border-none bg-muted px-3 pr-9 text-[15px] font-[200] text-foreground outline-none"
        >
          <option value="">Не указано</option>
          {WORK_SPHERE_MOCK_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </label>

    <label className="flex flex-col gap-2 rounded-3xl bg-card px-4 py-4">
      <span className="text-sm font-[200] text-muted-foreground">Образование</span>
      <div className="relative">
        <select
          value={draft.educationLevel ?? ''}
          onChange={(event) => setDraft((prev) => ({ ...prev, educationLevel: event.target.value || null }))}
          className="h-11 w-full appearance-none rounded-xl border-none bg-muted px-3 pr-9 text-[15px] font-[200] text-foreground outline-none"
        >
          <option value="">Не указано</option>
          {EDUCATION_LEVEL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </label>

    <label className="flex flex-col gap-2 rounded-3xl bg-card px-4 py-4">
      <span className="text-sm font-[200] text-muted-foreground">Учебное заведение</span>
      <Input
        type="text"
        value={draft.educationInstitution}
        onChange={(event) => setDraft((prev) => ({ ...prev, educationInstitution: event.target.value }))}
        placeholder="Учебное заведение"
        className="h-11 rounded-xl border-none bg-muted px-3 text-[15px] font-[200] text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
      />
    </label>

    <label className="flex items-center justify-between rounded-3xl bg-card px-4 py-4">
      <span className="text-[15px] font-[200] text-foreground">Только Premium</span>
      <Switch
        size="lg"
        checked={draft.premiumOnly}
        onCheckedChange={(checked) => setDraft((prev) => ({ ...prev, premiumOnly: checked }))}
        aria-label="Только Premium"
        className="data-[state=checked]:bg-[#FF6BA4] data-[state=unchecked]:!bg-neutral-300 [&_[data-slot=switch-thumb]]:!bg-white [&_[data-slot=switch-thumb]]:shadow-sm"
      />
    </label>

    <div className="rounded-3xl bg-card px-4 py-4">
      <p className="mb-3 text-sm font-[200] text-muted-foreground">Приоритеты</p>
      <div className="space-y-3">
        {(
          [
            { label: 'Внешность', index: 0 },
            { label: 'Социум', index: 1 },
            { label: 'Личность', index: 2 },
          ] as const
        ).map((priority) => (
          <label key={priority.label} className="block">
            <div className="mb-1 flex items-center justify-between text-[13px] font-[200] text-foreground">
              <span>{priority.label}</span>
              <span>{draft.priorities[priority.index]}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={draft.priorities[priority.index]}
              onChange={(event) => {
                const value = Number(event.target.value)
                setDraft((prev) => {
                  const priorities = [...prev.priorities] as [number, number, number]
                  priorities[priority.index] = value
                  return { ...prev, priorities }
                })
              }}
              className="w-full accent-[#FF6BA4]"
            />
          </label>
        ))}
      </div>
    </div>
  </section>
)
