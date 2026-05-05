import type { JSX } from 'react'
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Edit2, ChevronDown, Plus, X } from 'lucide-react'
import { cn } from '@/shared/lib/mergeClass'
import { Button } from '@/shared/ui/button/button'

const EditProfilePage = (): JSX.Element => {
  const navigate = useNavigate()
  
  const [firstName, setFirstName] = useState("Michael")
  const [bio, setBio] = useState("")
  const [gender, setGender] = useState("male")
  const [relationshipGoal, setRelationshipGoal] = useState("dating")
  const [birthDate, setBirthDate] = useState("1996-03-12") 
  
  const [city, setCity] = useState("London")
  const [job, setJob] = useState("Software Engineer")
  const [jobSphere, setJobSphere] = useState("it")
  const [educationLevel, setEducationLevel] = useState("higher")
  const [educationDetails, setEducationDetails] = useState("MIT")

  const [showZodiac, setShowZodiac] = useState(true)
  
  const [photos, setPhotos] = useState<(string | null)[]>([
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1544502062-f82887f03d1c?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400',
    null,
    null
  ])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadIndex, setUploadIndex] = useState<number | null>(null)

  const handleRemovePhoto = (index: number) => {
    const newPhotos = [...photos]
    newPhotos[index] = null
    setPhotos(newPhotos)
  }

  const handleAddPhoto = (index: number) => {
    setUploadIndex(index)
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && uploadIndex !== null) {
      const url = URL.createObjectURL(file)
      const newPhotos = [...photos]
      newPhotos[uploadIndex] = url
      setPhotos(newPhotos)
    }
    // reset
    if (fileInputRef.current) fileInputRef.current.value = ''
    setUploadIndex(null)
  }

  const handleSave = () => {
    console.log({ 
      firstName, age: 28, gender, bio, relationshipGoal,
      city, job, jobSphere, educationLevel, educationDetails,
      showZodiac, photos 
    })
    navigate(-1)
  }

  return (
    <div className="h-full w-full flex flex-col font-light bg-background text-foreground absolute inset-0 z-50 px-4 py-3">
      {/* Hidden file input for uploading photos */}
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />

      {/* Header */}
      <div className="flex shrink-0 items-center justify-between pb-4 relative">
        <Button 
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-10 w-10 shrink-0 rounded-full hover:bg-muted/50 active:scale-90 z-10"
        >
          <ChevronLeft size={24} strokeWidth={2.5} className="text-foreground" />
        </Button>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-4">
          <span className="text-[17px] font-medium leading-tight text-foreground">Редактирование</span>
        </div>
        <button 
          onClick={handleSave}
          className="text-primary text-[16px] font-medium px-2 py-2 hover:opacity-80 transition active:scale-95 z-10"
        >
          Готово
        </button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-3 pb-8">
        {/* Main Photo editable - LARGER NOW */}
        <div className="flex justify-center mt-2 mb-4">
          <div className="relative">
            <div className="w-44 h-56 md:w-52 md:h-64 rounded-[32px] overflow-hidden border-2 border-transparent">
              <img 
                src={photos[0] || "https://images.unsplash.com/photo-1544502062-f82887f03d1c?auto=format&fit=crop&q=80&w=400"} 
                alt="Main Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
            <button 
              onClick={() => handleAddPhoto(0)}
              className="absolute -bottom-3 -right-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground hover:scale-105 transition-transform"
            >
              <Edit2 className="w-5 h-5 fill-current" />
            </button>
          </div>
        </div>

        {/* First name */}
        <div className="bg-black-[0.03] dark:bg-white/5 border border-border/30 rounded-2xl px-4 py-2 flex flex-col">
          <label className="text-xs text-muted-foreground mb-1">First name</label>
          <input 
            type="text" 
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="bg-transparent text-foreground text-base font-normal outline-none w-full"
          />
        </div>

        {/* Photos Grid */}
        <div className="bg-black-[0.03] dark:bg-white/5 border border-border/30 rounded-[28px] p-2">
          <div className="grid grid-cols-4 gap-2">
            {photos.slice(1, 5).map((url, idx) => {
              const actualIndex = idx + 1
              return (
                <div key={actualIndex} className="aspect-[3/4] bg-black/5 dark:bg-white/5 border border-transparent rounded-[20px] relative overflow-hidden flex items-center justify-center">
                  {url ? (
                    <>
                      <img src={url} alt={`Photo ${actualIndex + 1}`} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => handleRemovePhoto(actualIndex)}
                        className="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:scale-110 transition-transform"
                      >
                        <X className="w-3.5 h-3.5" strokeWidth={3} />
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => handleAddPhoto(actualIndex)}
                      className="w-full h-full flex items-center justify-center hover:bg-secondary/50 transition cursor-pointer"
                    >
                      <Plus className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Gender (Native Select) */}
        <div className="relative bg-black-[0.03] dark:bg-white/5 border border-border/30 rounded-2xl px-4 py-3 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/10 transition mt-1">
          <div className="flex flex-col flex-1">
            <span className="text-xs text-muted-foreground mb-0.5 pointer-events-none">Gender</span>
            <select 
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="bg-transparent text-foreground text-base font-normal outline-none w-full appearance-none cursor-pointer"
            >
              <option value="male" className="text-black">Male</option>
              <option value="female" className="text-black">Female</option>
            </select>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground opacity-80 pointer-events-none" />
        </div>

        {/* Date of birth */}
        <div className="relative bg-black-[0.03] dark:bg-white/5 border border-border/30 rounded-2xl px-4 py-3 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/10 transition">
          <div className="flex flex-col flex-1">
            <span className="text-xs text-muted-foreground mb-0.5 pointer-events-none">Date of birth</span>
            <input 
              type="date" 
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="bg-transparent text-foreground text-base font-normal outline-none w-full appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* About Me */}
        <div className="bg-black-[0.03] dark:bg-white/5 border border-border/30 rounded-2xl p-4 flex flex-col mt-2">
          <label className="text-xs text-muted-foreground mb-1">About me</label>
          <textarea 
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Write a few words about yourself..."
            className="bg-transparent text-foreground text-base font-normal outline-none w-full resize-none min-h-[80px]"
          />
        </div>

        {/* Relationship Goal */}
        <div className="relative bg-black-[0.03] dark:bg-white/5 border border-border/30 rounded-2xl px-4 py-3 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/10 transition">
          <div className="flex flex-col flex-1">
            <span className="text-xs text-muted-foreground mb-0.5 pointer-events-none">Relationship Goal</span>
            <select 
              value={relationshipGoal}
              onChange={(e) => setRelationshipGoal(e.target.value)}
              className="bg-transparent text-foreground text-base font-normal outline-none w-full appearance-none cursor-pointer"
            >
              <option value="dating" className="text-black">Dating</option>
              <option value="relationship" className="text-black">Relationship</option>
              <option value="friendship" className="text-black">Friendship</option>
              <option value="communication" className="text-black">Communication</option>
              <option value="fwb" className="text-black">Friends with benefits</option>
              <option value="ons" className="text-black">One night stand</option>
              <option value="party" className="text-black">Party</option>
            </select>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground opacity-80 pointer-events-none" />
        </div>

        <h3 className="text-foreground font-medium text-lg mt-4 mb-1 pl-1">Background</h3>
        
        {/* Background Details */}
        <div className="flex flex-col gap-2">
          <div className="bg-black-[0.03] dark:bg-white/5 border border-border/30 rounded-2xl px-4 py-2 flex flex-col">
            <label className="text-xs text-muted-foreground mb-1">City</label>
            <input 
              type="text" 
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="bg-transparent text-foreground text-base font-normal outline-none w-full"
            />
          </div>

          <div className="flex gap-2">
            <div className="bg-black-[0.03] dark:bg-white/5 border border-border/30 rounded-2xl px-4 py-2 flex flex-col flex-1">
              <label className="text-xs text-muted-foreground mb-1">Job</label>
              <input 
                type="text" 
                value={job}
                onChange={(e) => setJob(e.target.value)}
                className="bg-transparent text-foreground text-base font-normal outline-none w-full"
              />
            </div>
            <div className="relative bg-black-[0.03] dark:bg-white/5 border border-border/30 rounded-2xl px-4 py-2 flex flex-col flex-1 justify-center">
              <span className="text-xs text-muted-foreground mb-0.5 pointer-events-none">Sphere</span>
              <select 
                value={jobSphere}
                onChange={(e) => setJobSphere(e.target.value)}
                className="bg-transparent text-foreground text-base font-normal outline-none w-full appearance-none cursor-pointer"
              >
                <option value="it" className="text-black">IT</option>
                <option value="art_design" className="text-black">Art & Design</option>
                <option value="finance" className="text-black">Finance</option>
                <option value="business" className="text-black">Business</option>
                <option value="medicine" className="text-black">Medicine</option>
                <option value="education" className="text-black">Education</option>
                <option value="other" className="text-black">Other...</option>
              </select>
              <ChevronDown className="w-4 h-4 text-muted-foreground opacity-80 pointer-events-none absolute right-3 bottom-3" />
            </div>
          </div>

          <div className="flex gap-2">
            <div className="bg-black-[0.03] dark:bg-white/5 border border-border/30 rounded-2xl px-4 py-2 flex flex-col flex-[1.5]">
              <label className="text-xs text-muted-foreground mb-1">University / Speciality</label>
              <input 
                type="text" 
                value={educationDetails}
                onChange={(e) => setEducationDetails(e.target.value)}
                className="bg-transparent text-foreground text-base font-normal outline-none w-full"
              />
            </div>
            <div className="relative bg-black-[0.03] dark:bg-white/5 border border-border/30 rounded-2xl px-4 py-2 flex flex-col flex-1 justify-center">
              <span className="text-xs text-muted-foreground mb-0.5 pointer-events-none">Education</span>
              <select 
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="bg-transparent text-foreground text-base font-normal outline-none w-full appearance-none cursor-pointer"
              >
                <option value="higher" className="text-black">Higher</option>
                <option value="college" className="text-black">College</option>
                <option value="school" className="text-black">School</option>
              </select>
              <ChevronDown className="w-4 h-4 text-muted-foreground opacity-80 pointer-events-none absolute right-3 bottom-3" />
            </div>
          </div>
        </div>

        <h3 className="text-foreground font-medium text-lg mt-4 mb-1 pl-1">Parameters</h3>
        
        {/* Parameters Section */}
        <div className="grid grid-cols-2 gap-2">
          {/* Smoking */}
          <div className="bg-black-[0.03] dark:bg-white/5 border border-border/30 rounded-2xl px-4 py-3 flex flex-col justify-center relative cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition">
            <span className="text-[11px] text-muted-foreground mb-0.5">Smoking</span>
            <span className="text-foreground text-sm font-normal">Socially 🚬</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground opacity-80 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
          
          {/* Drinking */}
          <div className="bg-black-[0.03] dark:bg-white/5 border border-border/30 rounded-2xl px-4 py-3 flex flex-col justify-center relative cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition">
            <span className="text-[11px] text-muted-foreground mb-0.5">Drinking</span>
            <span className="text-foreground text-sm font-normal">On weekends 🍷</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground opacity-80 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Children */}
          <div className="bg-black-[0.03] dark:bg-white/5 border border-border/30 rounded-2xl px-4 py-3 flex flex-col justify-center relative cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition">
            <span className="text-[11px] text-muted-foreground mb-0.5">Children</span>
            <span className="text-foreground text-sm font-normal">Want someday 👶🏻</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground opacity-80 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
          
          {/* Languages */}
          <div className="bg-black-[0.03] dark:bg-white/5 border border-border/30 rounded-2xl px-4 py-3 flex flex-col justify-center relative cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition">
            <span className="text-[11px] text-muted-foreground mb-0.5">Languages</span>
            <span className="text-foreground text-sm font-normal">RU, EN</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground opacity-80 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <h3 className="text-foreground font-medium text-lg mt-2 mb-1 pl-1">Zodiac sign</h3>

        {/* Astrological sign & Checkbox */}
        <div className="bg-black-[0.03] dark:bg-white/5 border border-border/30 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground mb-1">Astrological sign</span>
            <div className="flex items-center gap-2 mt-0.5 relative">
              <span className="bg-secondary text-secondary-foreground text-sm px-1.5 py-0.5 rounded">♈</span>
              <select 
                defaultValue="Aries"
                className="bg-transparent text-foreground text-base font-normal outline-none appearance-none cursor-pointer"
              >
                <option value="Aries" className="text-black">Aries</option>
                <option value="Taurus" className="text-black">Taurus</option>
                <option value="Gemini" className="text-black">Gemini</option>
                <option value="Cancer" className="text-black">Cancer</option>
              </select>
              <ChevronDown className="w-4 h-4 text-muted-foreground opacity-80 pointer-events-none ml-auto" />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1 cursor-pointer" onClick={() => setShowZodiac(!showZodiac)}>
            <div className={cn(
              "w-5 h-5 rounded flex items-center justify-center transition-colors border",
              showZodiac ? "bg-primary border-primary" : "bg-transparent border-muted-foreground"
            )}>
              {showZodiac && <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
            </div>
            <span className="text-foreground text-sm font-normal select-none">Show my astrological sign</span>
          </div>
        </div>

      </div>
    </div>
  )
}

export default EditProfilePage
