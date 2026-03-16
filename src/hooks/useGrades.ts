import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export type GradeType = 'points' | 'percentage' | 'letter'

const GRADE_TYPES: GradeType[] = ['points', 'percentage', 'letter']

const normalizeGradeType = (gradeType: string | null | undefined): GradeType => {
  return GRADE_TYPES.includes(gradeType as GradeType) ? (gradeType as GradeType) : 'points'
}

// Types TypeScript pour la table grades
export interface Grade {
  id: string
  user_id: string
  subject_id: string
  title: string
  value: number
  max_value: number | null
  coefficient: number
  grade_type: GradeType
  date: string
  comment: string | null
  created_at: string
}

// Type étendu avec les informations de la matière jointe
export interface GradeWithSubject extends Grade {
  subjects: {
    name: string
    color: string
  }
}

// Type pour les données d'ajout / mise à jour de note
export interface GradeInput {
  subject_id: string
  title: string
  value: number
  max_value?: number | null
  coefficient: number
  grade_type: GradeType
  date: string
  comment?: string
}

export type AddGradeData = GradeInput

interface UseGradesReturn {
  grades: GradeWithSubject[]
  loading: boolean
  error: string | null
  addGrade: (data: GradeInput) => Promise<boolean>
  updateGrade: (id: string, data: Partial<GradeInput>) => Promise<boolean>
  deleteGrade: (id: string) => Promise<boolean>
  refetch: () => Promise<void>
}

type GradePayload = {
  subject_id?: string
  title?: string
  value?: number
  max_value?: number | null
  coefficient?: number
  grade_type?: GradeType
  date?: string
  comment?: string | null
}

const validateGradeData = (data: Partial<GradeInput>): string | null => {
  if (data.subject_id !== undefined && !data.subject_id.trim()) {
    return 'La matière est requise'
  }

  if (data.title !== undefined && !data.title.trim()) {
    return 'Le titre est requis'
  }

  if (data.coefficient !== undefined && data.coefficient <= 0) {
    return 'Le coefficient doit être positif'
  }

  if (data.grade_type !== undefined && !GRADE_TYPES.includes(data.grade_type)) {
    return 'Le type de note est invalide'
  }

  if (data.grade_type === 'points') {
    if (data.value === undefined) {
      return 'La note obtenue est requise'
    }

    const maxValue = data.max_value ?? 20

    if (maxValue <= 0) {
      return 'La note maximale doit être positive'
    }

    if (data.value < 0 || data.value > maxValue) {
      return 'La note obtenue doit être comprise entre 0 et la note maximale'
    }
  }

  if (data.grade_type === 'percentage') {
    if (data.value === undefined) {
      return 'Le pourcentage est requis'
    }

    if (data.value < 0 || data.value > 100) {
      return 'Le pourcentage doit être compris entre 0 et 100'
    }
  }

  if (data.grade_type === 'letter') {
    if (data.value === undefined) {
      return 'La note lettre est requise'
    }

    if (!Number.isInteger(data.value) || data.value < 0 || data.value > 7) {
      return 'La note lettre est invalide'
    }
  }

  return null
}

const buildGradePayload = (data: Partial<GradeInput>): GradePayload => {
  const payload: GradePayload = {}

  if (data.subject_id !== undefined) {
    payload.subject_id = data.subject_id
  }

  if (data.title !== undefined) {
    payload.title = data.title.trim()
  }

  if (data.value !== undefined) {
    payload.value = data.value
  }

  if (data.coefficient !== undefined) {
    payload.coefficient = data.coefficient
  }

  if (data.grade_type !== undefined) {
    payload.grade_type = normalizeGradeType(data.grade_type)
    payload.max_value = payload.grade_type === 'points' ? (data.max_value ?? 20) : null
  } else if (data.max_value !== undefined) {
    payload.max_value = data.max_value
  }

  if (data.date !== undefined) {
    payload.date = data.date
  }

  if (data.comment !== undefined) {
    payload.comment = data.comment.trim() || null
  }

  return payload
}

export function useGrades(): UseGradesReturn {
  const { user } = useAuth()
  const [grades, setGrades] = useState<GradeWithSubject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGrades = async () => {
    if (!user) {
      setGrades([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: supabaseError } = await supabase
        .from('grades')
        .select('*, subjects(name, color)')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (supabaseError) {
        console.error('Erreur Supabase lors de la récupération des notes:', supabaseError)
        setError(supabaseError.message)
        setGrades([])
      } else {
        const normalizedGrades = (data ?? []).map((grade) => ({
          ...grade,
          grade_type: normalizeGradeType(grade.grade_type),
          max_value:
            normalizeGradeType(grade.grade_type) === 'points' ? (grade.max_value ?? 20) : null,
        })) as GradeWithSubject[]

        setGrades(normalizedGrades)
      }
    } catch (err) {
      console.error('Erreur inattendue lors de la récupération des notes:', err)
      setError('Erreur lors du chargement des notes')
      setGrades([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGrades()
  }, [user])

  const addGrade = async (data: GradeInput): Promise<boolean> => {
    if (!user) {
      setError('Utilisateur non connecté')
      return false
    }

    const validationError = validateGradeData(data)
    if (validationError) {
      setError(validationError)
      return false
    }

    try {
      setError(null)

      const payload = buildGradePayload(data)

      const { error: supabaseError } = await supabase.from('grades').insert({
        user_id: user.id,
        ...payload,
      })

      if (supabaseError) {
        console.error("Erreur Supabase lors de l'ajout de la note:", supabaseError)
        setError(supabaseError.message)
        return false
      }

      await fetchGrades()
      return true
    } catch (err) {
      console.error("Erreur inattendue lors de l'ajout de la note:", err)
      setError("Erreur lors de l'ajout de la note")
      return false
    }
  }

  const updateGrade = async (id: string, data: Partial<GradeInput>): Promise<boolean> => {
    if (!user) {
      setError('Utilisateur non connecté')
      return false
    }

    if (!id.trim()) {
      setError('Identifiant de note invalide')
      return false
    }

    const validationError = validateGradeData(data)
    if (validationError) {
      setError(validationError)
      return false
    }

    try {
      setError(null)

      const payload = buildGradePayload(data)

      const { error: supabaseError } = await supabase
        .from('grades')
        .update(payload)
        .eq('id', id)
        .eq('user_id', user.id)

      if (supabaseError) {
        console.error('Erreur Supabase lors de la modification de la note:', supabaseError)
        setError(supabaseError.message)
        return false
      }

      await fetchGrades()
      return true
    } catch (err) {
      console.error('Erreur inattendue lors de la modification de la note:', err)
      setError('Erreur lors de la modification de la note')
      return false
    }
  }

  const deleteGrade = async (id: string): Promise<boolean> => {
    if (!user) {
      setError('Utilisateur non connecté')
      return false
    }

    try {
      setError(null)

      const { error: supabaseError } = await supabase
        .from('grades')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (supabaseError) {
        console.error('Erreur Supabase lors de la suppression de la note:', supabaseError)
        setError(supabaseError.message)
        return false
      }

      await fetchGrades()
      return true
    } catch (err) {
      console.error('Erreur inattendue lors de la suppression de la note:', err)
      setError('Erreur lors de la suppression de la note')
      return false
    }
  }

  return {
    grades,
    loading,
    error,
    addGrade,
    updateGrade,
    deleteGrade,
    refetch: fetchGrades,
  }
}
