import { memo } from 'react'

import { cn, Input } from '@/shared'

import { EDUCATION_INSTITUTION_PLACEHOLDER } from '../../lib/constants'

interface EducationInstitutionInputProps {
  value: string
  onChange: (value: string) => void
}

const EducationInstitutionInputComponent = ({
  value,
  onChange,
}: EducationInstitutionInputProps): React.JSX.Element => (
  <Input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={EDUCATION_INSTITUTION_PLACEHOLDER}
    className={cn(
      'rounded-full border border-[#F2F2F2] bg-[#F2F2F2] font-light placeholder:text-[13px] placeholder:font-light px-4 py-5 text-[13px] text-[#141414] shadow-none',
      'placeholder:text-neutral-500 focus-visible:ring-0 focus-visible:border-[#FF6BA4]/30',
    )}
    aria-label="Учебное заведение"
  />
)

export const EducationInstitutionInput = memo(EducationInstitutionInputComponent)
