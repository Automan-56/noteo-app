import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react'
import { useGrades, type GradeInput, type GradeType, type GradeWithSubject } from '@/hooks/useGrades'
import { useSubjects, type Subject } from '@/hooks/useSubjects'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type LetterGrade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F'

interface GradeFormState {
  subjectId: string
  title: string
  gradeType: GradeType
  value: string
  maxValue: string
  letterValue: LetterGrade
  useCoefficient: boolean
  coefficient: string
  date: string
  comment: string
}

interface GradeFormFieldsProps {
  form: GradeFormState
  setForm: Dispatch<SetStateAction<GradeFormState>>
  subjects: Subject[]
  isSubmitting: boolean
}

const LETTER_OPTIONS: LetterGrade[] = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']

const LETTER_TO_NUMERIC: Record<LetterGrade, number> = {
  'A+': 7,
  A: 6,
  'B+': 5,
  B: 4,
  'C+': 3,
  C: 2,
  D: 1,
  F: 0,
}

const NUMERIC_TO_LETTER: Record<number, LetterGrade> = {
  7: 'A+',
  6: 'A',
  5: 'B+',
  4: 'B',
  3: 'C+',
  2: 'C',
  1: 'D',
  0: 'F',
}

const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0] ?? ''
}

const createDefaultFormState = (subjects: Subject[]): GradeFormState => ({
  subjectId: subjects[0]?.id ?? '',
  title: '',
  gradeType: 'points',
  value: '',
  maxValue: '20',
  letterValue: 'A+',
  useCoefficient: false,
  coefficient: '1',
  date: getTodayDate(),
  comment: '',
})

const getDisplayNumber = (value: number): string => {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2).replace(/\.?0+$/, '')
}

const getLetterFromNumeric = (value: number): LetterGrade => {
  return NUMERIC_TO_LETTER[Math.round(value)] ?? 'F'
}

const getNormalizedGradeType = (gradeType: GradeWithSubject['grade_type']): GradeType => {
  return gradeType ?? 'points'
}

const createEditFormState = (grade: GradeWithSubject): GradeFormState => {
  const gradeType = getNormalizedGradeType(grade.grade_type)

  return {
    subjectId: grade.subject_id,
    title: grade.title,
    gradeType,
    value: gradeType === 'letter' ? '' : getDisplayNumber(grade.value),
    maxValue: getDisplayNumber(grade.grade_max ?? 20),
    letterValue: gradeType === 'letter' ? getLetterFromNumeric(grade.value) : 'A+',
    useCoefficient: grade.coefficient !== 1,
    coefficient: getDisplayNumber(grade.coefficient),
    date: grade.date,
    comment: grade.comment ?? '',
  }
}

const buildGradeInput = (form: GradeFormState): GradeInput | null => {
  if (!form.subjectId || !form.title.trim() || !form.date) {
    return null
  }

  const coefficient = form.useCoefficient ? Number(form.coefficient) : 1
  if (!Number.isFinite(coefficient) || coefficient <= 0) {
    return null
  }

  if (form.gradeType === 'points') {
    const earnedValue = Number(form.value)
    const gradeMax = Number(form.maxValue)

    if (
      !Number.isFinite(earnedValue) ||
      !Number.isFinite(gradeMax) ||
      gradeMax <= 0 ||
      earnedValue < 0 ||
      earnedValue > gradeMax
    ) {
      return null
    }

    return {
      subject_id: form.subjectId,
      title: form.title.trim(),
      value: earnedValue,
      grade_max: gradeMax,
      coefficient,
      grade_type: 'points',
      date: form.date,
      comment: form.comment.trim() || undefined,
    }
  }

  if (form.gradeType === 'percentage') {
    const percentage = Number(form.value)

    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
      return null
    }

    return {
      subject_id: form.subjectId,
      title: form.title.trim(),
      value: percentage,
      grade_max: 20,
      coefficient,
      grade_type: 'percentage',
      date: form.date,
      comment: form.comment.trim() || undefined,
    }
  }

  return {
    subject_id: form.subjectId,
    title: form.title.trim(),
    value: LETTER_TO_NUMERIC[form.letterValue],
    grade_max: 20,
    coefficient,
    grade_type: 'letter',
    date: form.date,
    comment: form.comment.trim() || undefined,
  }
}

