import { useState } from 'react'
import { Plus, BookOpen, Trash2 } from 'lucide-react'
import { useSubjects, Subject } from '@/hooks/useSubjects'
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
import { Input } from '@/components/ui/input'

// Palette de couleurs prédéfinies pour les matières
const COLOR_PALETTE = [
  '#8B5CF6', // violet
  '#3B82F6', // bleu
  '#10B981', // vert
  '#F59E0B', // orange
  '#EF4444', // rouge
  '#EC4899', // rose
  '#06B6D4', // cyan
  '#F97316', // orange vif
  '#84CC16', // lime
  '#6366F1', // indigo
]

export default function Subjects() {
  const { subjects, loading, error, addSubject, deleteSubject } = useSubjects()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [subjectName, setSubjectName] = useState('')
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Réinitialiser le formulaire à chaque ouverture du dialog
  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setSubjectName('')
      setSelectedColor(COLOR_PALETTE[0])
      setIsSubmitting(false)
    }
  }

  // Gérer l'ajout d'une matière
  const handleAddSubject = async () => {
    if (!subjectName.trim()) return

    setIsSubmitting(true)
    const success = await addSubject(subjectName.trim(), selectedColor)
    
    if (success) {
      setIsDialogOpen(false)
    }
    setIsSubmitting(false)
  }

  // Composant Skeleton pour l'état de chargement
  const SubjectSkeleton = () => (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-700" />
      <CardContent className="p-4">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  )

  // Composant carte matière
  const SubjectCard = ({ subject }: { subject: Subject }) => (
    <Card 
      className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
      style={{ borderLeftColor: subject.color, borderLeftWidth: '4px' }}
    >
      {/* Bouton de suppression visible au survol */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-500 hover:text-red-600 hover:bg-red-50"
        onClick={() => deleteSubject(subject.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      
      <CardContent className="p-4">
        <h3 
          className="text-lg font-semibold text-white mb-2"
          style={{ color: subject.color }}
        >
          {subject.name}
        </h3>
        <p className="text-zinc-400 text-sm">
          Créée le {new Date(subject.created_at).toLocaleDateString('fr-FR')}
        </p>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-full bg-zinc-950 p-6">
      {/* En-tête avec titre et bouton d'ajout */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Mes matières</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button className="bg-violet-600 hover:bg-violet-700">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une matière
            </Button>
          </DialogTrigger>
          
          <DialogContent className="bg-zinc-900 border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-white">Ajouter une matière</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Créez une nouvelle matière pour organiser vos notes
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Champ pour le nom de la matière */}
              <div>
                <label htmlFor="subject-name" className="block text-sm font-medium text-zinc-300 mb-2">
                  Nom de la matière
                </label>
                <Input
                  id="subject-name"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="Ex: Mathématiques, Physique..."
                  className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
                  disabled={isSubmitting}
                />
              </div>
              
              {/* Palette de couleurs */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Couleur de la matière
                </label>
                <div className="flex flex-wrap gap-3">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-7 h-7 rounded-full transition-all duration-200 ${
                        selectedColor === color
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900'
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                      disabled={isSubmitting}
                    />
                  ))}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleAddSubject}
                  disabled={!subjectName.trim() || isSubmitting}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  {isSubmitting ? 'Ajout...' : 'Ajouter'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Affichage des erreurs */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-800 rounded-lg">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {/* Contenu principal */}
      <div className="min-h-[400px]">
        {/* État de chargement */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <SubjectSkeleton key={index} />
            ))}
          </div>
        )}

        {/* État vide */}
        {!loading && subjects.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="h-16 w-16 text-zinc-600 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Aucune matière pour l'instant
            </h2>
            <p className="text-zinc-400 mb-6">
              Commence par en ajouter une !
            </p>
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="bg-violet-600 hover:bg-violet-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une matière
            </Button>
          </div>
        )}

        {/* État normal avec les matières */}
        {!loading && subjects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject) => (
              <SubjectCard key={subject.id} subject={subject} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
