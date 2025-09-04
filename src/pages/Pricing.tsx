
import { useAuth } from '../contexts/AuthContext'
import { Check, BookOpen, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Pricing() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const plans = [
    {
      name: 'Free',
      price: 0,
      period: 'forever',
      features: [
        'Up to 5 compilations per month',
        'Basic export (TXT format)',
        'Browser extension access',
        'Community support'
      ],
      current: true
    },
    {
      name: 'Premium',
      price: 9.99,
      period: 'month',
      features: [
        'Unlimited compilations',
        'Advanced export (Markdown, PDF)',
        'Priority browser extension',
        'Email support',
        'Advanced organization tools',
        'Collaboration features'
      ],
      popular: true
    },
    {
      name: 'Pro',
      price: 19.99,
      period: 'month',
      features: [
        'Everything in Premium',
        'AI-powered summarization',
        'Advanced analytics',
        'API access',
        'Custom integrations',
        'Priority support'
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-background-primary px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 text-text-secondary hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-accent-500 mr-3" />
            <h1 className="text-2xl font-bold text-white">RedditScribe</h1>
          </div>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Choose Your Plan</h2>
          <p className="text-xl text-text-secondary">Capture and organize Reddit insights effortlessly</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-background-secondary rounded-xl p-8 card-shadow ${
                plan.popular ? 'ring-2 ring-accent-500' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-accent-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">${plan.price}</span>
                  <span className="text-text-secondary">/{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-accent-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-text-secondary">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                  plan.current
                    ? 'bg-background-tertiary text-text-secondary cursor-not-allowed'
                    : plan.popular
                    ? 'bg-accent-500 hover:bg-accent-600 text-white'
                    : 'bg-background-tertiary text-white hover:bg-gray-600'
                }`}
                disabled={plan.current}
              >
                {plan.current ? 'Current Plan' : `Upgrade to ${plan.name}`}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-text-secondary">
            All plans include a 14-day free trial. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  )
}