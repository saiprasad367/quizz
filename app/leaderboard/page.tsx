"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { useToast } from "@/components/ui/use-toast"
import { db } from "@/lib/firebase"
import { collection, query, getDocs, orderBy, limit } from "firebase/firestore"
import { Trophy, Medal } from "lucide-react"

interface LeaderboardEntry {
  id: string
  userId: string
  userDisplayName: string
  quizId: string
  quizTitle: string
  score: number
  totalQuestions: number
  percentage: number
  completedAt: Date
}

export default function LeaderboardPage() {
  const [topScorers, setTopScorers] = useState<LeaderboardEntry[]>([])
  const [recentScorers, setRecentScorers] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        // Fetch top scorers
        const topScorersQuery = query(collection(db, "attempts"), orderBy("percentage", "desc"), limit(10))
        const topScorersSnapshot = await getDocs(topScorersQuery)

        const topScorersData: LeaderboardEntry[] = []
        for (const doc of topScorersSnapshot.docs) {
          const data = doc.data()

          // Calculate percentage if not already present
          const percentage = data.percentage || Math.round((data.score / data.totalQuestions) * 100)

          topScorersData.push({
            id: doc.id,
            userId: data.userId,
            userDisplayName: data.userDisplayName || "Anonymous",
            quizId: data.quizId,
            quizTitle: data.quizTitle || "Unknown Quiz",
            score: data.score,
            totalQuestions: data.totalQuestions,
            percentage,
            completedAt: data.completedAt?.toDate() || new Date(),
          })
        }

        setTopScorers(topScorersData)

        // Fetch recent scorers
        const recentScorersQuery = query(collection(db, "attempts"), orderBy("completedAt", "desc"), limit(10))
        const recentScorersSnapshot = await getDocs(recentScorersQuery)

        const recentScorersData: LeaderboardEntry[] = []
        for (const doc of recentScorersSnapshot.docs) {
          const data = doc.data()

          // Calculate percentage if not already present
          const percentage = data.percentage || Math.round((data.score / data.totalQuestions) * 100)

          recentScorersData.push({
            id: doc.id,
            userId: data.userId,
            userDisplayName: data.userDisplayName || "Anonymous",
            quizId: data.quizId,
            quizTitle: data.quizTitle || "Unknown Quiz",
            score: data.score,
            totalQuestions: data.totalQuestions,
            percentage,
            completedAt: data.completedAt?.toDate() || new Date(),
          })
        }

        setRecentScorers(recentScorersData)
      } catch (error) {
        console.error("Error fetching leaderboard data:", error)
        toast({
          title: "Error",
          description: "Failed to load leaderboard data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboardData()
  }, [toast])

  const getMedalIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 2:
        return <Medal className="h-5 w-5 text-amber-700" />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground">See who's topping the charts</p>
        </div>

        <Tabs defaultValue="top-scorers" className="w-full">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="top-scorers">Top Scorers</TabsTrigger>
            <TabsTrigger value="recent">Recent Attempts</TabsTrigger>
          </TabsList>
          <TabsContent value="top-scorers" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Quiz Performers</CardTitle>
                <CardDescription>Users with the highest scores across all quizzes</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading leaderboard data...</div>
                ) : topScorers.length > 0 ? (
                  <div className="rounded-md border">
                    <div className="grid grid-cols-12 gap-2 p-4 font-medium border-b">
                      <div className="col-span-1">#</div>
                      <div className="col-span-3">User</div>
                      <div className="col-span-4">Quiz</div>
                      <div className="col-span-2 text-center">Score</div>
                      <div className="col-span-2 text-center">Percentage</div>
                    </div>
                    {topScorers.map((entry, index) => (
                      <div
                        key={entry.id}
                        className="grid grid-cols-12 gap-2 p-4 items-center border-b last:border-0 hover:bg-muted/50"
                      >
                        <div className="col-span-1 flex items-center">
                          {getMedalIcon(index) || <span>{index + 1}</span>}
                        </div>
                        <div className="col-span-3 font-medium truncate">{entry.userDisplayName}</div>
                        <div className="col-span-4 truncate text-muted-foreground">{entry.quizTitle}</div>
                        <div className="col-span-2 text-center">
                          {entry.score}/{entry.totalQuestions}
                        </div>
                        <div className="col-span-2 text-center font-medium">{entry.percentage}%</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No quiz attempts recorded yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="recent" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Quiz Attempts</CardTitle>
                <CardDescription>The most recent quiz completions</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading recent attempts...</div>
                ) : recentScorers.length > 0 ? (
                  <div className="rounded-md border">
                    <div className="grid grid-cols-12 gap-2 p-4 font-medium border-b">
                      <div className="col-span-3">User</div>
                      <div className="col-span-4">Quiz</div>
                      <div className="col-span-2 text-center">Score</div>
                      <div className="col-span-3 text-right">Completed</div>
                    </div>
                    {recentScorers.map((entry) => (
                      <div
                        key={entry.id}
                        className="grid grid-cols-12 gap-2 p-4 items-center border-b last:border-0 hover:bg-muted/50"
                      >
                        <div className="col-span-3 font-medium truncate">{entry.userDisplayName}</div>
                        <div className="col-span-4 truncate text-muted-foreground">{entry.quizTitle}</div>
                        <div className="col-span-2 text-center">
                          {entry.score}/{entry.totalQuestions}
                        </div>
                        <div className="col-span-3 text-right text-muted-foreground">
                          {entry.completedAt.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No quiz attempts recorded yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  )
}

