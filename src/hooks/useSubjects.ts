import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

// Types TypeScript pour la table subjects
export interface Subject {
  id: string
  user_id: string
  name: string
  color: string
  icon: string | null
  created_at: string
}

interface UseSubjectsReturn {
  subjects: Subject[]
  loading: boolean
  error: string | null
  addSubject: (name: string, color: string) => Promise<boolean>
  deleteSubject: (id: string) => Promise<boolean>
  refetch: () => Promise<void>
}

export function useSubjects(): UseSubjectsReturn {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fonction pour récupérer la liste des matières
  const fetchSubjects = async () => {
    if (!user) {
      setSubjects([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Requête Supabase avec filtrage par user_id (bonne pratique même avec RLS)
      const { data, error: supabaseError } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (supabaseError) {
        console.error('Erreur Supabase lors de la récupération des matières:', supabaseError)
        setError(supabaseError.message)
        setSubjects([])
      } else {
        setSubjects(data || [])
      }
    } catch (err) {
      console.error('Erreur inattendue lors de la récupération des matières:', err)
      setError('Erreur lors du chargement des matières')
      setSubjects([])
    } finally {
      setLoading(false)
    }
  }

  // Effet pour charger les matières au montage et quand l'utilisateur change
  useEffect(() => {
    fetchSubjects()
  }, [user])

  // Fonction pour ajouter une matière
  const addSubject = async (name: string, color: string): Promise<boolean> => {
    if (!user) {
      setError('Utilisateur non connecté')
      return false
    }

    if (!name.trim()) {
      setError('Le nom de la matière est requis')
      return false
    }

    try {
      setError(null)

      // Insertion via le client Supabase (utilise la fetch patchée de Tauri)
      const { error: supabaseError } = await supabase
        .from('subjects')
        .insert({
          user_id: user.id,
          name: name.trim(),
          color,
          icon: null // Optionnel, null pour l'instant
        })

      if (supabaseError) {
        console.error('Erreur Supabase lors de l\'ajout de la matière:', supabaseError)
        setError(supabaseError.message)
        return false
      }

      // Recharger la liste après l'ajout
      await fetchSubjects()
      return true
    } catch (err) {
      console.error('Erreur inattendue lors de l\'ajout de la matière:', err)
      setError('Erreur lors de l\'ajout de la matière')
      return false
    }
  }

  // Fonction pour supprimer une matière
  const deleteSubject = async (id: string): Promise<boolean> => {
    if (!user) {
      setError('Utilisateur non connecté')
      return false
    }

    try {
      setError(null)

      // Suppression via le client Supabase avec double vérification de sécurité
      const { error: supabaseError } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id) // Double sécurité pour éviter les suppressions croisées

      if (supabaseError) {
        console.error('Erreur Supabase lors de la suppression de la matière:', supabaseError)
        setError(supabaseError.message)
        return false
      }

      // Recharger la liste après la suppression
      await fetchSubjects()
      return true
    } catch (err) {
      console.error('Erreur inattendue lors de la suppression de la matière:', err)
      setError('Erreur lors de la suppression de la matière')
      return false
    }
  }

  return {
    subjects,
    loading,
    error,
    addSubject,
    deleteSubject,
    refetch: fetchSubjects
  }
}
