"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { useToast } from "@/components/ui/use-toast"
import { db } from "@/lib/firebase"
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore"
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react"

interface Option {
  text: string
  isCorrect: boolean
}

interface Question {
  text: string
  options: Option[]
}

interface Quiz {
  id: string
  title: string
  description: string
  questions: Question[]
  createdBy: string
}

export default function QuizPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [score, setScore] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const quizDoc = await getDoc(doc(db, "quizzes", params.id))

        if (!quizDoc.exists()) {
          toast({
            title: "Quiz not found",
            description: "The requested quiz does not exist.",
            variant: "destructive",
          })
          router.push("/explore")
          return
        }

        const quizData = quizDoc.data()
        setQuiz({
          id: quizDoc.id,
          title: quizData.title,
          description: quizData.description,
          questions: quizData.questions,
          createdBy: quizData.createdBy,
        })

        // Initialize selected options array with empty strings
        setSelectedOptions(new Array(quizData.questions.length).fill(""))
      } catch (error) {
        console.error("Error fetching quiz:", error)
        toast({
          title: "Error",
          description: "Failed to load the quiz. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchQuiz()
  }, [params.id, router, toast])

  const handleOptionSelect = (optionIndex: number) => {
    const newSelectedOptions = [...selectedOptions]
    newSelectedOptions[currentQuestionIndex] = optionIndex.toString()
    setSelectedOptions(newSelectedOptions)
  }

  const goToNextQuestion = () => {
    if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const calculateScore = () => {
    if (!quiz) return 0

    let correctAnswers = 0

    quiz.questions.forEach((question, qIndex) => {
      const selectedOptionIndex = Number.parseInt(selectedOptions[qIndex])
      if (!isNaN(selectedOptionIndex) && question.options[selectedOptionIndex]?.isCorrect) {
        correctAnswers++
      }
    })

    return correctAnswers
  }

  const handleSubmitQuiz = async () => {
    if (!quiz || !user) return

    // Check if all questions are answered
    const unansweredQuestions = selectedOptions.findIndex((option) => option === "")
    if (unansweredQuestions !== -1) {
      toast({
        title: "Incomplete quiz",
        description: `Please answer question ${unansweredQuestions + 1} before submitting.`,
        variant: "destructive",
      })
      setCurrentQuestionIndex(unansweredQuestions)
      return
    }

    try {
      setIsSubmitting(true)

      // Calculate score
      const finalScore = calculateScore()
      setScore(finalScore)

      // Save attempt to Firestore
      await addDoc(collection(db, "attempts"), {
        quizId: quiz.id,
        quizTitle: quiz.title,
        userId: user.uid,
        userDisplayName: user.displayName || user.email,
        answers: selectedOptions.map((option, index) => ({
          questionText: quiz.questions[index].text,
          selectedOptionIndex: Number.parseInt(option),
          selectedOptionText: quiz.questions[index].options[Number.parseInt(option)]?.text || "",
          correctOptionIndex: quiz.questions[index].options.findIndex((o) => o.isCorrect),
          isCorrect: quiz.questions[index].options[Number.parseInt(option)]?.isCorrect || false,
        })),
        score: finalScore,
        totalQuestions: quiz.questions.length,
        completedAt: serverTimestamp(),
      })

      setQuizCompleted(true)
    } catch (error) {
      console.error("Error submitting quiz:", error)
      toast({
        title: "Error",
        description: "Failed to submit your answers. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p>Loading quiz...</p>
        </main>
        <Footer />
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p>Quiz not found.</p>
        </main>
        <Footer />
      </div>
    )
  }

  if (quizCompleted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="text-center">Quiz Completed!</CardTitle>
              <CardDescription className="text-center">You have completed the quiz "{quiz.title}"</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center py-6">
                <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-2xl font-bold">Your Score</h3>
                <p className="text-4xl font-bold mt-2">
                  {score} / {quiz.questions.length}
                </p>
                <p className="text-muted-foreground mt-1">({Math.round((score / quiz.questions.length) * 100)}%)</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center space-x-4">
              <Button onClick={() => router.push("/explore")}>Explore More Quizzes</Button>
              <Button variant="outline" onClick={() => router.push("/dashboard")}>
                Back to Dashboard
              </Button>
            </CardFooter>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{quiz.title}</h1>
          <p className="text-muted-foreground">{quiz.description}</p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Question {currentQuestionIndex + 1}</CardTitle>
            <CardDescription className="text-lg font-medium text-foreground">{currentQuestion.text}</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={selectedOptions[currentQuestionIndex]}
              onValueChange={handleOptionSelect}
              className="space-y-3"
            >
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 rounded-md border p-3 hover:bg-muted/50">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={goToPreviousQuestion} disabled={currentQuestionIndex === 0}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          {currentQuestionIndex === quiz.questions.length - 1 ? (
            <Button onClick={handleSubmitQuiz} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Quiz"}
            </Button>
          ) : (
            <Button onClick={goToNextQuestion}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

