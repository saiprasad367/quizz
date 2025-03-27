"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { useToast } from "@/components/ui/use-toast"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { Search, Clock, User } from "lucide-react"

interface Quiz {
  id: string
  title: string
  description: string
  createdBy: string
  createdAt: Date
  questionsCount: number
  creatorName?: string
}

export default function ExplorePage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const q = query(collection(db, "quizzes"), where("isPublic", "==", true), orderBy("createdAt", "desc"))
        const querySnapshot = await getDocs(q)

        const quizzesData: Quiz[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          quizzesData.push({
            id: doc.id,
            title: data.title,
            description: data.description,
            createdBy: data.createdBy,
            createdAt: data.createdAt?.toDate() || new Date(),
            questionsCount: data.questions?.length || 0,
            creatorName: data.creatorName || "Anonymous",
          })
        })

        setQuizzes(quizzesData)
        setFilteredQuizzes(quizzesData)
      } catch (error) {
        console.error("Error fetching quizzes:", error)
        toast({
          title: "Error",
          description: "Failed to load quizzes. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchQuizzes()
  }, [toast])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredQuizzes(quizzes)
    } else {
      const filtered = quizzes.filter(
        (quiz) =>
          quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          quiz.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredQuizzes(filtered)
    }
  }, [searchQuery, quizzes])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Explore Quizzes</h1>
          <p className="text-muted-foreground">Discover and take quizzes created by the community</p>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search quizzes by title or description..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center py-12">Loading quizzes...</div>
        ) : filteredQuizzes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map((quiz) => (
              <Card key={quiz.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="line-clamp-1">{quiz.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{quiz.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="text-sm text-muted-foreground space-y-2">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      <span>Created by: {quiz.creatorName}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>
                        {quiz.createdAt.toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div>Questions: {quiz.questionsCount}</div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/quiz/${quiz.id}`} className="w-full">
                    <Button className="w-full">Take Quiz</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No quizzes found matching your search.</p>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

