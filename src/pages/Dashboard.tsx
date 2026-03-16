import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  TrendingUp, 
  ClipboardList, 
  Trophy, 
  Target, 
  BarChart2,
  Plus
} from 'lucide-react'
import { useGrades } from '@/hooks/useGrades'
import { useSubjects } from '@/hooks/useSubjects'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

export default function Dashboard() {
  const navigate = useNavigate()
  const { grades, loading } = useGrades()
  const { subjects } = useSubjects()

  // Utilitaire pour parser les dates en heure locale (éviter les décalages UTC)
  const parseLocalDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day) // mois 0-indexé, interprété en heure locale
  }

  // Message de bienvenue dynamique selon l'heure
  const getWelcomeMessage = () => {
    const hour = new Date().getHours()
    let greeting = ''
    let emoji = ''
    
    if (hour >= 5 && hour < 12) {
      greeting = 'Bonne matinée'
      emoji = '🌅'
    } else if (hour >= 12 && hour < 18) {
      greeting = 'Bon après-midi'
      emoji = '☀️'
    } else {
      greeting = 'Bonne soirée'
      emoji = '🌙'
    }
    
    return `${greeting} ${emoji}`
  }

  // Calcul des statistiques générales
  const statistics = useMemo(() => {
    if (grades.length === 0) {
      return {
        overallAverage: 0,
        totalGrades: 0,
        subjectAverages: [] as Array<{ name: string; color: string; average: number; count: number }>,
        bestSubject: null as { name: string; color: string; average: number } | null,
        worstSubject: null as { name: string; color: string; average: number } | null,
        progressData: [] as Array<{ date: string; average: number }>
      }
    }

    // Conversion des notes en pourcentages
    const gradesAsPercentage = grades.map(grade => {
      let percentage = 0
      if (grade.grade_type === 'percentage') {
        percentage = grade.value
      } else if (grade.grade_type === 'points') {
        percentage = (grade.value / grade.grade_max) * 100
      } else if (grade.grade_type === 'letter') {
        // Conversion simple pour les lettres (A=90, B=80, C=70, D=60, F=50)
        const letterMap: { [key: string]: number } = {
          'A': 90, 'B': 80, 'C': 70, 'D': 60, 'F': 50
        }
        percentage = letterMap[String(grade.value).toUpperCase()] || 50
      }
      return { ...grade, percentage }
    })

    // Moyenne générale pondérée
    const totalWeighted = gradesAsPercentage.reduce((sum, grade) => {
      return sum + (grade.percentage * grade.coefficient)
    }, 0)
    const totalCoefficient = grades.reduce((sum, grade) => sum + grade.coefficient, 0)
    const overallAverage = totalCoefficient > 0 ? totalWeighted / totalCoefficient : 0

    // Moyennes par matière
    const subjectGroups = gradesAsPercentage.reduce((groups, grade) => {
      const subjectId = grade.subject_id
      if (!groups[subjectId]) {
        groups[subjectId] = []
      }
      groups[subjectId].push(grade)
      return groups
    }, {} as Record<string, typeof gradesAsPercentage>)

    const subjectAverages = Object.entries(subjectGroups).map(([subjectId, subjectGrades]) => {
      const subject = subjects.find(s => s.id === subjectId)
      const weightedSum = subjectGrades.reduce((sum, grade) => sum + (grade.percentage * grade.coefficient), 0)
      const subjectCoeff = subjectGrades.reduce((sum, grade) => sum + grade.coefficient, 0)
      const average = subjectCoeff > 0 ? weightedSum / subjectCoeff : 0
      
      return {
        name: subject?.name || 'Inconnue',
        color: subject?.color || '#8B5CF6',
        average: Math.round(average * 10) / 10,
        count: subjectGrades.length
      }
    })

    // Meilleure et pire matière (exclure les matières avec moins de 2 notes)
    const validSubjects = subjectAverages.filter(s => s.count >= 2)
    const bestSubject = validSubjects.length > 0 
      ? validSubjects.reduce((best, current) => current.average > best.average ? current : best)
      : null
    const worstSubject = validSubjects.length > 0
      ? validSubjects.reduce((worst, current) => current.average < worst.average ? current : worst)
      : null

    // Données de progression dans le temps
    const sortedGrades = [...gradesAsPercentage].sort((a, b) => 
      parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime()
    )
    
    let cumulativeSum = 0
    let cumulativeCoeff = 0
    const progressData = sortedGrades.map(grade => {
      cumulativeSum += grade.percentage * grade.coefficient
      cumulativeCoeff += grade.coefficient
      const average = cumulativeCoeff > 0 ? cumulativeSum / cumulativeCoeff : 0
      
      return {
        date: parseLocalDate(grade.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        average: Math.round(average * 10) / 10
      }
    })

    return {
      overallAverage: Math.round(overallAverage * 100) / 100,
      totalGrades: grades.length,
      subjectAverages,
      bestSubject,
      worstSubject,
      progressData
    }
  }, [grades, subjects])

  // État vide
  if (!loading && grades.length === 0) {
    return (
      <div className="min-h-full bg-zinc-950 p-6">
        {/* Section 1 — En-tête de bienvenue */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {getWelcomeMessage()}
          </h1>
          <p className="text-zinc-400 text-lg">
            Voici un résumé de ta progression académique.
          </p>
        </div>

        {/* État vide */}
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BarChart2 className="h-16 w-16 text-zinc-600 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Commence à ajouter des notes pour voir ta progression ici !
          </h2>
          <p className="text-zinc-400 mb-6">
            Ajoute tes premières notes pour commencer à suivre tes résultats.
          </p>
          <Button 
            onClick={() => navigate('/grades')}
            className="bg-violet-600 hover:bg-violet-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter ma première note
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-zinc-950 p-6">
      {/* Section 1 — En-tête de bienvenue */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          {getWelcomeMessage()}
        </h1>
        <p className="text-zinc-400 text-lg">
          Voici un résumé de ta progression académique.
        </p>
      </div>

      {/* Section 2 — Grille de 4 cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Carte 1 — Moyenne générale */}
        <div className="hover:scale-[1.02] transition-transform duration-200 cursor-default">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">
                Moyenne générale
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <span className={statistics.overallAverage >= 50 ? 'text-green-500' : 'text-red-500'}>
                  {statistics.overallAverage}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Carte 2 — Nombre total de notes */}
        <div className="hover:scale-[1.02] transition-transform duration-200 cursor-default">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">
                Nombre total de notes
              </CardTitle>
              <ClipboardList className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {statistics.totalGrades}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Carte 3 — Meilleure matière */}
        <div className="hover:scale-[1.02] transition-transform duration-200 cursor-default">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">
                Meilleure matière
              </CardTitle>
              <Trophy className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              {statistics.bestSubject ? (
                <div className="flex items-center gap-2">
                  <span 
                    className="inline-block px-2 py-1 rounded-full text-white text-xs font-medium"
                    style={{ backgroundColor: statistics.bestSubject.color }}
                  >
                    {statistics.bestSubject.name}
                  </span>
                  <span className="text-white font-bold">
                    {statistics.bestSubject.average}%
                  </span>
                </div>
              ) : (
                <div className="text-zinc-400 text-sm">
                  Pas assez de données
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Carte 4 — Matière à améliorer */}
        <div className="hover:scale-[1.02] transition-transform duration-200 cursor-default">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">
                Matière à améliorer
              </CardTitle>
              <Target className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              {statistics.worstSubject ? (
                <div className="flex items-center gap-2">
                  <span 
                    className="inline-block px-2 py-1 rounded-full text-white text-xs font-medium"
                    style={{ backgroundColor: statistics.worstSubject.color }}
                  >
                    {statistics.worstSubject.name}
                  </span>
                  <span className="text-white font-bold">
                    {statistics.worstSubject.average}%
                  </span>
                </div>
              ) : (
                <div className="text-zinc-400 text-sm">
                  Pas assez de données
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section 3 — Graphique en barres */}
      <Card className="bg-zinc-900 border-zinc-800 mb-8">
        <CardHeader>
          <CardTitle className="text-white">Moyennes par matière</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[280px] w-full animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={statistics.subjectAverages}>
                <CartesianGrid strokeDasharray="3 3" stroke="#71717a" />
                <XAxis 
                  dataKey="name" 
                  stroke="#a1a1aa"
                  tick={{ fill: "#a1a1aa" }}
                />
                <YAxis 
                  domain={[0, 100]}
                  stroke="#a1a1aa"
                  tick={{ fill: "#a1a1aa" }}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload[0]) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-zinc-800 p-3 rounded-lg border border-zinc-700">
                          <p className="text-white font-medium">{data.name}</p>
                          <p className="text-zinc-300">
                            Moyenne: <span className="text-white font-bold">{data.average}%</span>
                          </p>
                          <p className="text-zinc-300">
                            Notes: <span className="text-white font-bold">{data.count}</span>
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <ReferenceLine 
                  y={50} 
                  stroke="#ffffff" 
                  strokeDasharray="5 5" 
                  strokeWidth={2}
                  label={{ value: "Moyenne", fill: "#ffffff", position: "top" }}
                />
                <Bar dataKey="average" radius={[4, 4, 0, 0]}>
                  {statistics.subjectAverages.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Section 4 — Graphique en ligne */}
      <Card className="bg-zinc-900 border-zinc-800 mb-8">
        <CardHeader>
          <CardTitle className="text-white">Progression dans le temps</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[280px] w-full animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={statistics.progressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#71717a" />
                <XAxis 
                  dataKey="date" 
                  stroke="#a1a1aa"
                  tick={{ fill: "#a1a1aa" }}
                />
                <YAxis 
                  domain={[0, 100]}
                  stroke="#a1a1aa"
                  tick={{ fill: "#a1a1aa" }}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload[0]) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-zinc-800 p-3 rounded-lg border border-zinc-700">
                          <p className="text-white font-medium">
                            Date: {parseLocalDate(data.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </p>
                          <p className="text-zinc-300">
                            Moyenne: <span className="text-white font-bold">{data.average}%</span>
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="average" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  dot={{ fill: "#8B5CF6", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Section 5 — Tableau des dernières notes */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Dernières notes ajoutées</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matière</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matière</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grades.slice(0, 5).map((grade) => (
                  <TableRow key={grade.id}>
                    <TableCell>
                      <span 
                        className="inline-block px-3 py-1 rounded-full text-white text-sm font-medium"
                        style={{ backgroundColor: grade.subjects.color }}
                      >
                        {grade.subjects.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-white">{grade.title}</TableCell>
                    <TableCell>
                      <span className="text-white font-medium">
                        {grade.grade_type === 'letter' ? grade.value :
                         grade.grade_type === 'percentage' ? `${grade.value}%` :
                         `${grade.value}/${grade.grade_max}`}
                      </span>
                    </TableCell>
                    <TableCell className="text-white">
                      {parseLocalDate(grade.date).toLocaleDateString('fr-FR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <div className="p-4 text-center border-t border-zinc-800">
          <Button 
            variant="outline" 
            onClick={() => navigate('/grades')}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            Voir toutes les notes →
          </Button>
        </div>
      </Card>
    </div>
  )
}
