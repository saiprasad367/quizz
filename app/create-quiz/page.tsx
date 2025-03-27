"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { PlusCircle, Trash2, MoveUp, MoveDown } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

interface Question {
  id: string
  text: string
  options: { id: string; text: string; isCorrect: boolean }[]
}

export default function CreateQuiz() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: "q1",
      text: "",
      options: [
        { id: "o1", text: "", isCorrect: false },
        { id: "o2", text: "", isCorrect: false },
        { id: "o3", text: "", isCorrect: false },
        { id: "o4", text: "", isCorrect: false },
      ],
    },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  const addQuestion = () => {
    const newId = `q${questions.length + 1}`
    setQuestions([
      ...questions,
      {
        id: newId,
        text: "",
        options: [
          { id: `${newId}-o1`, text: "", isCorrect: false },
          { id: `${newId}-o2`, text: "", isCorrect: false },
          { id: `${newId}-o3`, text: "", isCorrect: false },
          { id: `${newId}-o4`, text: "", isCorrect: false },
        ],
      },
    ])
  }

  const removeQuestion = (questionId: string) => {
    if (questions.length === 1) {
      toast({
        title: "Cannot remove",
        description: "A quiz must have at least one question.",
        variant: "destructive",
      })
      return
    }
    setQuestions(questions.filter((q) => q.id !== questionId))
  }

  const moveQuestion = (questionId: string, direction: "up" | "down") => {
    const index = questions.findIndex((q) => q.id === questionId)
    if ((direction === "up" && index === 0) || (direction === "down" && index === questions.length - 1)) {
      return
    }

    const newQuestions = [...questions]
    const newIndex = direction === "up" ? index - 1 : index + 1
    const temp = newQuestions[index]
    newQuestions[index] = newQuestions[newIndex]
    newQuestions[newIndex] = temp
    setQuestions(newQuestions)
  }

  const updateQuestionText = (questionId: string, text: string) => {
    setQuestions(questions.map((q) => (q.id === questionId ? { ...q, text } : q)))
  }

  const updateOptionText = (questionId: string, optionId: string, text: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((o) => (o.id === optionId ? { ...o, text } : o)),
            }
          : q,
      ),
    )
  }

  const setCorrectOption = (questionId: string, optionId: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((o) => ({
                ...o,
                isCorrect: o.id === optionId,
              })),
            }
          : q,
      ),
    )
  }

  const validateQuiz = () => {
    if (!title.trim()) {
      toast({
        title: "Missing title",
        description: "Please provide a title for your quiz.",
        variant: "destructive",
      })
      return false
    }

    for (const question of questions) {
      if (!question.text.trim()) {
        toast({
          title: "Empty question",
          description: "All questions must have text.",
          variant: "destructive",
        })
        return false
      }

      const emptyOptions = question.options.some((o) => !o.text.trim())
      if (emptyOptions) {
        toast({
          title: "Empty options",
          description: "All options must have text.",
          variant: "destructive",
        })
        return false
      }

      const hasCorrectOption = question.options.some((o) => o.isCorrect)
      if (!hasCorrectOption) {
        toast({
          title: "No correct answer",
          description: "Each question must have a correct answer selected.",
          variant: "destructive",
        })
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateQuiz()) return

    try {
      setIsSubmitting(true)

      // Prepare quiz data for Firestore
      const quizData = {
        title,
        description,
        questions: questions.map((q) => ({
          text: q.text,
          options: q.options.map((o) => ({
            text: o.text,
            isCorrect: o.isCorrect,
          })),
        })),
        createdBy: user?.uid,
        createdAt: serverTimestamp(),
        isPublic: true,
      }

      // Add to Firestore
      const docRef = await addDoc(collection(db, "quizzes"), quizData)

      toast({
        title: "Quiz created!",
        description: "Your quiz has been successfully created.",
      })

      router.push(`/quiz/${docRef.id}`)
    } catch (error) {
      console.error("Error creating quiz:", error)
      toast({
        title: "Error",
        description: "Failed to create quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create a New Quiz</h1>
          <p className="text-muted-foreground">Design your quiz with questions and answers</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Details</CardTitle>
                <CardDescription>Provide basic information about your quiz</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Quiz Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a title for your quiz"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what your quiz is about"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {questions.map((question, qIndex) => (
              <Card key={question.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle>Question {qIndex + 1}</CardTitle>
                    <CardDescription>Add your question and possible answers</CardDescription>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveQuestion(question.id, "up")}
                      disabled={qIndex === 0}
                    >
                      <MoveUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveQuestion(question.id, "down")}
                      disabled={qIndex === questions.length - 1}
                    >
                      <MoveDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeQuestion(question.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`question-${question.id}`}>Question</Label>
                    <Textarea
                      id={`question-${question.id}`}
                      value={question.text}
                      onChange={(e) => updateQuestionText(question.id, e.target.value)}
                      placeholder="Enter your question"
                      required
                    />
                  </div>
                  <div className="space-y-3">
                    <Label>Options</Label>
                    {question.options.map((option, oIndex) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <div className="flex-1">
                          <Input
                            value={option.text}
                            onChange={(e) => updateOptionText(question.id, option.id, e.target.value)}
                            placeholder={`Option ${oIndex + 1}`}
                            required
                          />
                        </div>
                        <Button
                          type="button"
                          variant={option.isCorrect ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCorrectOption(question.id, option.id)}
                        >
                          {option.isCorrect ? "Correct" : "Mark as Correct"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button type="button" variant="outline" className="flex items-center" onClick={addQuestion}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Another Question
            </Button>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating Quiz..." : "Create Quiz"}
              </Button>
            </div>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  )
}

