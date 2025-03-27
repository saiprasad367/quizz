import { Brain, Trophy, BarChart3, Users } from "lucide-react"

export function FeatureSection() {
  const features = [
    {
      icon: <Brain className="h-10 w-10 text-purple-600" />,
      title: "Create Custom Quizzes",
      description: "Design engaging quizzes with multiple-choice questions tailored to your needs.",
    },
    {
      icon: <Trophy className="h-10 w-10 text-indigo-600" />,
      title: "Compete on Leaderboards",
      description: "Challenge others and see how you rank against quiz takers from around the world.",
    },
    {
      icon: <BarChart3 className="h-10 w-10 text-purple-600" />,
      title: "Track Performance",
      description: "Get detailed analytics on quiz performance and identify areas for improvement.",
    },
    {
      icon: <Users className="h-10 w-10 text-indigo-600" />,
      title: "User Authentication",
      description: "Secure login system for quiz creators and participants to track progress.",
    },
  ]

  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Powerful Features for Quiz Enthusiasts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-background rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

