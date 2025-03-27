"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { PlusCircle, Edit, Trash2, Play } from "lucide-react"
import Link from "next/link"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore"
import { useToast } from "@/components/ui/use-toast"

interface Quiz {
  id: string
  title: string
  description: string
  createdAt: any
  questionsCount: number
}

export default function Dashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [myQuizzes, setMyQuizzes] = useState<Quiz[]>([])
  const [attemptedQuizzes, setAttemptedQuizzes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!user) return

      try {
        // Fetch quizzes created by the user
        const q = query(collection(db, "quizzes"), where("createdBy", "==", user.uid))
        const querySnapshot = await getDocs(q)

        const quizzes: Quiz[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          quizzes.push({
            id: doc.id,
            title: data.title,
            description: data.description,
            createdAt: data.createdAt?.toDate() || new Date(),
            questionsCount: data.questions?.length || 0,
          })
        })

        setMyQuizzes(quizzes)

        // Fetch attempted quizzes
        const attemptsQuery = query(collection(db, "attempts"), where("userId", "==", user.uid))
        const attemptsSnapshot = await getDocs(attemptsQuery)

        const attempts: any[] = []
        attemptsSnapshot.forEach((doc) => {
          attempts.push({
            id: doc.id,
            ...doc.data(),
            completedAt: doc.data().completedAt?.toDate() || new Date(),
          })
        })

        setAttemptedQuizzes(attempts)
      } catch (error) {
        console.error("Error fetching quizzes:", error)
        toast({
          title: "Error",
          description: "Failed to load your quizzes. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchQuizzes()
    }
  }, [user, toast])

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm("Are you sure you want to delete this quiz?")) return

    try {
      await deleteDoc(doc(db, "quizzes", quizId))
      setMyQuizzes(myQuizzes.filter((quiz) => quiz.id !== quizId))
      toast({
        title: "Quiz deleted",
        description: "The quiz has been successfully deleted.",
      })
    } catch (error) {
      console.error("Error deleting quiz:", error)
      toast({
        title: "Error",
        description: "Failed to delete the quiz. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.displayName || user.email}</p>
          </div>
          <Link href="/create-quiz">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Quiz
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="my-quizzes" className="w-full">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="my-quizzes">My Quizzes</TabsTrigger>
            <TabsTrigger value="attempted">Attempted Quizzes</TabsTrigger>
          </TabsList>
          <TabsContent value="my-quizzes" className="mt-6">
            {isLoading ? (
              <div className="text-center py-8">Loading your quizzes...</div>
            ) : myQuizzes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myQuizzes.map((quiz) => (
                  <Card key={quiz.id}>
                    <CardHeader className="pb-3">
                      <CardTitle>{quiz.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{quiz.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground mb-4">
                        <div>Questions: {quiz.questionsCount}</div>
                        <div>Created: {quiz.createdAt.toLocaleDateString()}</div>
                      </div>
                      <div className="flex space-x-2">
                        <Link href={`/quiz/${quiz.id}`} className="flex-1">
                          <Button variant="outline" className="w-full" size="sm">
                            <Play className="mr-2 h-4 w-4" />
                            Preview
                          </Button>
                        </Link>
                        <Link href={`/edit-quiz/${quiz.id}`} className="flex-1">
                          <Button variant="outline" className="w-full" size="sm">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteQuiz(quiz.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">You haven&apos;t created any quizzes yet.</p>
                <Link href="/create-quiz">
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Your First Quiz
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>
          <TabsContent value="attempted" className="mt-6">
            {isLoading ? (
              <div className="text-center py-8">Loading your attempts...</div>
            ) : attemptedQuizzes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {attemptedQuizzes.map((attempt) => (
                  <Card key={attempt.id}>
                    <CardHeader className="pb-3">
                      <CardTitle>{attempt.quizTitle}</CardTitle>
                      <CardDescription>
                        Score: {attempt.score}/{attempt.totalQuestions}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground mb-4">
                        <div>Completed: {attempt.completedAt.toLocaleDateString()}</div>
                        <div>Percentage: {Math.round((attempt.score / attempt.totalQuestions) * 100)}%</div>
                      </div>
                      <Link href={`/quiz-results/${attempt.id}`}>
                        <Button variant="outline" className="w-full" size="sm">
                          View Results
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">You haven&apos;t attempted any quizzes yet.</p>
                <Link href="/explore">
                  <Button>Explore Quizzes</Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  )
}