const isFormValid = (form: GradeFormState): boolean => {
  return buildGradeInput(form) !== null
}

const getGradePercentage = (grade: GradeWithSubject): number | null => {
  const gradeType = getNormalizedGradeType(grade.grade_type)

  if (gradeType === 'points') {
    const gradeMax = grade.grade_max ?? 20
    return gradeMax > 0 ? (grade.value / gradeMax) * 100 : null
  }

  if (gradeType === 'percentage') {
    return grade.value
  }

  return null
}

const getGradeDisplay = (grade: GradeWithSubject): string => {
  const gradeType = getNormalizedGradeType(grade.grade_type)

  if (gradeType === 'points') {
    return `${getDisplayNumber(grade.value)}/${getDisplayNumber(grade.grade_max ?? 20)}`
  }

  if (gradeType === 'percentage') {
    return `${getDisplayNumber(grade.value)}%`
  }

  return getLetterFromNumeric(grade.value)
}

const getGradeColorClass = (grade: GradeWithSubject): string => {
  const gradeType = getNormalizedGradeType(grade.grade_type)

  if (gradeType === 'points') {
    const gradeMax = grade.grade_max ?? 20
    return gradeMax > 0 && grade.value / gradeMax >= 0.5 ? 'text-green-500' : 'text-red-500'
  }

  if (gradeType === 'percentage') {
    return grade.value >= 50 ? 'text-green-500' : 'text-red-500'
  }

  return 'text-white'
}

function GradeFormFields({ form, setForm, subjects, isSubmitting }: GradeFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">Matière</label>
        <Select
          value={form.subjectId}
          onValueChange={(subjectId) => {
            setForm((current) => ({ ...current, subjectId }))
          }}
          disabled={isSubmitting}
        >
          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
            <SelectValue placeholder="Choisir une matière" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            {subjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.id} className="select-item-text text-white">
                {subject.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">Titre</label>
        <Input
          value={form.title}
          onChange={(event) => {
            const nextTitle = event.target.value
            setForm((current) => ({ ...current, title: nextTitle }))
          }}
          placeholder="Ex: Contrôle chapitre 3"
          className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">Type de notation</label>
        <Select
          value={form.gradeType}
          onValueChange={(value) => {
            const gradeType = value as GradeType
            setForm((current) => ({
              ...current,
              gradeType,
              maxValue: gradeType === 'points' ? current.maxValue || '20' : current.maxValue,
            }))
          }}
          disabled={isSubmitting}
        >
          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
            <SelectValue placeholder="Choisir un type de notation" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            <SelectItem value="points" className="select-item-text text-white">
              Points (ex: 15/20)
            </SelectItem>
            <SelectItem value="percentage" className="select-item-text text-white">
              Pourcentage (ex: 87%)
            </SelectItem>
            <SelectItem value="letter" className="select-item-text text-white">
              Lettre (ex: A+)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {form.gradeType === 'points' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Note obtenue
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.value}
              onChange={(event) => {
                const nextValue = event.target.value
                setForm((current) => ({ ...current, value: nextValue }))
              }}
              placeholder="15"
              className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Note maximale
            </label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={form.maxValue}
              onChange={(event) => {
                const nextMaxValue = event.target.value
                setForm((current) => ({ ...current, maxValue: nextMaxValue }))
              }}
              placeholder="20"
              className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
              disabled={isSubmitting}
            />
          </div>
        </div>
      )}

      {form.gradeType === 'percentage' && (
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Pourcentage</label>
          <div className="relative">
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={form.value}
              onChange={(event) => {
                const nextValue = event.target.value
                setForm((current) => ({ ...current, value: nextValue }))
              }}
              placeholder="87"
              className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 pr-10"
              disabled={isSubmitting}
            />
            <span className="absolute inset-y-0 right-3 flex items-center text-zinc-400">%</span>
          </div>
        </div>
      )}

      {form.gradeType === 'letter' && (
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Note lettre</label>
          <Select
            value={form.letterValue}
            onValueChange={(value) => {
              const letterValue = value as LetterGrade
              setForm((current) => ({ ...current, letterValue }))
            }}
            disabled={isSubmitting}
          >
            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
              <SelectValue placeholder="Choisir une note lettre" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              {LETTER_OPTIONS.map((letterOption) => (
                <SelectItem
                  key={letterOption}
                  value={letterOption}
                  className="select-item-text text-white"
                >
                  {letterOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-3">
        <label className="flex items-center gap-3 text-sm font-medium text-zinc-300">
          <input
            type="checkbox"
            checked={form.useCoefficient}
            onChange={(event) => {
              const useCoefficient = event.target.checked
              setForm((current) => ({
                ...current,
                useCoefficient,
                coefficient: useCoefficient ? current.coefficient || '1' : '1',
              }))
            }}
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-violet-600"
            disabled={isSubmitting}
          />
          Utiliser un coefficient
        </label>

        {form.useCoefficient && (
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Coefficient</label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={form.coefficient}
              onChange={(event) => {
                const nextCoefficient = event.target.value
                setForm((current) => ({ ...current, coefficient: nextCoefficient }))
              }}
              className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
              disabled={isSubmitting}
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">Date</label>
        <Input
          type="date"
          value={form.date}
          onChange={(event) => {
            const nextDate = event.target.value
            setForm((current) => ({ ...current, date: nextDate }))
          }}
          className="bg-zinc-800 border-zinc-700 text-white"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Commentaire (optionnel)
        </label>
        <Textarea
          value={form.comment}
          onChange={(event) => {
            const nextComment = event.target.value
            setForm((current) => ({ ...current, comment: nextComment }))
          }}
          placeholder="Remarques sur cette note..."
          className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
          rows={3}
          disabled={isSubmitting}
        />
      </div>
    </div>
  )
}

export default function Grades() {
  const { grades, loading, error, addGrade, updateGrade, deleteGrade } = useGrades()
  const { subjects } = useSubjects()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingGrade, setEditingGrade] = useState<GradeWithSubject | null>(null)
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all')
  const [addForm, setAddForm] = useState<GradeFormState>(() => createDefaultFormState([]))
  const [editForm, setEditForm] = useState<GradeFormState>(() => createDefaultFormState([]))
  const [isAdding, setIsAdding] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const filteredGrades = useMemo(() => {
    if (filterSubjectId === 'all') {
      return grades
    }

    return grades.filter((grade) => grade.subject_id === filterSubjectId)
  }, [grades, filterSubjectId])

  const statistics = useMemo(() => {
    const hasLetterGrades = filteredGrades.some(
      (grade) => getNormalizedGradeType(grade.grade_type) === 'letter',
    )

    const gradableEntries = filteredGrades.flatMap((grade) => {
      const percentage = getGradePercentage(grade)
      return percentage === null ? [] : [{ percentage, coefficient: grade.coefficient }]
    })

    const totalWeighted = gradableEntries.reduce((sum, entry) => {
      return sum + entry.percentage * entry.coefficient
    }, 0)

    const totalCoefficient = gradableEntries.reduce((sum, entry) => {
      return sum + entry.coefficient
    }, 0)

    const average = totalCoefficient > 0 ? totalWeighted / totalCoefficient : 0

    return {
      average: Math.round(average * 100) / 100,
      count: filteredGrades.length,
      hasLetterGrades,
    }
  }, [filteredGrades])

  useEffect(() => {
    if (isAddDialogOpen) {
      setAddForm(createDefaultFormState(subjects))
      setIsAdding(false)
    }
  }, [isAddDialogOpen, subjects])

  const handleAddGrade = async () => {
    const payload = buildGradeInput(addForm)
    if (!payload) {
      return
    }

    setIsAdding(true)
    const success = await addGrade(payload)
    setIsAdding(false)

    if (success) {
      setIsAddDialogOpen(false)
    }
  }

  const handleEditClick = (grade: GradeWithSubject) => {
    setEditingGrade(grade)
    setEditForm(createEditFormState(grade))
    setIsEditDialogOpen(true)
  }

  const handleEditGrade = async () => {
    if (!editingGrade) {
      return
    }

    const payload = buildGradeInput(editForm)
    if (!payload) {
      return
    }

    setIsEditing(true)
    const success = await updateGrade(editingGrade.id, payload)
    setIsEditing(false)

    if (success) {
      setIsEditDialogOpen(false)
      setEditingGrade(null)
    }
  }

  const handleEditDialogOpenChange = (open: boolean) => {
    setIsEditDialogOpen(open)

    if (!open) {
      setEditingGrade(null)
      setIsEditing(false)
    }
  }

  const handleDeleteGrade = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) {
      await deleteGrade(id)
    }
  }

  const TableRowSkeleton = () => (
    <TableRow>
      <TableCell>
        <Skeleton className="h-6 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-16" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-10" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-8 w-16" />
      </TableCell>
    </TableRow>
  )

  return (
    <div className="min-h-full bg-zinc-950 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Mes notes</h1>

        <div className="flex gap-3">
          <Select value={filterSubjectId} onValueChange={setFilterSubjectId}>
            <SelectTrigger className="w-48 bg-zinc-800 border-zinc-700 text-white">
              <SelectValue placeholder="Filtrer par matière" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              <SelectItem value="all" className="select-item-text text-white">
                Toutes les matières
              </SelectItem>
              {subjects.map((subject) => (
                <SelectItem
                  key={subject.id}
                  value={subject.id}
                  className="select-item-text text-white"
                >
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-violet-600 hover:bg-violet-700">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une note
              </Button>
            </DialogTrigger>

            <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">Ajouter une note</DialogTitle>
                <DialogDescription className="text-zinc-400">
                  Enregistrez une nouvelle note dans votre bulletin
                </DialogDescription>
              </DialogHeader>

              <GradeFormFields
                form={addForm}
                setForm={setAddForm}
                subjects={subjects}
                isSubmitting={isAdding}
              />

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={isAdding}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleAddGrade}
                  disabled={isAdding || subjects.length === 0 || !isFormValid(addForm)}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  {isAdding ? 'Ajout...' : 'Ajouter'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogOpenChange}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Modifier une note</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Mettez à jour les informations de cette note
            </DialogDescription>
          </DialogHeader>

          <GradeFormFields
            form={editForm}
            setForm={setEditForm}
            subjects={subjects}
            isSubmitting={isEditing}
          />

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => handleEditDialogOpenChange(false)}
              disabled={isEditing}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Annuler
            </Button>
            <Button
              onClick={handleEditGrade}
              disabled={isEditing || !editingGrade || !isFormValid(editForm)}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {isEditing ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm mb-1">Moyenne générale</p>
                <p
                  className={`text-3xl font-bold ${
                    statistics.average >= 50 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {statistics.average.toFixed(2)}%
                </p>
                {statistics.hasLetterGrades && (
                  <p className="text-xs text-zinc-500 mt-2">
                    * Les notes de type lettre sont exclues du calcul
                  </p>
                )}
              </div>
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  statistics.average >= 50 ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}
              >
                <span
                  className={`text-2xl font-bold ${
                    statistics.average >= 50 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {statistics.average >= 50 ? '✓' : '!'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm mb-1">Nombre de notes</p>
                <p className="text-3xl font-bold text-white">{statistics.count}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-violet-500">{statistics.count}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-800 rounded-lg">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-0">
          {!loading && filteredGrades.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ClipboardList className="h-16 w-16 text-zinc-600 mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Aucune note enregistrée</h2>
              <p className="text-zinc-400 mb-6">Commencez par ajouter votre première note !</p>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-violet-600 hover:bg-violet-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une note
              </Button>
            </div>
          )}

          {loading ? (
            <div className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matière</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Coefficient</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRowSkeleton key={index} />
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            filteredGrades.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matière</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Coefficient</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGrades.map((grade) => (
                    <TableRow key={grade.id} className="hover:bg-zinc-800/50 transition-colors duration-150">
                      <TableCell>
                        <span
                          className="inline-block px-3 py-1 rounded-full text-white text-sm font-medium shadow-sm"
                          style={{ backgroundColor: grade.subjects.color }}
                        >
                          {grade.subjects.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-white">{grade.title}</TableCell>
                      <TableCell>
                        <span className={`font-bold text-lg ${getGradeColorClass(grade)}`}>
                          {getGradeDisplay(grade)}
                        </span>
                      </TableCell>
                      <TableCell className="text-white">
                        {getDisplayNumber(grade.coefficient)}
                      </TableCell>
                      <TableCell className="text-white">
                        {new Date(grade.date).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(grade)}
                            className="text-zinc-300 hover:text-white hover:bg-zinc-800"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGrade(grade.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          )}
        </CardContent>
      </Card>
    </div>
  )
}
